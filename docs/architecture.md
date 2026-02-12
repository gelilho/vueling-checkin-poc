# Architecture Documentation

## Overview

The Vueling Invisible Check-In is a single-page application built with Next.js 16 (App Router) that demonstrates an automated airline check-in pipeline. The system uses a layered architecture with strict separation of concerns.

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│                   App Layer                      │
│     page.tsx  •  layout.tsx  •  globals.css      │
├─────────────────────────────────────────────────┤
│                Components Layer                  │
│  PipelineView  •  PipelineStage  •  DataReveal   │
│  PassengerSelector  •  ChannelSelector           │
│  LiveScanStage  •  BoardingPass  •  Camera       │
├─────────────────────────────────────────────────┤
│                  Hooks Layer                     │
│              usePipeline (orchestration)          │
├─────────────────────────────────────────────────┤
│               Business Logic Layer               │
│  pipeline/    •  gemini/    •  validator.ts       │
│  reducer.ts      client.ts    mrz-parser.ts      │
│  stages/         prompts.ts                      │
├─────────────────────────────────────────────────┤
│                 API Routes Layer                  │
│  /api/scan-passport  •  /api/validate            │
│  /api/generate-nudge •  /api/generate-briefing   │
├─────────────────────────────────────────────────┤
│              Foundation Layer                     │
│  types/  •  constants/  •  lib/utils/  •  data/  │
└─────────────────────────────────────────────────┘
```

## Design Patterns

### 1. State Machine (Reducer Pattern)

The pipeline uses `useReducer` with a pure reducer function for predictable state transitions:

```
lib/pipeline/reducer.ts
├── PipelineAction (discriminated union of 6 action types)
├── createInitialState() → PipelineState
└── pipelineReducer(state, action) → PipelineState
```

**Why**: Complex multi-stage state transitions are error-prone with `useState`. The reducer makes every state change explicit, testable, and traceable.

### 2. Command Pattern (Stage Executors)

Each pipeline stage is an independent async function (command) that receives context and returns a result:

```
lib/pipeline/stages/
├── channels.ts   → executeChannels(channels)
├── scan.ts       → executeScanMocked(ctx) | executeScanLive(image)
├── checkin.ts    → executeCheckin(ctx)
└── delivery.ts   → executeDelivery(ctx, channels)
```

**Why**: Each stage can be tested, replaced, or reordered independently. New stages can be added without modifying existing code (Open/Closed Principle).

### 3. Custom Hook Pattern (Logic Extraction)

`usePipeline` hook encapsulates all orchestration logic, exposing a clean API to the UI:

```
hooks/usePipeline.ts
├── State: pipeline state, channels, derived values
├── Actions: runPipeline(), resolveLiveScan(), dispatch()
└── Computed: totalDuration, getStageDuration()
```

**Why**: Components become pure UI renderers with zero business logic. The hook is the single source of truth for pipeline behavior.

### 4. Barrel Export Pattern

Every module directory has an `index.ts` that re-exports its public API:

```typescript
// Usage: clean, readable imports
import type { Flight, Passenger } from "@/types";
import { API_ENDPOINTS, STAGE_DURATIONS } from "@/constants";
import { scanPassport, generateText } from "@/lib/gemini";
import { executeCheckin } from "@/lib/pipeline";
```

**Why**: Consumers don't need to know internal file structure. Refactoring internals doesn't break imports.

### 5. Graceful Degradation

Every AI call has a try/catch with a meaningful fallback:

```typescript
async function fetchConfirmationMessage(ctx): Promise<string> {
  try {
    const res = await fetch(API_ENDPOINTS.GENERATE_NUDGE, { ... });
    const data = await res.json();
    return data.message;
  } catch {
    return `You're checked in for ${ctx.flight}. Seat ${ctx.seat}.`;
  }
}
```

**Why**: Gemini API outages should not break the demo. Fallback messages ensure the pipeline always completes.

## Module Dependency Graph

Arrows indicate "depends on" (imports from):

```
page.tsx
  └── PipelineView
        ├── usePipeline (hook)
        │     ├── pipeline/reducer
        │     ├── pipeline/stages/*
        │     ├── constants
        │     └── types
        ├── PipelineStage
        │     ├── DataReveal
        │     ├── lib/utils (formatDuration)
        │     └── types (StageStatus)
        ├── PassengerSelector
        │     └── constants (SCENARIO_META)
        ├── ChannelSelector
        │     └── constants (CHANNELS)
        ├── LiveScanStage
        │     ├── Camera
        │     └── constants (API_ENDPOINTS)
        └── BoardingPass

API Routes
  ├── scan-passport → lib/gemini, lib/utils, types
  ├── validate → lib/validator
  ├── generate-nudge → lib/gemini, lib/utils, types
  └── generate-briefing → lib/gemini, lib/utils, types

lib/validator → types, lib/utils (isFuzzyMatch)
lib/mrz-parser → types, constants
lib/gemini/client → lib/utils (fillTemplate, stripDataUrlPrefix)
```

## Types Architecture

Types are organized by domain boundary:

```
types/
├── domain/           # Business entities
│   ├── passenger.ts  # Passenger, ParsedPassport
│   ├── flight.ts     # Flight
│   ├── route.ts      # RouteInfo (destination rules)
│   └── validation.ts # ValidationIssue, ValidationResult
├── api/              # API contract types
│   ├── scan.ts       # PassportScanResponse, GeminiPassportData
│   ├── nudge.ts      # NudgeType, GenerateNudgeRequest/Response
│   └── briefing.ts   # GenerateBriefingRequest, BriefingData
└── ui/               # UI state types
    └── pipeline.ts   # StageId, StageStatus, PipelineState,
                      # PipelineContext, StageResult variants
```

**Convention**: Domain types are pure data. API types define request/response contracts. UI types define component state shapes.

## Constants Architecture

All magic values are centralized:

```
constants/
├── channels.ts    # Channel definitions (label, icon, id)
├── delays.ts      # Timing: stage minimums, inter-stage gaps
├── api.ts         # API endpoint URLs
├── scenarios.ts   # Scenario metadata (colors, icons)
├── stage-meta.ts  # Stage titles, icons, ordering
└── app.ts         # App config, defaults, camera settings
```

**Rule**: No literal strings or numbers in business logic. Everything comes from constants.

## Validation Rules Engine

The validator (`lib/validator.ts`) runs 5 checks:

| Rule | Logic |
|------|-------|
| Passport expiry | Compare against route's `minPassportValidity` (e.g., UK = 6 months) |
| Visa required | Check if nationality needs visa for destination |
| ETIAS required | EU entry system check for non-EU nationals |
| eVisitor required | Australian entry check |
| Name matching | Levenshtein distance between passport name and booking name |

Routes define their own requirements in `data/routes.json`.

## Gemini AI Integration

Single API dependency: Google Gemini 2.0 Flash.

| Capability | Endpoint | Gemini Mode |
|-----------|----------|-------------|
| Passport scan | `/api/scan-passport` | Vision (image → structured JSON) |
| Check-in confirmation | `/api/generate-nudge` | Text generation |
| Document issue explanation | `/api/generate-nudge` | Text generation |
| Bag upsell nudge | `/api/generate-nudge` | Text generation |
| Airport briefing | `/api/generate-briefing` | JSON generation |

All prompts use a template variable system (`{{key}}` syntax) defined in `lib/gemini/prompts.ts` and filled at runtime with `fillTemplate()` from `lib/utils/string.ts`.

## Animation System

CSS keyframe animations defined in `globals.css`:

| Animation | Purpose |
|-----------|---------|
| `stage-glow` | Yellow pulse on active stage |
| `cursor-blink` | Typewriter cursor in DataReveal |
| `scale-in` | Boarding pass entrance |
| `expand-in` | Stage card expansion |
| `field-reveal` | Data field appearance |
| `connector-fill` | Vertical line between stages |
| `float` | Subtle floating effect |

All timing values are in `constants/delays.ts` to keep animations synchronized with pipeline execution.

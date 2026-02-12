# Vueling Invisible Check-In

> What if check-in just disappeared?

AI-powered invisible check-in proof of concept for **Vueling** at **4YFN / MWC 2026**.

## The Idea

Instead of asking passengers to check in manually, the system does it automatically:

1. **Channel Preferences** — Passenger chooses how to receive their boarding pass
2. **Identity Scan** — AI reads passport via camera or pre-loaded demo data
3. **Automatic Check-In** — Documents validated against destination rules, seat assigned, AI confirmation
4. **Delivery & Extras** — Boarding pass delivered, smart bag nudge generated

The entire pipeline runs on a single screen with animated stages, real Gemini API calls, and zero passenger effort.

## Demo Scenarios

| Scenario | What happens |
|----------|-------------|
| **María** (BCN to Rome) | Happy path. All checks pass, smooth check-in |
| **The Smiths** (LGW to Barcelona) | Family of 4, no bags. Gets AI-generated bag nudge |
| **Live Scan** | Scan your own passport with the camera. Real Gemini vision |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| AI | Google Gemini 2.0 Flash (vision + text) |
| Deploy | Vercel |

**Single API dependency:** Gemini. No database. No backend services.

## Quick Start

```bash
npm install

echo "GEMINI_API_KEY=your_key_here" > .env.local

npm run dev
```

Open http://localhost:3000

## Project Structure

See [docs/architecture.md](docs/architecture.md) for full architecture documentation.

See [docs/pipeline-diagram.md](docs/pipeline-diagram.md) for pipeline flow diagrams.

```
vueling-checkin-poc/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Single-page orchestration shell
│   ├── layout.tsx               # Root layout with Vueling header
│   ├── globals.css              # Theme + animations
│   └── api/                     # Backend API routes
│       ├── scan-passport/       # Gemini vision passport reader
│       ├── validate/            # Document validation engine
│       ├── generate-briefing/   # AI airport briefing
│       └── generate-nudge/      # AI messages (confirm, issues, bag)
├── components/                   # React UI components
│   ├── PipelineView.tsx         # Pipeline orchestration UI
│   ├── PipelineStage.tsx        # Single stage card (4 visual states)
│   ├── DataReveal.tsx           # Typewriter animation for data fields
│   ├── PassengerSelector.tsx    # Scenario picker cards
│   ├── ChannelSelector.tsx      # Delivery channel toggles
│   ├── LiveScanStage.tsx        # Camera integration for live scan
│   ├── BoardingPass.tsx         # Boarding pass card with QR
│   └── Camera.tsx               # MediaStream camera capture
├── hooks/                        # Custom React hooks
│   └── usePipeline.ts          # Pipeline state machine + orchestration
├── lib/                          # Business logic
│   ├── gemini/                  # Gemini AI module
│   │   ├── client.ts           # API client (vision + text + JSON)
│   │   ├── prompts.ts          # 5 prompt templates
│   │   └── index.ts
│   ├── pipeline/                # Pipeline orchestration module
│   │   ├── reducer.ts          # State machine reducer
│   │   ├── stages/             # Stage executors
│   │   │   ├── channels.ts
│   │   │   ├── scan.ts
│   │   │   ├── checkin.ts
│   │   │   ├── delivery.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── utils/                   # Shared utilities
│   │   ├── format.ts           # Duration formatting, delay
│   │   ├── string.ts           # Levenshtein, fuzzy match, templates
│   │   └── index.ts
│   ├── validator.ts             # Document validation rules engine
│   └── mrz-parser.ts           # Passport MRZ data parser
├── types/                        # TypeScript interfaces
│   ├── domain/                  # Business domain types
│   │   ├── passenger.ts
│   │   ├── flight.ts
│   │   ├── route.ts
│   │   └── validation.ts
│   ├── api/                     # API request/response types
│   │   ├── scan.ts
│   │   ├── nudge.ts
│   │   └── briefing.ts
│   └── ui/                      # UI state types
│       └── pipeline.ts
├── constants/                    # Application constants
│   ├── channels.ts              # Channel config (labels, icons)
│   ├── delays.ts                # Animation timing
│   ├── api.ts                   # API endpoint URLs
│   ├── scenarios.ts             # Scenario metadata
│   ├── stage-meta.ts            # Pipeline stage titles
│   └── app.ts                   # App config, defaults
├── data/                         # Demo data (JSON)
│   ├── passengers.json
│   ├── routes.json
│   └── flights.json
└── docs/                         # Documentation
    ├── architecture.md
    └── pipeline-diagram.md
```

## Design Principles

- **Single Responsibility** — Each file has one job
- **Barrel Exports** — Clean imports via index.ts: `import type { Flight } from "@/types"`
- **No Duplication** — Constants defined once, imported everywhere
- **Hooks Pattern** — Business logic in `usePipeline`, components are UI-only
- **Graceful Degradation** — Fallback responses if Gemini is down

## License

Private. 4YFN/MWC 2026 demo purposes only.

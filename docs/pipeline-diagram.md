# Pipeline Flow Diagrams

Visual documentation of the Invisible Check-In pipeline architecture.

## Pipeline Sequence (High-Level)

```
┌─────────────────────┐
│   Passenger Select   │
│  (María/João/Smiths/ │
│     Live Scan)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Stage 1: Channels   │
│  Select delivery     │
│  preferences         │
│  (email/SMS/push/app)│
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Stage 2: Identity   │
│  Scan passport data  │
│  (mocked or live)    │
│  → Typewriter reveal │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Stage 3: Check-In   │
│  Validate documents  │
│  Assign seat         │
│  AI confirmation     │
└─────────┬───────────┘
          │
     ┌────┴────┐
     │         │
  ✅ Valid   ❌ Invalid
     │         │
     ▼         ▼
┌─────────┐ ┌──────────┐
│ Stage 4 │ │  BLOCKED │
│Delivery │ │  AI issue│
│+ Extras │ │  explain │
└─────────┘ └──────────┘
```

## State Machine

Each pipeline stage transitions through these visual states:

```
                    ┌──────────┐
                    │  waiting │  (gray, collapsed)
                    └────┬─────┘
                         │ stage activated
                         ▼
                    ┌──────────┐
                    │ running  │  (yellow glow, expanded, typewriter data)
                    └────┬─────┘
                         │
                   ┌─────┴──────┐
                   │            │
                   ▼            ▼
             ┌──────────┐ ┌──────────┐
             │completed │ │  error   │
             │(green ✓) │ │(red/amber│
             │compacted │ │ expanded)│
             └──────────┘ └──────────┘
```

### Reducer Actions

```
SET_STAGE_STATUS    →  Transition a stage between waiting/running/completed/error
SET_STAGE_DATA      →  Populate key-value data for typewriter reveal
SET_STAGE_SUMMARY   →  Set the one-line summary after completion
SET_STAGE_DURATION  →  Record execution time (e.g., "1.2s")
SET_PHASE           →  Switch between "select" and "running" modes
RESET               →  Return to initial state for new scenario
```

## API Call Sequence

Shows which API endpoints are called at each pipeline stage:

```
Stage 1: Channels
  └── No API calls (local state only)

Stage 2: Identity Scan
  ├── [Mocked] → Read from passengers.json (no API)
  └── [Live]   → POST /api/scan-passport
                  └── Gemini 2.0 Flash Vision
                      └── Reads MRZ + passport face page

Stage 3: Check-In
  ├── POST /api/validate
  │   └── Rules engine: passport expiry, visa/ETIAS, name match
  │
  ├── [If valid]   → POST /api/generate-nudge (type: checkin_confirmation)
  │                   └── Gemini 2.0 Flash Text
  │
  └── [If invalid] → POST /api/generate-nudge (type: document_issue)
                      └── Gemini 2.0 Flash Text

Stage 4: Delivery + Extras
  ├── Render BoardingPass component (no API)
  ├── Show delivery channel confirmations
  └── [If no checked bag] → POST /api/generate-nudge (type: bag_nudge)
                              └── Gemini 2.0 Flash Text
```

## Demo Scenarios Flow

### María (Happy Path — BCN → Rome)

```
Channels ──✅──→ Scan ──✅──→ Check-In ──✅──→ Delivery
  All          Passport     All checks     Boarding pass
  channels     valid        pass           + bag nudge
  selected     (2027)       Seat 14A       (no bag)
```

### João (Blocked — BCN → London)

```
Channels ──✅──→ Scan ──✅──→ Check-In ──❌
  All          Passport     Passport expires in 44 days
  channels     expiry:      UK requires 6 months validity
  selected     2025-03-28   → AI explains the issue
```

### The Smiths (Family — LGW → Barcelona)

```
Channels ──✅──→ Scan ──✅──→ Check-In ──✅──→ Delivery
  All          Passport     All checks     Boarding pass
  channels     valid        pass           + bag nudge
  selected     (2028)       Seats 22A/22B  (family, no bags)
```

### Live Scan (Real Passport)

```
Channels ──✅──→ Scan ──📷──→ Check-In ──✅/❌──→ Delivery
  User         Camera       Validates        Depends on
  picks        opens        against real     validation
  channels     → Gemini     destination      result
               Vision       rules
```

## Timing

Each stage has a minimum execution time for smooth visual pacing:

```
Stage 1: Channels     →  min 800ms
Stage 2: Scan         →  min 1500ms (mocked), variable (live)
Stage 3: Check-In     →  min 2000ms (includes API calls)
Stage 4: Delivery     →  min 1200ms
Inter-stage pause     →  300ms

Typical total: 6-10 seconds
```

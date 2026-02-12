# Pipeline Flow Diagrams

Visual documentation of the Invisible Check-In pipeline architecture.

## Orchestration Pipeline (8-Stage)

This is the main pipeline used for automated check-in processing.

```
┌──────────────────────────────────────┐
│         Flight / Passenger           │
│      Select from dashboard           │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Stage 1: Booking Retrieval          │
│  PNR lookup, flight details, date    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Stage 2: Passenger Information      │
│  Name, nationality, seat, companion  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Stage 3: Document Verification      │
│  POST /api/validate                  │
│  ┌────────────────────────────────┐  │
│  │ ✓ Passport number (5-12 chars)│  │
│  │ ✓ Expiry date valid           │  │
│  │ ✓ Passport not expired        │  │
│  │ ✓ Date of birth valid         │  │
│  │ ✓ Age >= 18                   │  │
│  │ ✓ Name match (fuzzy)         │  │
│  │ ⚠ ETIAS / eVisitor warnings  │  │
│  └────────────────────────────────┘  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Stage 4: Baggage Check              │
│  Checked bag status, weight          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Stage 5: Delivery Preferences       │
│  Email, SMS, push, in-app            │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Stage 6: Automatic Check-In         │
│  Seat assignment + AI confirmation   │
└──────────────┬───────────────────────┘
               │
          ┌────┴────┐
          │         │
       ✅ Valid   ❌ Invalid
          │         │
          ▼         ▼
┌──────────────┐ ┌───────────────────┐
│  Stage 7:    │ │  BLOCKED          │
│  Post        │ │  AI-generated     │
│  Check-In    │ │  issue explanation│
│  Comms       │ │  Stage 7: skipped │
│  (boarding   │ │  Stage 8: skipped │
│   pass)      │ └───────────────────┘
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Stage 8: AI Smart Nudge             │
│  ✦ AI-Generated Content (Gemini)     │
│  ┌────────────────────────────────┐  │
│  │ No bag → Bag upsell push      │  │
│  │ Has bag → Travel tip push     │  │
│  │ Fallback if Gemini unavailable│  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

## Validation Rules Detail

```
POST /api/validate
│
├── 1. Passport number format
│   └── 5–12 alphanumeric chars (A-Z, 0-9)
│
├── 2. Expiry date validity
│   └── Must parse as a valid date
│
├── 3. Date of birth validity
│   └── Must parse as a valid date
│
├── 4. Age check
│   └── Passenger age >= 18 at travel date
│
├── 5. Passport expiry vs route requirements
│   └── Expiry must be N months after travel
│       (N = route.passport_validity_months)
│
├── 6. ETIAS / eVisitor
│   └── Warning for non-EU nationals
│
└── 7. Name matching
    └── Fuzzy match: booking name ↔ passport name
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

## API Call Sequence (Orchestration Pipeline)

```
Stage 1: Booking Retrieval
  └── Read from passengers.json + flights.json (no API)

Stage 2: Passenger Information
  └── Read from passengers.json (no API)

Stage 3: Document Verification
  └── POST /api/validate
      └── Rules engine: passport number, expiry, DOB, age, name match

Stage 4: Baggage Check
  └── Read from passengers.json (no API)

Stage 5: Delivery Preferences
  └── Read from passengers.json (no API)

Stage 6: Automatic Check-In
  ├── [If docs valid]   → POST /api/generate-nudge (type: checkin_confirmation)
  │                       └── Gemini 2.0 Flash Text
  └── [If docs invalid] → POST /api/generate-nudge (type: document_issue)
                           └── Gemini 2.0 Flash Text

Stage 7: Post Check-In Comms
  ├── Render BoardingPass component (no API)
  └── Show delivery channel confirmations

Stage 8: AI Smart Nudge
  └── POST /api/generate-nudge (type: bag_nudge or travel_tip)
      ├── Gemini 2.0 Flash Text
      └── Fallback: static template if Gemini unavailable
```

## Demo Scenarios Flow

### Maria Garcia Lopez (Happy Path — BCN → Rome)

```
Booking ──✅──→ Passenger ──✅──→ Doc Verify ──✅──→ Bags ──✅──→ Delivery ──✅──→ Check-In ──✅──→ Comms ──✅──→ AI Nudge
  PNR         Name, ESP      All valid        No bag    Email,     Seat 14A      Boarding    ✦ Bag upsell
  VY-M2026A   Seat 14A       Passport 2027             push,app   AI confirm    pass sent   (AI-generated)
```

### James Smith (Family — LGW → Barcelona)

```
Booking ──✅──→ Passenger ──✅──→ Doc Verify ──✅──→ Bags ──✅──→ Delivery ──✅──→ Check-In ──✅──→ Comms ──✅──→ AI Nudge
  PNR         Name, GBR      All valid        No bag    All        Seat 8A       Boarding    ✦ Bag upsell
  VY-S2026B   Seat 8A        Passport 2029             channels   AI confirm    pass sent   (AI-generated)
```

### Claire Dupont (BLOCKED — Expired Passport)

```
Booking ──✅──→ Passenger ──✅──→ Doc Verify ──❌──→ Bags ──✅──→ Delivery ──✅──→ Check-In ──❌──→ Comms ──⏭──→ AI Nudge
  PNR         Name, FRA      PASSPORT         Has bag   Email,     BLOCKED       Skipped     ✦ Skipped
  VY-D2026C   Seat 22F       EXPIRED                   push       (doc issue)   (blocked)   (blocked)
                              Dec 2025
```

## Timing

Each stage has a minimum execution time for smooth visual pacing:

```
Stage 1: Booking Retrieval      →  min 1000ms
Stage 2: Passenger Information  →  min 800ms
Stage 3: Document Verification  →  min 1500ms (includes /api/validate)
Stage 4: Baggage Check          →  min 600ms
Stage 5: Delivery Preferences   →  min 600ms
Stage 6: Automatic Check-In     →  min 1800ms (includes AI generation)
Stage 7: Post Check-In Comms    →  min 1200ms
Stage 8: AI Smart Nudge         →  min 1500ms (includes AI generation)
Inter-stage pause               →  400ms

Typical total: 11-15 seconds
```

## Technology Stack

```
Frontend:   Next.js 16.1.6 (App Router) + TypeScript strict + Tailwind CSS 4
AI:         Google Gemini 2.0 Flash (Vision + Text)
Storage:    localStorage (pipeline logs, booking submissions)
Export:     CSV download (pipeline execution logs, booking data)
Runtime:    Node.js v20 (no Python / FastAPI)
```

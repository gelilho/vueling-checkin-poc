# Business Impact — Invisible Check-In for Vueling

> Proof of Concept for 4YFN / MWC 2026

---

## The Bigger Picture: Decision Engine

Invisible Check-In is the **first module** of a broader platform: the **Decision Engine**.

The Decision Engine is an AI-powered orchestration layer that sits between airline systems and passengers. It continuously monitors data signals — bookings, document status, flight changes, weather, passenger behaviour — and **decides when and how to act** on behalf of the customer, before the customer even knows there is something to do.

### Decision Engine Modules

| Module | Trigger | Action | Status |
|--------|---------|--------|--------|
| **Invisible Check-In** | 48h before departure | Auto check-in + boarding pass delivery | POC (this project) |
| Disruption Manager | Flight delay / cancellation detected | Proactive rebooking + comms | Planned |
| Smart Upsell | Booking profile + trip context | Contextual ancillary offers at the right moment | Planned |
| Document Pre-Validator | Booking confirmed for international route | Verify docs meet destination requirements early | Planned |
| Loyalty Activator | Passenger behaviour patterns | Targeted retention offers before churn | Planned |

### Why a Decision Engine?

Airlines today are **reactive** — they wait for the passenger to act (check in, call support, complain). The Decision Engine flips this model: it **anticipates** what needs to happen and executes automatically.

- **For the passenger**: friction disappears. Things just work.
- **For the airline**: lower ops cost, higher NPS, more ancillary revenue, fewer support cases.
- **For IAG**: one platform, multiple airlines, shared intelligence.

Invisible Check-In proves the architecture. The same pipeline engine, stage-based orchestration, and AI integration pattern scale to every module above.

---

## Vueling at a Glance (2024)

| Metric | Value | Source |
|--------|-------|--------|
| Passengers | 38.2M | IAG Full Year Results 2024 |
| Revenue | 3.26B | IAG Full Year Results 2024 |
| Flights / year | 223K | IAG Full Year Results 2024 |
| Destinations | 105+ | Vueling ESG Report 2024 |
| Fleet | 131 aircraft (A320) | CAPA Centre for Aviation |
| On-time performance | 81.2% | AirAdvisor |
| Load factor | 91% | IAG Full Year Results 2024 |
| Market position | 4th largest LCC in Europe | CAPA Centre for Aviation |

---

## The Problem

### 1. 30% still check in at the airport

Out of 38.2M passengers (2024), roughly 30% still end up at the airport counter or kiosk. That is **~11.4M passengers** requiring staff, kiosks occupied, queues forming. All avoidable operational load.

### 2. 5-10 minutes wasted per passenger

On average, a self-service check-in takes 5-10 minutes per passenger (find kiosk, enter booking ref, select seat, print pass). Across 11.4M counter passengers, that is over **1 million hours** of collective passenger time wasted annually on a process that could be zero.

### 3. Check-in generates support cases

Passengers who miss the check-in window, cannot figure out the app, or have document issues flood the call center. Solving check-in upstream eliminates a major category of inbound support.

---

## The Solution

**Check in every opted-in passenger automatically, 48 hours before departure.**

No action required. Boarding pass delivered to their preferred channel. 8 automated stages, completed in under 15 seconds.

---

## Quantified Impact

### KPI 1: Passenger Time Saved

| Metric | Value |
|--------|-------|
| Current check-in time | 5-10 min per passenger |
| With invisible check-in | 0 seconds |
| Passengers at 50% opt-in | 19.1M |
| Annual hours saved | 1.6-3.2M hours |
| Confidence | **High** (SITA 2023 data) |

**Calculation:** Today average 5-10 min (kiosk/app check-in). With invisible check-in: 0 seconds. The passenger does nothing. Boarding pass arrives automatically 48h before. Across 38.2M passengers, even at 50% opt-in, that is 19.1M passengers saving 5-10 min each = 1.6-3.2M hours of passenger time returned annually.

---

### KPI 2: NPS / Customer Satisfaction

| Metric | Value |
|--------|-------|
| Expected NPS uplift | +10-15 points |
| Confidence | **Directional** (industry benchmarks) |

**Calculation:** Check-in is a top-5 NPS driver in aviation (IATA Global Passenger Survey). Airlines with best-in-class digital check-in score 10-15 points higher in NPS. Invisible check-in eliminates the friction entirely. Vueling's current customer satisfaction is low (1.2/5 on complaint platforms). Major opportunity to move the needle through experience, not marketing.

---

### KPI 3: Counter Staff Time Reduction

| Metric | Value |
|--------|-------|
| Reduction in check-in agents | ~30% |
| Counter passengers today | 11.4M / year |
| After auto check-in (50-70%) | 3.4-5.7M |
| Confidence | **High** (direct calculation) |

**Calculation:** 11.4M passengers check in at counters annually. If we auto-check-in 50-70% of them before they reach the airport, counter volume drops to ~3.4-5.7M. That is roughly 30% fewer agents needed on check-in duty, redeployed to gate ops, disruption handling, and premium services.

---

### KPI 4: Support Case Reduction

| Metric | Value |
|--------|-------|
| Reduction in check-in cases | ~20-30% |
| Confidence | **Directional** (industry data) |

**Calculation:** Check-in issues (missed window, app confusion, document problems) are a top inbound category. By auto-checking in passengers 48h before and sending AI nudges for document issues, we eliminate the most common failure points. Vueling has 60K+ cumulative complaints on AirAdvisor, many check-in related.

---

### KPI 5: Ancillary Revenue Opportunity

| Metric | Value |
|--------|-------|
| Addressable market | ~22.9M passengers (60% with no checked bag) |
| Conversion at 3-5% | 687K-1.15M bag sales |
| Revenue potential | Up to +22M/year |
| Confidence | **Directional** (industry conversion rates) |

**Calculation:** European LCCs average 20-25 per passenger in ancillary revenue (IdeaWorksCompany). If 60% of Vueling passengers have no checked bag, that is ~22.9M passengers. The AI nudge at check-in completion is a high-intent moment. Industry conversion rates on contextual upsells: 3-5%. At average bag price (14-59 online), even conservative 3% conversion on 22.9M passengers generates significant incremental revenue. IAG specifically noted "big ancillary improvements at Vueling" in their 2024 results.

---

### KPI 6: Pipeline Execution Time

| Metric | Value |
|--------|-------|
| Full 8-stage pipeline | < 15 seconds |
| Stages | Booking retrieval, passenger data, document verification, bag status, delivery preferences, auto check-in, comms, AI nudge |
| Confidence | **High** (direct measurement) |

---

## Operations View

### Free Up Airport Staff
Every counter check-in is a Vueling agent occupied for 15+ minutes on a task that adds no value. Redeploying those agents to gate management, disruption handling, and premium services is a direct upgrade to operations quality.

### Peace of Mind = NPS
No alarms to set, no 48h window to remember. The passenger books a flight and the next thing they receive is their boarding pass. Check-in becomes invisible.

### Faster Airport Flow
Pre-checked-in passengers skip the check-in hall entirely. Less congestion, fewer missed flights from queue delays, reduced IROPS cost from late boarders. At 223K flights/year, even small improvements cascade.

### Upsell at the Right Moment
The check-in confirmation is a high-attention moment. AI-powered bag upsells here convert better than email campaigns. With ~60% of Vueling passengers having no checked bag, the addressable market is ~22.9M passengers/year.

---

## Privacy-First by Design

Privacy is at the core of the customer experience. The pipeline is built so that **document images are never stored**.

### How It Works

1. **Image capture**: The passenger scans their passport, DNI, or ID card via camera or upload.
2. **AI extraction**: Google Gemini 2.0 Vision reads the document and extracts only structured data — full name, document number, nationality, date of birth, expiry date.
3. **Image discarded**: The original image is **immediately discarded** after extraction. It is never saved to disk, database, or cloud storage.
4. **Data used, then purged**: The extracted text data is used only for the duration of the check-in pipeline, then purged after processing.

### Privacy Guarantees

| Principle | Implementation |
|-----------|----------------|
| Zero image storage | Document photos are processed in-memory and never persisted |
| No biometric retention | No facial data, fingerprints, or biometric templates are stored |
| Data minimization | Only the fields required for check-in are extracted |
| GDPR-ready architecture | Designed for compliance with EU data protection regulations |
| Transparent processing | The passenger can see exactly what data was extracted (Gemini JSON response visible in UI) |

### Why This Matters

Airlines handle millions of identity documents. A single breach of stored passport images would be catastrophic. By extracting only text data and discarding images immediately, the system eliminates the highest-risk data category entirely. This is not just good engineering — it is a **competitive advantage** in an industry where trust is everything.

---

## IAG Group Scalability

The pipeline is **airline-agnostic by design**. The 8-stage orchestration engine, AI document verification, and smart nudge system are fully configurable. Any airline within the IAG group can adopt the same pipeline with minimal integration work.

| Airline | Passengers (2024) | Status |
|---------|-------------------|--------|
| Vueling | 38.2M | POC in progress |
| British Airways | 39.5M | Same pipeline, different config |
| Iberia | 28.6M | Same pipeline, different config |
| Aer Lingus | 12.0M | Same pipeline, different config |
| **IAG Group Total** | **118.3M** | |

The architecture separates the orchestration engine from airline-specific configuration (branding, API endpoints, document rules, delivery channels). This means:

- **Same pipeline**: booking retrieval, passenger data, document verification, bag status, delivery preferences, auto check-in, comms, AI nudge
- **Different config**: airline branding, seat assignment rules, document country rules, AI prompt language, delivery channel priorities
- **One integration**: connect to the airline's DCS (Departure Control System) and the pipeline runs

---

## Roadmap

| Phase | Timeline | Scope |
|-------|----------|-------|
| POC | Now (4YFN/MWC 2026) | End-to-end pipeline with Gemini 2.0. 3 demo scenarios. |
| Pilot | Q2 2026 | 5 domestic routes (BCN-MAD, BCN-PMI, BCN-AGP, BCN-SVQ, BCN-BIO). ~500K passengers. |
| Domestic | Q3 2026 | All Spanish routes if pilot KPIs hit. Staff redeployment plan. |
| International | Q4 2026+ | EU routes first. 245+ routes across 30 countries. IATA One ID integration. |

---

## Data Sources

- IAG Full Year Results 2024
- Vueling ESG Report 2024
- SITA Passenger IT Insights 2023
- IATA Global Passenger Survey 2024
- IdeaWorksCompany Ancillary Revenue Report 2024
- CAPA Centre for Aviation
- AirAdvisor complaint data
- Euronews Travel
- QuestionPro Airline NPS benchmarks
- Direct measurement from POC pipeline execution logs

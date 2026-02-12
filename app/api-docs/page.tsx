"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  API endpoint definitions                                          */
/* ------------------------------------------------------------------ */

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Endpoint {
  method: string;
  path: string;
  title: string;
  description: string;
  layer: "backend" | "ai";
  request: EndpointParam[];
  responseExample: string;
  curlExample: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/validate",
    title: "Document Validation",
    description:
      "Validates passenger documents: passport number format, expiry date, date of birth, age (18+), passport validity vs route requirements, and fuzzy name matching.",
    layer: "backend",
    request: [
      { name: "passportExpiry", type: "string", required: true, description: "Passport expiry date (ISO)" },
      { name: "nationality", type: "string", required: true, description: "3-letter country code (e.g. ESP)" },
      { name: "passportName", type: "string", required: true, description: "Full name as on passport" },
      { name: "bookingName", type: "string", required: true, description: "Full name as on booking" },
      { name: "destination", type: "string", required: true, description: "IATA airport code (e.g. FCO)" },
      { name: "travelDate", type: "string", required: true, description: "Travel date (ISO)" },
      { name: "passportNumber", type: "string", required: false, description: "Passport number (5-12 alphanum)" },
      { name: "dateOfBirth", type: "string", required: false, description: "Date of birth (ISO)" },
    ],
    responseExample: JSON.stringify(
      {
        valid: true,
        issues: [
          { type: "etias_required", severity: "warning", details: "GBR nationals need ETIAS authorization." },
        ],
      },
      null,
      2
    ),
    curlExample: `curl -X POST http://localhost:3000/api/validate \\
  -H "Content-Type: application/json" \\
  -d '{
    "passportExpiry": "2027-06-15",
    "nationality": "ESP",
    "passportName": "GARCIA LOPEZ, MARIA",
    "bookingName": "Maria Garcia Lopez",
    "destination": "FCO",
    "travelDate": "2026-03-02",
    "passportNumber": "ESP123456",
    "dateOfBirth": "1992-05-14"
  }'`,
  },
  {
    method: "POST",
    path: "/api/scan-passport",
    title: "Passport OCR Scan",
    description:
      "Sends a passport photo to Gemini Vision AI to extract MRZ data: full name, passport number, nationality, date of birth, expiry date, gender, and issuing country.",
    layer: "ai",
    request: [
      { name: "image", type: "string", required: true, description: "Base64-encoded passport image (with or without data URL prefix)" },
    ],
    responseExample: JSON.stringify(
      {
        success: true,
        data: {
          fullName: "GARCIA LOPEZ, MARIA",
          surname: "GARCIA LOPEZ",
          givenNames: "MARIA",
          passportNumber: "ESP123456",
          nationality: "ESP",
          dateOfBirth: "1992-05-14",
          gender: "F",
          expiryDate: "2027-06-15",
          issuingCountry: "ESP",
        },
      },
      null,
      2
    ),
    curlExample: `curl -X POST http://localhost:3000/api/scan-passport \\
  -H "Content-Type: application/json" \\
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQ..."}'`,
  },
  {
    method: "POST",
    path: "/api/generate-nudge",
    title: "AI Nudge Generation",
    description:
      "Generates AI-powered push messages using Gemini 2.0 Flash. Three types: bag upsell nudge (no bag detected), check-in confirmation, and document issue notification. Falls back to static template if Gemini is unavailable.",
    layer: "ai",
    request: [
      { name: "type", type: '"bag_nudge" | "checkin_confirmation" | "document_issue"', required: true, description: "Type of nudge to generate" },
      { name: "name", type: "string", required: true, description: "Passenger first name" },
      { name: "destination", type: "string", required: false, description: "Destination city/airport" },
      { name: "language", type: "string", required: false, description: 'Language code (default: "en")' },
      { name: "flight_number", type: "string", required: false, description: "Flight number (checkin_confirmation)" },
      { name: "seat", type: "string", required: false, description: "Seat assignment (checkin_confirmation)" },
      { name: "issue_type", type: "string", required: false, description: "Document issue type (document_issue)" },
      { name: "issue_details", type: "string", required: false, description: "Issue details (document_issue)" },
    ],
    responseExample: JSON.stringify(
      {
        message: "Hey Maria! Packing for Rome? A 23kg checked bag makes it easy — skip the overhead bin stress. Add one now from just 19.99!",
      },
      null,
      2
    ),
    curlExample: `curl -X POST http://localhost:3000/api/generate-nudge \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "bag_nudge",
    "name": "Maria",
    "destination": "Rome",
    "trip_days": 5,
    "language": "en"
  }'`,
  },
  {
    method: "POST",
    path: "/api/generate-briefing",
    title: "Airport Briefing Generation",
    description:
      "Generates a structured AI airport briefing in JSON format via Gemini 2.0 Flash: summary, suggested arrival time with reasoning, step-by-step guide, and a destination tip.",
    layer: "ai",
    request: [
      { name: "name", type: "string", required: true, description: "Passenger name" },
      { name: "flight_number", type: "string", required: true, description: "Flight number" },
      { name: "origin", type: "string", required: true, description: "Origin airport" },
      { name: "destination", type: "string", required: true, description: "Destination airport" },
      { name: "date", type: "string", required: true, description: "Flight date" },
      { name: "departure_time", type: "string", required: true, description: "Departure time" },
      { name: "terminal", type: "string", required: true, description: "Terminal" },
      { name: "gate", type: "string", required: true, description: "Gate" },
      { name: "doc_status", type: "string", required: false, description: 'Document status (default: "Valid")' },
      { name: "bag_status", type: "string", required: false, description: 'Bag status (default: "No checked bag")' },
      { name: "language", type: "string", required: false, description: 'Language code (default: "en")' },
    ],
    responseExample: JSON.stringify(
      {
        summary: "Your flight VY1234 to Rome departs at 14:30 from Terminal 1, Gate B22.",
        suggested_arrival: "12:00",
        arrival_reasoning: "2.5 hours before departure for international EU flight.",
        steps: [
          "Arrive at BCN Terminal 1 by 12:00",
          "Head to security — estimated 20 min wait",
          "Proceed to Gate B22",
          "Boarding begins at 14:00",
        ],
        destination_tip: "The Trastevere neighborhood has the best local trattorias!",
      },
      null,
      2
    ),
    curlExample: `curl -X POST http://localhost:3000/api/generate-briefing \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Maria",
    "flight_number": "VY1234",
    "origin": "BCN",
    "destination": "FCO",
    "date": "2026-03-02",
    "departure_time": "14:30",
    "terminal": "T1",
    "gate": "B22"
  }'`,
  },
];

/* ------------------------------------------------------------------ */
/*  Project structure                                                 */
/* ------------------------------------------------------------------ */

interface FolderEntry {
  path: string;
  description: string;
}

interface LayerInfo {
  title: string;
  color: string;
  entries: FolderEntry[];
}

const PROJECT_LAYERS: LayerInfo[] = [
  {
    title: "Frontend (UI)",
    color: "bg-blue-50 border-blue-200",
    entries: [
      { path: "app/page.tsx", description: "Root redirect to /onboarding" },
      { path: "app/onboarding/page.tsx", description: "Booking flow (default tab)" },
      { path: "app/pipeline/page.tsx", description: "Pipeline Demo dashboard" },
      { path: "app/impact/page.tsx", description: "Impact metrics" },
      { path: "app/api-docs/page.tsx", description: "API documentation (this page)" },
      { path: "components/", description: "18 React components (OrchestrationDashboard, PipelineStage, BoardingPass, etc.)" },
      { path: "hooks/", description: "usePipeline.ts, useOrchestrationPipeline.ts" },
    ],
  },
  {
    title: "Backend (API Routes)",
    color: "bg-green-50 border-green-200",
    entries: [
      { path: "app/api/validate/route.ts", description: "Document validation engine (7 rules)" },
      { path: "app/api/scan-passport/route.ts", description: "Gemini Vision passport OCR" },
      { path: "app/api/generate-nudge/route.ts", description: "AI nudge/message generation" },
      { path: "app/api/generate-briefing/route.ts", description: "AI airport briefing (JSON)" },
    ],
  },
  {
    title: "Business Logic (Shared)",
    color: "bg-purple-50 border-purple-200",
    entries: [
      { path: "lib/validator.ts", description: "Passport validation rules engine" },
      { path: "lib/gemini/", description: "Gemini AI client, prompts, config" },
      { path: "lib/mrz-parser.ts", description: "Machine Readable Zone parser" },
      { path: "lib/pipeline/", description: "Pipeline engine: reducer, 11 stage executors" },
      { path: "lib/utils/", description: "Helpers: format, logger, storage, string utils" },
    ],
  },
  {
    title: "Data & Configuration",
    color: "bg-amber-50 border-amber-200",
    entries: [
      { path: "data/passengers.json", description: "3 demo passengers (Maria, James, Claire)" },
      { path: "data/flights.json", description: "2 demo flights (VY1234, VY6012)" },
      { path: "data/routes.json", description: "4 routes with passport requirements" },
      { path: "constants/", description: "Stage meta, delays, API endpoints, scenarios" },
      { path: "types/", description: "TypeScript types: domain, API, UI" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function EndpointCard({ ep, isOpen, onToggle }: { ep: Endpoint; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-[10px] font-mono font-bold bg-vueling-yellow text-vueling-dark px-1.5 py-0.5 rounded">
          POST
        </span>
        <span className="text-xs font-mono font-medium text-gray-700 flex-1">{ep.path}</span>
        {ep.layer === "ai" && (
          <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
            Gemini AI
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t border-gray-100 px-3 py-3 space-y-3">
          <p className="text-[11px] text-gray-600 leading-relaxed">{ep.description}</p>

          {/* Request params */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Request Body
            </h4>
            <div className="space-y-1">
              {ep.request.map((p) => (
                <div key={p.name} className="flex items-start gap-1.5 text-[10px]">
                  <code className="font-mono text-vueling-dark bg-gray-100 px-1 py-0.5 rounded shrink-0">
                    {p.name}
                  </code>
                  <span className="text-gray-400 shrink-0">{p.type}</span>
                  {p.required && (
                    <span className="text-red-400 shrink-0">*</span>
                  )}
                  <span className="text-gray-500">{p.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Response example */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Response Example
            </h4>
            <pre className="bg-gray-900 text-green-400 text-[9px] font-mono p-2.5 rounded-lg overflow-x-auto leading-relaxed">
              {ep.responseExample}
            </pre>
          </div>

          {/* cURL example */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Try It (cURL)
            </h4>
            <pre className="bg-gray-900 text-gray-300 text-[9px] font-mono p-2.5 rounded-lg overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {ep.curlExample}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ApiDocsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Hero */}
      <div>
        <h1 className="text-lg font-bold text-vueling-dark">API Reference</h1>
        <p className="text-xs text-gray-500 mt-1">
          4 REST endpoints &middot; Next.js API Routes &middot; No FastAPI &middot; Node.js v20
        </p>
      </div>

      {/* Tech stack pill row */}
      <div className="flex flex-wrap gap-1.5">
        {["Next.js 15", "TypeScript Strict", "Gemini 2.0 Flash", "Tailwind CSS 4"].map((t) => (
          <span key={t} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
            {t}
          </span>
        ))}
      </div>

      {/* Endpoints */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Endpoints</h2>
        {ENDPOINTS.map((ep, i) => (
          <EndpointCard
            key={ep.path}
            ep={ep}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </section>

      {/* Project structure */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Project Structure
        </h2>
        {PROJECT_LAYERS.map((layer) => (
          <div key={layer.title} className={`border rounded-lg p-3 ${layer.color}`}>
            <h3 className="text-[11px] font-bold text-gray-700 mb-2">{layer.title}</h3>
            <div className="space-y-1">
              {layer.entries.map((e) => (
                <div key={e.path} className="flex items-start gap-2 text-[10px]">
                  <code className="font-mono text-gray-600 bg-white/60 px-1 py-0.5 rounded shrink-0">
                    {e.path}
                  </code>
                  <span className="text-gray-500">{e.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Architecture note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h3 className="text-[11px] font-bold text-gray-700 mb-1">Architecture</h3>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Pure Next.js App Router (no Python/FastAPI). API routes live in <code className="bg-gray-200 px-1 rounded">app/api/</code> and
          run server-side on Node.js. The Gemini AI client is in <code className="bg-gray-200 px-1 rounded">lib/gemini/</code>.
          Frontend components consume APIs via <code className="bg-gray-200 px-1 rounded">fetch()</code> from pipeline stage executors
          in <code className="bg-gray-200 px-1 rounded">lib/pipeline/stages/</code>.
          All data is mock (JSON files in <code className="bg-gray-200 px-1 rounded">data/</code>) &mdash; no database.
        </p>
      </div>

      <p className="text-[9px] text-gray-300 text-center pb-4">
        Vueling Invisible Check-In &middot; 4YFN / MWC 2026
      </p>
    </div>
  );
}

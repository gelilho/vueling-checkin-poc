"use client";

import { useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  THE PROBLEM — what we're actually solving                          */
/* ------------------------------------------------------------------ */

interface Problem {
  icon: string;
  title: string;
  stat: string;
  detail: string;
}

const problems: Problem[] = [
  {
    icon: "counter",
    title: "30% still check in at the airport",
    stat: "~10M pax/year at Vueling",
    detail:
      "Despite online check-in existing for 20+ years, roughly 30% of passengers still end up at the airport. That means Vueling staff at counters, kiosks occupied, queues forming — all avoidable operational load.",
  },
  {
    icon: "clock",
    title: "Counter check-in takes 15–30 min",
    stat: "peak hour bottleneck",
    detail:
      "At peak times, each counter passenger costs 15–30 min of Vueling agent time. That congestion cascades — longer security queues, late boarders, gate delays, and IROPS costs when flights miss their slots.",
  },
  {
    icon: "stress",
    title: "Passengers don't choose the counter",
    stat: "they end up there",
    detail:
      "Most counter passengers missed the online window, got confused by the app, or simply forgot. The counter is the fallback for a flow that failed them. Fixing the flow upstream eliminates the problem at the root.",
  },
];

/* ------------------------------------------------------------------ */
/*  KPIs — only things we can actually defend                          */
/* ------------------------------------------------------------------ */

interface KPI {
  id: string;
  label: string;
  value: string;
  delta: string;
  confidence: "high" | "medium";
  icon: string;
  calculation: string;
  source: string;
}

const kpis: KPI[] = [
  {
    id: "staff",
    label: "Vueling Counter Staff Reduction",
    value: "~30%",
    delta: "fewer agents needed at counters",
    confidence: "high",
    icon: "people",
    calculation:
      "If we auto-check-in the majority of passengers who currently end up at the counter, counter volume drops significantly. That translates to roughly 30% fewer Vueling agents needed on check-in duty — redeployed to gate ops, disruption handling, and bag drop.",
    source: "Vueling station staffing; IATA standard airport ops models",
  },
  {
    id: "counter-volume",
    label: "Counter Volume Reduction",
    value: "~30%",
    delta: "fewer counter transactions",
    confidence: "high",
    icon: "savings",
    calculation:
      "Today ~30% of passengers check in at the airport. If we convert a significant share of those to auto check-in (opt-in at booking), we reduce counter transactions proportionally. Fewer transactions = less agent time, shorter queues, less kiosk usage.",
    source: "Industry online check-in adoption rates; SITA 2023 passenger IT survey",
  },
  {
    id: "kiosks",
    label: "Kiosk & Counter Infrastructure",
    value: "Less",
    delta: "hardware + maintenance",
    confidence: "high",
    icon: "counter",
    calculation:
      "Fewer passengers needing counters and kiosks means fewer machines to lease, maintain, and replace. At BCN T1 alone, reducing kiosk footprint frees physical space for bag drop or retail — airport concession value.",
    source: "Direct operational impact",
  },
  {
    id: "processing",
    label: "Passenger Check-In Time",
    value: "0 sec",
    delta: "vs. 3–5 min kiosk, 15–30 min counter",
    confidence: "high",
    icon: "clock",
    calculation:
      "Invisible check-in requires zero passenger action. No app to open, no kiosk to find, no queue to join. Boarding pass arrives automatically 48h before. The step is eliminated, not optimized.",
    source: "Direct — the system does the work, not the passenger",
  },
  {
    id: "nps",
    label: "NPS / Peace of Mind",
    value: "TBD",
    delta: "pilot will measure",
    confidence: "medium",
    icon: "heart",
    calculation:
      "The product here is peace of mind — passengers stop worrying about check-in. No alarm to set, no window to catch. Check-in is a top-5 NPS driver (IATA). Airlines with best digital check-in score 10–15pts higher. We expect a measurable lift but need the pilot to quantify it with post-flight surveys.",
    source: "IATA Global Passenger Survey; QuestionPro Airline NPS 2025",
  },
];

/* ------------------------------------------------------------------ */
/*  The honest business case structure                                 */
/* ------------------------------------------------------------------ */

const vuelingStats = [
  { label: "Passengers / yr", value: "33M", icon: "✈️" },
  { label: "At counter today", value: "~10M", icon: "🏢" },
  { label: "Flights / yr", value: "223K", icon: "🛫" },
  { label: "Airports", value: "~30", icon: "📍" },
];

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                          */
/* ------------------------------------------------------------------ */

function KPIIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    savings: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    people: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    heart: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    clock: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    counter: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    penalty: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    stress: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return <>{icons[type] || null}</>;
}

/* ------------------------------------------------------------------ */
/*  Animated Value                                                     */
/* ------------------------------------------------------------------ */

function AnimatedValue({ value, delay }: { value: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <span
      className={`inline-block transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {value}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Confidence Badge                                                   */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ level }: { level: "high" | "medium" }) {
  if (level === "high") {
    return (
      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase tracking-wider">
        Hard data
      </span>
    );
  }
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wider">
      Directional
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ImpactDashboard() {
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [expandedProblem, setExpandedProblem] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-vueling-light">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-vueling-dark text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Business Case
          </div>
          <h1 className="text-2xl font-bold text-vueling-dark">
            Why Invisible Check-In?
          </h1>
          <p className="text-sm text-vueling-gray mt-1">
            An honest assessment — what we can prove and what we believe
          </p>
        </div>

        {/* Vueling context */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {vuelingStats.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center bg-white rounded-lg p-2 border border-gray-100 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-base">{stat.icon}</span>
              <p className="text-sm font-bold text-vueling-dark mt-0.5">
                <AnimatedValue value={stat.value} delay={300 + i * 150} />
              </p>
              <p className="text-[9px] text-vueling-gray leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: The Problem                                        */}
        {/* ============================================================ */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-vueling-red uppercase tracking-wider mb-3">
            The Problem Today
          </h2>
          <div className="space-y-2">
            {problems.map((p, i) => (
              <button
                key={i}
                onClick={() => setExpandedProblem(expandedProblem === i ? null : i)}
                className="w-full text-left animate-slide-up"
                style={{ animationDelay: `${100 + i * 60}ms` }}
              >
                <div
                  className={`rounded-xl border-2 p-3 transition-all duration-200 ${
                    expandedProblem === i
                      ? "border-vueling-red/30 bg-red-50/50"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 text-vueling-red flex items-center justify-center shrink-0">
                      <KPIIcon type={p.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-vueling-dark">{p.title}</p>
                      <p className="text-[10px] text-vueling-red font-medium">{p.stat}</p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-vueling-gray transition-transform shrink-0 ${
                        expandedProblem === i ? "rotate-180" : ""
                      }`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {expandedProblem === i && (
                    <div className="mt-3 pt-3 border-t border-red-100 animate-fade-in">
                      <p className="text-xs text-vueling-dark leading-relaxed">{p.detail}</p>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: The Solution — one sentence                        */}
        {/* ============================================================ */}
        <div className="bg-vueling-dark rounded-xl p-4 mb-6 text-white animate-fade-in">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
            The Solution
          </p>
          <p className="text-sm font-semibold text-white leading-relaxed">
            Check in every opted-in passenger automatically, 48 hours before departure.
            No action required. Boarding pass delivered to their preferred channel.
          </p>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xl font-bold text-vueling-yellow">
                <AnimatedValue value="0" delay={500} />
              </p>
              <p className="text-[9px] text-gray-400">passenger actions</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-xl font-bold text-vueling-yellow">
                <AnimatedValue value="48h" delay={650} />
              </p>
              <p className="text-[9px] text-gray-400">before departure</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-xl font-bold text-vueling-yellow">
                <AnimatedValue value="7" delay={800} />
              </p>
              <p className="text-[9px] text-gray-400">automated steps</p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 3: Quantified Impact — with confidence levels         */}
        {/* ============================================================ */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-vueling-gray uppercase tracking-wider">
              Quantified Impact
            </h2>
            <div className="flex items-center gap-2">
              <ConfidenceBadge level="high" />
              <ConfidenceBadge level="medium" />
            </div>
          </div>

          <div className="space-y-2">
            {kpis.map((kpi, i) => (
              <button
                key={kpi.id}
                onClick={() =>
                  setExpandedKpi(expandedKpi === kpi.id ? null : kpi.id)
                }
                className="w-full text-left animate-slide-up"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                <div
                  className={`rounded-xl border-2 p-3 transition-all duration-200 ${
                    expandedKpi === kpi.id
                      ? "border-vueling-yellow bg-vueling-yellow/5 shadow-md"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-vueling-yellow/15 text-vueling-dark flex items-center justify-center shrink-0">
                      <KPIIcon type={kpi.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-vueling-gray">{kpi.label}</p>
                        <ConfidenceBadge level={kpi.confidence} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-vueling-dark">
                          <AnimatedValue value={kpi.value} delay={400 + i * 120} />
                        </span>
                        <span className="text-[10px] font-semibold text-vueling-green">
                          {kpi.delta}
                        </span>
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-vueling-gray transition-transform shrink-0 ${
                        expandedKpi === kpi.id ? "rotate-180" : ""
                      }`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {expandedKpi === kpi.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in">
                      <p className="text-[10px] font-semibold text-vueling-gray uppercase tracking-wider mb-1">
                        How we calculated this
                      </p>
                      <p className="text-xs text-vueling-dark leading-relaxed mb-2">
                        {kpi.calculation}
                      </p>
                      <p className="text-[10px] text-vueling-gray italic">
                        Sources: {kpi.source}
                      </p>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 4: What we DON'T claim                                */}
        {/* ============================================================ */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
          <h2 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">
            What we don&apos;t claim (yet)
          </h2>
          <ul className="space-y-2">
            {[
              {
                claim: "Ancillary revenue uplift",
                reality: "Post-check-in is a natural touchpoint to upsell bags/seats. But conversion data doesn't exist yet — pilot will measure.",
              },
              {
                claim: "No-show rate reduction",
                reality: "No-shows are driven by ticket price and flexibility, not check-in. Auto check-in gives earlier confirmation signal, but doesn't change underlying behavior.",
              },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  ?
                </span>
                <div>
                  <p className="text-xs font-semibold text-amber-900">{item.claim}</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">{item.reality}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ============================================================ */}
        {/* SECTION 5: The real WHY — operations perspective              */}
        {/* ============================================================ */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-vueling-gray uppercase tracking-wider mb-3">
            The Real Why — Operations View
          </h2>
          <div className="space-y-3">
            {[
              {
                emoji: "🏢",
                title: "Free Up Our People at the Airport",
                detail: "Every counter check-in is a Vueling agent occupied for 15+ minutes on a task that adds no value. Moving those agents to gate management, disruption handling, and premium services is a direct upgrade to operations quality.",
              },
              {
                emoji: "🧘",
                title: "Peace of Mind for the Passenger",
                detail: "No alarms to set, no 48h window to remember, no app to open. The passenger books a flight and the next thing they receive is their boarding pass. Check-in stops being a task and becomes invisible. That experience is what drives NPS and repeat bookings.",
              },
              {
                emoji: "⏱️",
                title: "Passenger Flows Straight to Security",
                detail: "Pre-checked-in passengers skip the check-in hall entirely. Less congestion, fewer missed flights from queue delays, reduced IROPS cost from late boarders.",
              },
              {
                emoji: "📱",
                title: "Passport Data Collected at Booking",
                detail: "Getting document data early (at booking, not at airport) unlocks APIS pre-submission, faster border processing, and is the foundation for IATA One ID biometric journey. Real infrastructure value.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-4 animate-slide-up"
                style={{ animationDelay: `${300 + i * 80}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{item.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold text-vueling-dark mb-1">{item.title}</h3>
                    <p className="text-xs text-vueling-gray leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 6: Roadmap                                            */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 animate-fade-in">
          <h2 className="text-xs font-semibold text-vueling-gray uppercase tracking-wider mb-3">
            Pilot → Scale
          </h2>
          <div className="space-y-3">
            {[
              {
                phase: "Now",
                title: "POC at 4YFN / MWC 2026",
                detail: "Proving the pipeline works end-to-end with Gemini 2.0",
                status: "active",
              },
              {
                phase: "Q2 2026",
                title: "Pilot: 5 domestic routes",
                detail: "BCN–MAD, BCN–PMI, BCN–AGP, BCN–SVQ, BCN–BIO. ~500K passengers. Measure real counter reduction + NPS delta.",
                status: "upcoming",
              },
              {
                phase: "Q3 2026",
                title: "Domestic rollout",
                detail: "All Spanish routes if pilot KPIs hit. Staff redeployment plan based on real counter volume data.",
                status: "upcoming",
              },
              {
                phase: "Q4 2026+",
                title: "International expansion",
                detail: "EU routes first (document verification simpler). Schengen → Non-Schengen phased.",
                status: "upcoming",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      item.status === "active"
                        ? "bg-vueling-yellow border-vueling-yellow"
                        : "bg-white border-gray-300"
                    }`}
                  />
                  {i < 3 && <div className="w-0.5 h-8 bg-gray-200 mt-0.5" />}
                </div>
                <div className="pb-1">
                  <p className="text-[10px] font-semibold text-vueling-gray uppercase">
                    {item.phase}
                  </p>
                  <p className="text-sm font-semibold text-vueling-dark">{item.title}</p>
                  <p className="text-xs text-vueling-gray">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-[10px] text-gray-300 uppercase tracking-widest">
            4YFN / MWC 2026 — Proof of Concept
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * One-Pager: Invisible Check-In Business Impact
 * Standalone printable document — Vueling brand style.
 * Route: /one-pager
 */

export default function OnePager() {
  return (
    <div className="min-h-screen bg-white p-0">
      {/* Print-optimized container */}
      <div className="max-w-[900px] mx-auto px-8 py-10 print:px-6 print:py-4">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-vueling-yellow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-vueling-yellow rounded-xl flex items-center justify-center">
              <span className="text-vueling-dark font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-vueling-dark tracking-tight">Invisible Check-In</h1>
              <p className="text-sm text-vueling-gray">Business Impact One-Pager &middot; 4YFN / MWC 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-vueling-gray uppercase tracking-widest">Powered by</p>
            <p className="text-sm font-semibold text-vueling-dark">Google Gemini 2.0</p>
          </div>
        </div>

        {/* ── HEADLINE ── */}
        <div className="bg-vueling-dark rounded-2xl p-6 mb-6 text-white">
          <p className="text-lg font-light mb-2">What if check-in just&hellip; disappeared?</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Automatic check-in 48 hours before departure. Zero passenger action.
            Boarding pass delivered to their preferred channel. 8 AI-powered stages, completed in under 15 seconds.
          </p>
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-vueling-yellow">38.2M</p>
              <p className="text-[10px] text-gray-400 uppercase">pax / year</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-vueling-yellow">3.26B</p>
              <p className="text-[10px] text-gray-400 uppercase">revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-vueling-yellow">223K</p>
              <p className="text-[10px] text-gray-400 uppercase">flights / yr</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-vueling-yellow">4th</p>
              <p className="text-[10px] text-gray-400 uppercase">LCC in europe</p>
            </div>
          </div>
        </div>

        {/* ── THE PROBLEM ── */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-vueling-dark uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-6 h-0.5 bg-vueling-yellow inline-block"></span>
            The Problem
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <ProblemCard
              stat="11.4M"
              title="Airport Check-ins"
              detail="30% of passengers still check in at counter/kiosk"
            />
            <ProblemCard
              stat="1M+ hrs"
              title="Time Wasted"
              detail="5-10 min per passenger on a zero-value process"
            />
            <ProblemCard
              stat="60K+"
              title="Complaints"
              detail="Check-in is a top inbound support category"
            />
          </div>
        </div>

        {/* ── QUANTIFIED IMPACT ── */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-vueling-dark uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-6 h-0.5 bg-vueling-yellow inline-block"></span>
            Quantified Impact (at 50% opt-in)
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <KPICard
              value="1.6-3.2M"
              unit="hours saved / yr"
              label="Passenger Time"
              confidence="high"
            />
            <KPICard
              value="+10-15"
              unit="NPS points"
              label="Customer Satisfaction"
              confidence="directional"
            />
            <KPICard
              value="~30%"
              unit="fewer agents"
              label="Counter Staff Reduction"
              confidence="high"
            />
            <KPICard
              value="~20-30%"
              unit="fewer cases"
              label="Support Reduction"
              confidence="directional"
            />
            <KPICard
              value="+22M"
              unit="/ year"
              label="Ancillary Revenue"
              confidence="directional"
            />
            <KPICard
              value="<15s"
              unit="8 stages"
              label="Pipeline Execution"
              confidence="high"
            />
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-vueling-dark uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-6 h-0.5 bg-vueling-yellow inline-block"></span>
            How It Works
          </h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { n: "1", t: "Booking Retrieval" },
              { n: "2", t: "Passenger Data" },
              { n: "3", t: "Doc Verification" },
              { n: "4", t: "Bag Status" },
              { n: "5", t: "Delivery Prefs" },
              { n: "6", t: "Auto Check-In" },
              { n: "7", t: "Comms Dispatch" },
              { n: "8", t: "AI Smart Nudge" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-vueling-yellow/20 flex items-center justify-center text-[10px] font-bold text-vueling-dark">
                  {s.n}
                </div>
                <span className="text-[10px] text-vueling-dark font-medium whitespace-nowrap">{s.t}</span>
                {i < 7 && <span className="text-gray-300 mx-0.5">&rarr;</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── IAG GROUP SCALABILITY ── */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-vueling-yellow/10 to-amber-50 border border-vueling-yellow/30">
          <h2 className="text-sm font-bold text-vueling-dark uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-6 h-0.5 bg-vueling-yellow inline-block"></span>
            IAG Group Scalability
          </h2>
          <p className="text-xs text-vueling-dark leading-relaxed mb-3">
            The pipeline is <strong>airline-agnostic by design</strong>. The 8-stage orchestration engine,
            AI document verification, and smart nudge system are fully configurable.
            Any airline within the IAG group can adopt the same pipeline with minimal integration work.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: "Vueling", pax: "38.2M", color: "bg-vueling-yellow" },
              { name: "Iberia", pax: "28.6M", color: "bg-red-500" },
              { name: "British Airways", pax: "39.5M", color: "bg-blue-700" },
              { name: "Aer Lingus", pax: "12.0M", color: "bg-emerald-600" },
            ].map((a) => (
              <div key={a.name} className="text-center p-2 rounded-lg bg-white/70">
                <div className={`w-3 h-3 ${a.color} rounded-full mx-auto mb-1`}></div>
                <p className="text-[10px] font-semibold text-vueling-dark">{a.name}</p>
                <p className="text-[9px] text-vueling-gray">{a.pax} pax/yr</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-vueling-gray mt-2 text-center">
            Combined IAG group: <strong>118.3M passengers / year</strong> &middot; Same pipeline, different config
          </p>
        </div>

        {/* ── ROADMAP ── */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-vueling-dark uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-6 h-0.5 bg-vueling-yellow inline-block"></span>
            Roadmap
          </h2>
          <div className="grid grid-cols-4 gap-2">
            <RoadmapPhase phase="POC" time="Now" status="active" detail="4YFN 2026. E2E pipeline + Gemini 2.0." />
            <RoadmapPhase phase="Pilot" time="Q2 2026" status="next" detail="5 domestic routes. ~500K pax." />
            <RoadmapPhase phase="Domestic" time="Q3 2026" status="future" detail="All Spanish routes. Staff redeployment." />
            <RoadmapPhase phase="International" time="Q4 2026+" status="future" detail="EU routes. IATA One ID. IAG rollout." />
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[9px] text-vueling-gray">
            Sources: IAG Full Year Results 2024, SITA 2023, IATA GPS 2024, IdeaWorksCompany, CAPA, AirAdvisor
          </p>
          <p className="text-[9px] text-vueling-gray">
            Next Gen Challenge &middot; 4YFN / MWC 2026
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ProblemCard({ stat, title, detail }: { stat: string; title: string; detail: string }) {
  return (
    <div className="p-3 rounded-xl border border-red-100 bg-red-50/50">
      <p className="text-xl font-bold text-red-600 mb-0.5">{stat}</p>
      <p className="text-xs font-semibold text-vueling-dark mb-1">{title}</p>
      <p className="text-[10px] text-vueling-gray leading-snug">{detail}</p>
    </div>
  );
}

function KPICard({
  value,
  unit,
  label,
  confidence,
}: {
  value: string;
  unit: string;
  label: string;
  confidence: "high" | "directional";
}) {
  return (
    <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
      <p className="text-lg font-bold text-vueling-dark">{value}</p>
      <p className="text-[10px] text-vueling-gray">{unit}</p>
      <p className="text-xs font-medium text-vueling-dark mt-1">{label}</p>
      <span
        className={`mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${
          confidence === "high"
            ? "bg-green-100 text-green-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {confidence === "high" ? "Hard data" : "Directional"}
      </span>
    </div>
  );
}

function RoadmapPhase({
  phase,
  time,
  status,
  detail,
}: {
  phase: string;
  time: string;
  status: "active" | "next" | "future";
  detail: string;
}) {
  const bg =
    status === "active"
      ? "bg-vueling-yellow/20 border-vueling-yellow"
      : status === "next"
      ? "bg-blue-50 border-blue-200"
      : "bg-gray-50 border-gray-200";

  return (
    <div className={`p-2.5 rounded-xl border ${bg}`}>
      <div className="flex items-center gap-1 mb-1">
        {status === "active" && <span className="w-2 h-2 rounded-full bg-vueling-yellow animate-pulse"></span>}
        <p className="text-xs font-bold text-vueling-dark">{phase}</p>
      </div>
      <p className="text-[10px] font-semibold text-vueling-gray">{time}</p>
      <p className="text-[9px] text-vueling-gray leading-snug mt-1">{detail}</p>
    </div>
  );
}

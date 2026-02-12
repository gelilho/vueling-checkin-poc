"use client";

import { useState } from "react";

/**
 * 3-Slide Pitch Deck: Invisible Check-In
 * Full-screen slides with Vueling brand style.
 * Route: /pitch-deck
 */

const TOTAL_SLIDES = 3;

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);

  const goNext = () => setCurrent((p) => Math.min(p + 1, TOTAL_SLIDES - 1));
  const goPrev = () => setCurrent((p) => Math.max(p - 1, 0));

  return (
    <div className="min-h-screen bg-vueling-dark flex flex-col">
      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[900px] aspect-[16/9] relative overflow-hidden rounded-2xl shadow-2xl">
          {current === 0 && <Slide1 />}
          {current === 1 && <Slide2 />}
          {current === 2 && <Slide3 />}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="px-4 py-2 text-sm font-semibold text-white bg-white/10 rounded-lg disabled:opacity-30 hover:bg-white/20 transition-colors"
        >
          &larr; Previous
        </button>
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === current ? "bg-vueling-yellow" : "bg-white/20"
              }`}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          disabled={current === TOTAL_SLIDES - 1}
          className="px-4 py-2 text-sm font-semibold text-vueling-dark bg-vueling-yellow rounded-lg disabled:opacity-30 hover:brightness-110 transition-all"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SLIDE 1 — The Problem & Vision                              */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Slide1() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-vueling-dark via-gray-900 to-gray-800 p-10 flex flex-col justify-between text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-vueling-yellow rounded-xl flex items-center justify-center">
            <span className="text-vueling-dark font-bold text-lg">V</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">vueling</span>
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-widest">Next Gen Challenge &middot; 4YFN 2026</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-widest">The problem</p>
        <h1 className="text-4xl font-bold tracking-tight leading-tight mb-6">
          What if check-in just&hellip;<br />
          <span className="text-vueling-yellow">disappeared?</span>
        </h1>

        <div className="grid grid-cols-3 gap-4 max-w-[700px]">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-3xl font-bold text-red-400">11.4M</p>
            <p className="text-xs text-gray-400 mt-1">passengers still check in at the airport</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-3xl font-bold text-red-400">1M+</p>
            <p className="text-xs text-gray-400 mt-1">hours wasted annually on a zero-value task</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-3xl font-bold text-red-400">60K+</p>
            <p className="text-xs text-gray-400 mt-1">complaints linked to check-in friction</p>
          </div>
        </div>
      </div>

      {/* Bottom insight */}
      <p className="text-xs text-gray-500">
        Vueling 2024: 38.2M passengers &middot; 3.26B revenue &middot; 223K flights &middot; 4th largest LCC in Europe
      </p>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SLIDE 2 — The Solution & Impact                             */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Slide2() {
  return (
    <div className="w-full h-full bg-white p-10 flex flex-col justify-between">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-vueling-yellow rounded-xl flex items-center justify-center">
            <span className="text-vueling-dark font-bold text-lg">V</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-vueling-dark">vueling</span>
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-widest">Invisible Check-In</span>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-widest">The solution</p>
        <h2 className="text-3xl font-bold text-vueling-dark tracking-tight mb-2">
          AI-powered. Fully automated. <span className="text-vueling-yellow">Zero friction.</span>
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-[600px]">
          8 orchestrated stages execute 48h before departure. Document verification, seat assignment, boarding pass delivery, and smart nudges — all powered by Gemini 2.0 Flash.
        </p>

        {/* KPIs grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <KPISlide value="1.6-3.2M" label="hours saved / year" sub="Passenger time returned" />
          <KPISlide value="+10-15" label="NPS points" sub="Customer satisfaction uplift" />
          <KPISlide value="~30%" label="fewer agents" sub="Counter staff reduction" />
          <KPISlide value="~20-30%" label="fewer cases" sub="Support case reduction" />
          <KPISlide value="+22M" label="/ year" sub="Ancillary revenue (bag upsell)" />
          <KPISlide value="<15s" label="8 stages" sub="Full pipeline execution time" />
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="flex items-center gap-1.5 justify-center">
        {["Booking", "Passenger", "Docs", "Bags", "Delivery", "Check-In", "Comms", "AI Nudge"].map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="px-2 py-1 rounded-lg bg-vueling-yellow/10 border border-vueling-yellow/30">
              <span className="text-[9px] font-semibold text-vueling-dark">{s}</span>
            </div>
            {i < 7 && <span className="text-gray-300 text-xs">&rarr;</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SLIDE 3 — IAG Scalability & Roadmap                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Slide3() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-vueling-dark via-gray-900 to-gray-800 p-10 flex flex-col justify-between text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-vueling-yellow rounded-xl flex items-center justify-center">
            <span className="text-vueling-dark font-bold text-lg">V</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">vueling</span>
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-widest">IAG Group Scalability</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-widest">Airline-agnostic by design</p>
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          One pipeline. <span className="text-vueling-yellow">Four airlines. 118M passengers.</span>
        </h2>
        <p className="text-sm text-gray-400 mb-6 max-w-[650px]">
          The orchestration engine is fully configurable and airline-independent.
          Any carrier within the IAG group can adopt the same pipeline with minimal integration work.
          Same architecture, different airline config.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-[700px] mb-6">
          {/* IAG Airlines */}
          <div className="space-y-2">
            {[
              { name: "Vueling", pax: "38.2M", color: "bg-vueling-yellow", text: "text-vueling-dark" },
              { name: "British Airways", pax: "39.5M", color: "bg-blue-500", text: "text-white" },
              { name: "Iberia", pax: "28.6M", color: "bg-red-500", text: "text-white" },
              { name: "Aer Lingus", pax: "12.0M", color: "bg-emerald-500", text: "text-white" },
            ].map((a) => (
              <div key={a.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className={`w-8 h-8 ${a.color} rounded-lg flex items-center justify-center`}>
                  <span className={`font-bold text-sm ${a.text}`}>{a.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.pax} passengers / year</p>
                </div>
              </div>
            ))}
          </div>

          {/* Roadmap */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Roadmap</p>
            {[
              { phase: "POC", time: "Now", detail: "4YFN / MWC 2026. E2E demo.", active: true },
              { phase: "Pilot", time: "Q2 2026", detail: "5 domestic BCN routes. ~500K pax.", active: false },
              { phase: "Spain", time: "Q3 2026", detail: "All domestic routes. Staff redeployment.", active: false },
              { phase: "IAG", time: "Q4 2026+", detail: "EU rollout. Iberia, BA, Aer Lingus.", active: false },
            ].map((r) => (
              <div
                key={r.phase}
                className={`p-3 rounded-xl border ${
                  r.active
                    ? "bg-vueling-yellow/10 border-vueling-yellow/40"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  {r.active && <span className="w-2 h-2 rounded-full bg-vueling-yellow animate-pulse"></span>}
                  <p className="text-xs font-bold">{r.phase}</p>
                  <p className="text-[10px] text-gray-400 ml-auto">{r.time}</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Sources: IAG FY2024, SITA 2023, IATA GPS 2024, IdeaWorksCompany, CAPA
        </p>
        <div className="px-4 py-2 bg-vueling-yellow rounded-xl">
          <p className="text-sm font-bold text-vueling-dark">Let&apos;s build the future of check-in</p>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function KPISlide({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-lg font-bold text-vueling-dark">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import DocumentCapture from "./DocumentCapture";

type OnboardingStep = "booking-confirmed" | "opt-in" | "delivery" | "document" | "ready";
type DeliveryMethod = "email" | "sms" | "push" | "app";

interface DeliveryOption {
  id: DeliveryMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const deliveryOptions: DeliveryOption[] = [
  {
    id: "email",
    label: "Email",
    description: "Receive boarding pass via email",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "sms",
    label: "SMS",
    description: "Get a link via text message",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    id: "push",
    label: "Push Notification",
    description: "Instant notification on your phone",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: "app",
    label: "Vueling App",
    description: "View in the Vueling app wallet",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function OnboardingFlow() {
  const [step, setStep] = useState<OnboardingStep>("booking-confirmed");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryMethod[]>(["email", "push"]);
  const [documentData, setDocumentData] = useState<Record<string, string> | null>(null);

  function toggleDelivery(method: DeliveryMethod) {
    setSelectedDelivery((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  }

  // ---- Step 1: Booking confirmed ----
  if (step === "booking-confirmed") {
    return (
      <div className="flex-1 flex flex-col px-5 py-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Success checkmark */}
          <div className="w-16 h-16 rounded-full bg-vueling-green/10 flex items-center justify-center mb-4 animate-check-bounce">
            <div className="w-10 h-10 rounded-full bg-vueling-green flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-bold text-vueling-dark mb-1">Booking Confirmed!</h1>
          <p className="text-sm text-vueling-gray mb-1">VY1234 · BCN → FCO</p>
          <p className="text-xs text-vueling-gray mb-6">March 15, 2026 · 08:45</p>

          {/* Booking reference */}
          <div className="bg-gray-50 rounded-lg px-4 py-2 mb-6">
            <p className="text-[10px] text-vueling-gray uppercase tracking-wider">Booking Ref</p>
            <p className="text-lg font-mono font-bold text-vueling-dark tracking-widest">VY-M2026A</p>
          </div>

          {/* CTA */}
          <div className="w-full space-y-3 animate-fade-in" style={{ animationDelay: "600ms" }}>
            <p className="text-sm text-vueling-dark font-semibold">
              Want us to check you in automatically?
            </p>
            <p className="text-xs text-vueling-gray leading-relaxed">
              We&apos;ll handle everything 48h before your flight — no action needed from you.
            </p>
            <button
              onClick={() => setStep("opt-in")}
              className="w-full py-4 bg-vueling-yellow text-vueling-dark font-bold rounded-xl text-sm active:scale-[0.97] transition-transform shadow-lg shadow-vueling-yellow/20"
            >
              Yes, check me in automatically ✓
            </button>
            <button
              onClick={() => setStep("ready")}
              className="w-full py-3 text-xs text-vueling-gray hover:text-vueling-dark transition-colors"
            >
              No thanks, I&apos;ll check in myself
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Step 2: Opt-in confirmation + explain ----
  if (step === "opt-in") {
    return (
      <div className="flex-1 flex flex-col px-5 py-6">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 bg-vueling-green/10 text-vueling-green px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Auto Check-In Enabled
          </div>
          <h2 className="text-xl font-bold text-vueling-dark mb-2">
            Great choice!
          </h2>
          <p className="text-sm text-vueling-gray leading-relaxed">
            48 hours before your flight, we&apos;ll automatically verify your documents, assign your seat, and send your boarding pass.
          </p>
        </div>

        {/* What happens timeline */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-vueling-gray uppercase tracking-wider mb-3">
            What happens next
          </p>
          {[
            { time: "T-48h", action: "We verify your documents", icon: "📋" },
            { time: "T-48h", action: "Seat is assigned automatically", icon: "💺" },
            { time: "T-48h", action: "Boarding pass sent to you", icon: "✉️" },
            { time: "T-0h", action: "Go straight to security!", icon: "🚀" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2 animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-sm">{item.icon}</span>
              <div className="flex-1">
                <p className="text-xs text-vueling-dark font-medium">{item.action}</p>
              </div>
              <span className="text-[10px] font-mono text-vueling-gray bg-white px-1.5 py-0.5 rounded">
                {item.time}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm font-semibold text-vueling-dark mb-2">
          Now, two quick things:
        </p>
        <p className="text-xs text-vueling-gray mb-4">
          Choose how to receive your boarding pass, and provide your travel document.
        </p>

        <button
          onClick={() => setStep("delivery")}
          className="w-full py-4 bg-vueling-yellow text-vueling-dark font-bold rounded-xl text-sm active:scale-[0.97] transition-transform shadow-lg shadow-vueling-yellow/20"
        >
          Continue
        </button>
      </div>
    );
  }

  // ---- Step 3: Delivery method selection ----
  if (step === "delivery") {
    return (
      <div className="flex-1 flex flex-col px-5 py-6">
        <div className="mb-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-vueling-yellow flex items-center justify-center">
                <span className="text-[10px] font-bold text-vueling-dark">1</span>
              </div>
              <div className="w-8 h-0.5 bg-vueling-yellow" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-[10px] font-bold text-vueling-gray">2</span>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-vueling-dark mb-1">
            How should we send your boarding pass?
          </h2>
          <p className="text-xs text-vueling-gray">
            Select one or more delivery methods
          </p>
        </div>

        {/* Delivery options */}
        <div className="space-y-2 mb-6">
          {deliveryOptions.map((option) => {
            const isSelected = selectedDelivery.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleDelivery(option.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? "border-vueling-yellow bg-vueling-yellow/5 shadow-sm animate-card-select"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-vueling-yellow/20 text-vueling-dark"
                      : "bg-gray-100 text-vueling-gray"
                  }`}
                >
                  {option.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-vueling-dark">{option.label}</p>
                  <p className="text-[11px] text-vueling-gray">{option.description}</p>
                </div>
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-vueling-yellow border-vueling-yellow"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-vueling-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setStep("document")}
          disabled={selectedDelivery.length === 0}
          className="w-full py-4 bg-vueling-yellow text-vueling-dark font-bold rounded-xl text-sm active:scale-[0.97] transition-transform shadow-lg shadow-vueling-yellow/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to document
        </button>
      </div>
    );
  }

  // ---- Step 4: Document capture ----
  if (step === "document") {
    return (
      <div className="flex-1 flex flex-col px-5 py-6">
        <div className="mb-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-vueling-yellow flex items-center justify-center">
                <svg className="w-3 h-3 text-vueling-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="w-8 h-0.5 bg-vueling-yellow" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-vueling-yellow flex items-center justify-center">
                <span className="text-[10px] font-bold text-vueling-dark">2</span>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-vueling-dark mb-1">
            Your travel document
          </h2>
          <p className="text-xs text-vueling-gray">
            Passport or national ID — we&apos;ll extract the details with AI
          </p>
        </div>

        <DocumentCapture
          onVerified={(data) => {
            setDocumentData(data);
            setStep("ready");
          }}
          onSkip={() => setStep("ready")}
        />
      </div>
    );
  }

  // ---- Step 5: All set! ----
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center">
      <div className="w-16 h-16 rounded-full bg-vueling-green/10 flex items-center justify-center mb-4 animate-check-bounce">
        <div className="w-10 h-10 rounded-full bg-vueling-green flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h1 className="text-xl font-bold text-vueling-dark mb-2">You&apos;re all set!</h1>
      <p className="text-sm text-vueling-gray mb-6 leading-relaxed max-w-[280px]">
        {documentData
          ? "Your document is verified. We'll check you in automatically 48h before departure."
          : "Auto check-in is enabled. Don't forget to add your document later for a seamless experience."}
      </p>

      {/* Summary card */}
      <div className="w-full bg-white rounded-xl border border-gray-100 p-4 mb-6 text-left">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-vueling-gray">Auto check-in</span>
            <span className="text-xs font-semibold text-vueling-green">✓ Enabled</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-vueling-gray">Boarding pass delivery</span>
            <span className="text-xs font-semibold text-vueling-dark">
              {selectedDelivery.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-vueling-gray">Document</span>
            <span className={`text-xs font-semibold ${documentData ? "text-vueling-green" : "text-vueling-orange"}`}>
              {documentData ? `✓ ${documentData.fullName}` : "⏳ Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="w-full bg-vueling-yellow/10 rounded-xl p-4 mb-6 text-left">
        <p className="text-xs font-semibold text-vueling-dark mb-2">What happens next</p>
        <p className="text-xs text-vueling-gray leading-relaxed">
          48 hours before your flight on March 15, we&apos;ll automatically check you in,
          assign your seat, and send your boarding pass via {selectedDelivery.join(" & ")}.
          Just head straight to security!
        </p>
      </div>

      {/* Restart demo */}
      <button
        onClick={() => {
          setStep("booking-confirmed");
          setSelectedDelivery(["email", "push"]);
          setDocumentData(null);
        }}
        className="px-6 py-2.5 bg-vueling-yellow text-vueling-dark font-semibold rounded-xl text-sm active:scale-[0.97] transition-transform"
      >
        Restart demo
      </button>

      <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-8">
        4YFN / MWC 2026 — Post-Booking Experience
      </p>
    </div>
  );
}

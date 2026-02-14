"use client";

import { useState, useRef } from "react";
import { API_ENDPOINTS } from "@/constants/api";

type CaptureStatus = "idle" | "manual" | "uploading" | "processing" | "success" | "failed";

interface DocumentCaptureProps {
  onVerified: (data: Record<string, string>) => void;
  onSkip?: () => void;
}

export default function DocumentCapture({ onVerified, onSkip }: DocumentCaptureProps) {
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsedFields, setParsedFields] = useState<Record<string, string> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry state
  const [manualName, setManualName] = useState("");
  const [manualPassport, setManualPassport] = useState("");
  const [manualExpiry, setManualExpiry] = useState("");
  const [manualNationality, setManualNationality] = useState("");
  const [manualDob, setManualDob] = useState("");
  const [manualCountryOfIssue, setManualCountryOfIssue] = useState("");
  const manualValid = manualName.trim().length > 1 && manualPassport.trim().length > 4 && manualExpiry.trim().length > 0 && manualNationality.trim().length > 1 && manualDob.trim().length > 0;

  async function processImage(base64: string) {
    setStatus("processing");
    setErrorMsg(null);

    try {
      const res = await fetch(API_ENDPOINTS.SCAN_PASSPORT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const result = await res.json();

      if (!result.success) {
        setStatus("failed");
        setErrorMsg(result.error || "Could not read the document. Please try again.");
        return;
      }

      const d = result.data;
      const fields: Record<string, string> = {
        fullName: d.fullName,
        passportNumber: d.passportNumber,
        nationality: d.nationality,
        dateOfBirth: d.dateOfBirth,
        gender: d.gender,
        expiryDate: d.expiryDate,
        issuingCountry: d.issuingCountry,
      };

      setParsedFields(fields);
      setStatus("success");
    } catch {
      setStatus("failed");
      setErrorMsg("Connection error. Please try again.");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setStatus("uploading");
      // Small delay to show upload animation
      setTimeout(() => processImage(base64), 400);
    };
    reader.readAsDataURL(file);
  }

  function handleRetry() {
    setStatus("idle");
    setPreviewUrl(null);
    setParsedFields(null);
    setErrorMsg(null);
    setManualName("");
    setManualPassport("");
    setManualExpiry("");
    setManualNationality("");
    setManualDob("");
    setManualCountryOfIssue("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleConfirm() {
    if (parsedFields) {
      onVerified(parsedFields);
    }
  }

  // ---- IDLE: Choose method ----
  if (status === "idle") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-vueling-gray mb-2">
          Upload a photo of your passport, DNI, or ID card to enable automatic check-in
        </p>

        {/* Upload photo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-vueling-yellow hover:bg-vueling-yellow/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-vueling-yellow/15 flex items-center justify-center group-hover:bg-vueling-yellow/30 transition-colors">
            <svg className="w-5 h-5 text-vueling-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-vueling-dark">Scan from photo</p>
            <p className="text-[11px] text-vueling-gray">Upload or take a photo of your document</p>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] text-vueling-gray uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Manual entry option */}
        <button
          onClick={() => setStatus("manual")}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-vueling-yellow hover:bg-vueling-yellow/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-vueling-yellow/15 flex items-center justify-center group-hover:bg-vueling-yellow/30 transition-colors">
            <svg className="w-5 h-5 text-vueling-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-vueling-dark">Enter manually</p>
            <p className="text-[11px] text-vueling-gray">Type your name, passport number & expiry</p>
          </div>
        </button>

        {/* Skip option */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="w-full text-center text-xs text-vueling-gray hover:text-vueling-dark transition-colors py-2"
          >
            I&apos;ll add this later →
          </button>
        )}
      </div>
    );
  }

  // ---- MANUAL ENTRY ----
  if (status === "manual") {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-xs text-vueling-gray">
          Enter your passport or ID details below
        </p>

        {/* Full name */}
        <div>
          <label className="block text-[11px] font-semibold text-vueling-dark mb-1.5">
            Full name <span className="text-vueling-gray font-normal">(as on document)</span>
          </label>
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="e.g. GARCÍA LÓPEZ, MARÍA"
            className="w-full px-3 py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-vueling-yellow focus:outline-none transition-colors placeholder:text-gray-300"
          />
        </div>

        {/* Passport number */}
        <div>
          <label className="block text-[11px] font-semibold text-vueling-dark mb-1.5">
            Passport / ID number
          </label>
          <input
            type="text"
            value={manualPassport}
            onChange={(e) => setManualPassport(e.target.value.toUpperCase())}
            placeholder="e.g. PAA123456"
            className="w-full px-3 py-3 text-sm font-mono border-2 border-gray-200 rounded-xl focus:border-vueling-yellow focus:outline-none transition-colors placeholder:text-gray-300 uppercase tracking-wider"
          />
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-[11px] font-semibold text-vueling-dark mb-1.5">
            Nationality
          </label>
          <input
            type="text"
            value={manualNationality}
            onChange={(e) => setManualNationality(e.target.value.toUpperCase())}
            placeholder="e.g. ESP, GBR, FRA"
            maxLength={3}
            className="w-full px-3 py-3 text-sm font-mono border-2 border-gray-200 rounded-xl focus:border-vueling-yellow focus:outline-none transition-colors placeholder:text-gray-300 uppercase tracking-wider"
          />
        </div>

        {/* Date of birth */}
        <div>
          <label className="block text-[11px] font-semibold text-vueling-dark mb-1.5">
            Date of birth
          </label>
          <input
            type="date"
            value={manualDob}
            onChange={(e) => setManualDob(e.target.value)}
            min="1920-01-01"
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-vueling-yellow focus:outline-none transition-colors"
          />
        </div>

        {/* Country of issue */}
        <div>
          <label className="block text-[11px] font-semibold text-vueling-dark mb-1.5">
            Country of issue
          </label>
          <input
            type="text"
            value={manualCountryOfIssue}
            onChange={(e) => setManualCountryOfIssue(e.target.value.toUpperCase())}
            placeholder="e.g. ESP, GBR, FRA"
            maxLength={3}
            className="w-full px-3 py-3 text-sm font-mono border-2 border-gray-200 rounded-xl focus:border-vueling-yellow focus:outline-none transition-colors placeholder:text-gray-300 uppercase tracking-wider"
          />
        </div>

        {/* Expiry date */}
        <div>
          <label className="block text-[11px] font-semibold text-vueling-dark mb-1.5">
            Expiry date
          </label>
          <input
            type="date"
            value={manualExpiry}
            onChange={(e) => setManualExpiry(e.target.value)}
            min="2024-01-01"
            max="2040-12-31"
            className="w-full px-3 py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-vueling-yellow focus:outline-none transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              setStatus("idle");
              setManualName("");
              setManualPassport("");
              setManualExpiry("");
              setManualNationality("");
              setManualDob("");
              setManualCountryOfIssue("");
            }}
            className="flex-1 py-3 text-xs font-semibold text-vueling-gray border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              const fields: Record<string, string> = {
                fullName: manualName.trim(),
                passportNumber: manualPassport.trim(),
                nationality: manualNationality.trim() || "—",
                dateOfBirth: manualDob || "—",
                gender: "—",
                expiryDate: manualExpiry,
                issuingCountry: manualCountryOfIssue.trim() || "—",
                entryMethod: "manual",
              };
              setParsedFields(fields);
              setStatus("success");
            }}
            disabled={!manualValid}
            className="flex-1 py-3 text-xs font-bold text-vueling-dark bg-vueling-yellow rounded-xl hover:bg-vueling-yellow/80 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  // ---- UPLOADING / PROCESSING ----
  if (status === "uploading" || status === "processing") {
    return (
      <div className="flex flex-col items-center py-6">
        {previewUrl && (
          <div className="w-40 h-24 rounded-lg overflow-hidden mb-4 border border-gray-200 opacity-60">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from camera */}
            <img src={previewUrl} alt="Document" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="w-10 h-10 rounded-full border-3 border-vueling-yellow border-t-transparent animate-spin mb-3" />
        <p className="text-sm font-semibold text-vueling-dark">
          {status === "uploading" ? "Uploading..." : "AI is reading your document..."}
        </p>
        <p className="text-[11px] text-vueling-gray mt-1">
          Verifying identity data with Gemini 2.0
        </p>
      </div>
    );
  }

  // ---- SUCCESS ----
  if (status === "success" && parsedFields) {
    const isManual = parsedFields.entryMethod === "manual";
    const displayFields = isManual
      ? {
          "Full name": parsedFields.fullName,
          "Document number": parsedFields.passportNumber,
          "Nationality": parsedFields.nationality,
          "Date of birth": parsedFields.dateOfBirth,
          "Country of issue": parsedFields.issuingCountry,
          "Expiry date": parsedFields.expiryDate,
        }
      : {
          "Full name": parsedFields.fullName,
          "Document number": parsedFields.passportNumber,
          "Nationality": parsedFields.nationality,
          "Date of birth": parsedFields.dateOfBirth,
          "Expiry date": parsedFields.expiryDate,
        };

    return (
      <div className="animate-fade-in">
        {/* Success banner */}
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 border border-green-200 animate-success-flash">
          <div className="w-6 h-6 rounded-full bg-vueling-green flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">
              {isManual ? "Details saved" : "Document verified"}
            </p>
            <p className="text-[11px] text-green-600">
              {isManual ? "Entered manually" : "All fields extracted successfully"}
            </p>
          </div>
        </div>

        {/* Preview + fields */}
        {previewUrl && (
          <div className="w-full h-20 rounded-lg overflow-hidden mb-3 opacity-40 border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from camera */}
            <img src={previewUrl} alt="Document" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-1.5 mb-4">
          {Object.entries(displayFields).map(([label, value], i) => (
            <div
              key={label}
              className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-50 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-[11px] text-vueling-gray">{label}</span>
              <span className="text-xs font-semibold text-vueling-dark">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleRetry}
            className="flex-1 py-3 text-xs font-semibold text-vueling-gray border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Re-scan
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 text-xs font-bold text-vueling-dark bg-vueling-yellow rounded-xl hover:bg-vueling-yellow/80 transition-colors shadow-sm"
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    );
  }

  // ---- FAILED ----
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center py-4">
        {previewUrl && (
          <div className="w-40 h-24 rounded-lg overflow-hidden mb-4 border-2 border-red-200 animate-fail-shake">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from camera */}
            <img src={previewUrl} alt="Document" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Error banner */}
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-vueling-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <p className="text-sm font-semibold text-vueling-dark mb-1">Verification failed</p>
        <p className="text-xs text-vueling-gray text-center mb-4">
          {errorMsg || "Could not read the document. Please try again with a clearer photo."}
        </p>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleRetry}
            className="flex-1 py-3 text-xs font-bold text-vueling-dark bg-vueling-yellow rounded-xl hover:bg-vueling-yellow/80 transition-colors"
          >
            Try Again
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="flex-1 py-3 text-xs font-semibold text-vueling-gray border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

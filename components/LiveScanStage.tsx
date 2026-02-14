"use client";

import { useState } from "react";
import Camera from "@/components/Camera";
import DataReveal from "@/components/DataReveal";
import { API_ENDPOINTS } from "@/constants/api";
import { DATA_REVEAL } from "@/constants/delays";

interface LiveScanStageProps {
  onScanComplete: (data: {
    data: Record<string, string>;
    summary: string;
    parsedData: Record<string, string>;
  }) => void;
  onError: (error: string) => void;
}

export default function LiveScanStage({
  onScanComplete,
  onError,
}: LiveScanStageProps) {
  const [phase, setPhase] = useState<"camera" | "scanning" | "result">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<Record<string, string> | null>(null);

  async function handleCapture(imageBase64: string) {
    setCapturedImage(imageBase64);
    setPhase("scanning");

    try {
      const res = await fetch(API_ENDPOINTS.SCAN_PASSPORT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const result = await res.json();

      if (!result.success) {
        onError(result.error || "Could not read passport");
        return;
      }

      const d = result.data;
      const data: Record<string, string> = {
        "Full name": d.fullName,
        "Passport number": d.passportNumber,
        Nationality: d.nationality,
        "Date of birth": d.dateOfBirth,
        Gender: d.gender,
        "Expiry date": d.expiryDate,
        "Issuing country": d.issuingCountry,
      };

      setResultData(data);
      setPhase("result");

      // Signal completion after reveal animation
      setTimeout(() => {
        onScanComplete({
          data,
          summary: `${d.fullName} — ${d.nationality} passport`,
          parsedData: {
            fullName: d.fullName,
            surname: d.surname,
            givenNames: d.givenNames,
            passportNumber: d.passportNumber,
            nationality: d.nationality,
            dateOfBirth: d.dateOfBirth,
            gender: d.gender,
            expiryDate: d.expiryDate,
            issuingCountry: d.issuingCountry,
          },
        });
      }, Object.keys(data).length * DATA_REVEAL.DEFAULT_STAGGER_MS + DATA_REVEAL.COMPLETION_BUFFER_MS);
    } catch {
      onError("Failed to process document. Please try again.");
    }
  }

  if (phase === "camera") {
    return <Camera onCapture={handleCapture} />;
  }

  if (phase === "scanning") {
    return (
      <div className="flex flex-col items-center py-4">
        {capturedImage && (
          <div className="w-32 h-20 rounded-lg overflow-hidden mb-3 opacity-60">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from camera */}
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="w-8 h-8 rounded-full border-2 border-vueling-yellow border-t-transparent animate-spin mb-2" />
        <p className="text-xs text-vueling-gray">AI is reading your document...</p>
      </div>
    );
  }

  // Result phase
  return (
    <div>
      {capturedImage && (
        <div className="w-full h-20 rounded-lg overflow-hidden mb-3 opacity-40">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL from camera */}
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        </div>
      )}
      {resultData && (
        <DataReveal
          fields={Object.entries(resultData).map(([label, value]) => ({
            label,
            value,
          }))}
          staggerMs={DATA_REVEAL.DEFAULT_STAGGER_MS}
        />
      )}
    </div>
  );
}

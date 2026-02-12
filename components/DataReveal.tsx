"use client";

import { useEffect, useState } from "react";

interface DataField {
  label: string;
  value: string;
  highlight?: boolean;
}

interface DataRevealProps {
  fields: DataField[];
  staggerMs?: number;
  onComplete?: () => void;
}

export default function DataReveal({
  fields,
  staggerMs = 200,
  onComplete,
}: DataRevealProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= fields.length) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, staggerMs);

    return () => clearTimeout(timer);
  }, [visibleCount, fields.length, staggerMs, onComplete]);

  return (
    <div className="flex flex-col gap-1.5">
      {fields.map((field, i) => (
        <div
          key={`${field.label}-${i}`}
          className={`flex items-center gap-2 text-xs transition-all duration-300 ${
            i < visibleCount
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2"
          }`}
        >
          <span className="text-vueling-gray font-mono text-[10px] uppercase tracking-wider min-w-[100px] shrink-0">
            {field.label}
          </span>
          <span
            className={`font-medium ${
              field.highlight
                ? field.value.startsWith("⚠️") || field.value.startsWith("✗")
                  ? "text-vueling-red"
                  : "text-vueling-yellow"
                : "text-vueling-dark"
            }`}
          >
            {field.value}
          </span>
        </div>
      ))}
      {/* Cursor blink while revealing */}
      {visibleCount < fields.length && (
        <div className="flex items-center gap-1 mt-0.5">
          <div className="w-1.5 h-3 bg-vueling-yellow animate-cursor-blink rounded-sm" />
          <span className="text-[10px] text-vueling-gray">reading...</span>
        </div>
      )}
    </div>
  );
}

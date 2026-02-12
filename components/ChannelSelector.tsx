"use client";

import { CHANNELS } from "@/constants/channels";
import type { DeliveryChannel } from "@/types";

interface ChannelSelectorProps {
  selected: DeliveryChannel[];
  onChange: (channels: DeliveryChannel[]) => void;
  disabled?: boolean;
}

export default function ChannelSelector({
  selected,
  onChange,
  disabled,
}: ChannelSelectorProps) {
  function toggle(ch: DeliveryChannel) {
    if (disabled) return;
    if (selected.includes(ch)) {
      // Don't allow deselecting all
      if (selected.length <= 1) return;
      onChange(selected.filter((c) => c !== ch));
    } else {
      onChange([...selected, ch]);
    }
  }

  function selectAll() {
    if (disabled) return;
    onChange(CHANNELS.map((c) => c.id));
  }

  const allSelected = selected.length === CHANNELS.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map((ch) => {
          const isSelected = selected.includes(ch.id);
          return (
            <button
              key={ch.id}
              onClick={() => toggle(ch.id)}
              disabled={disabled}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                isSelected
                  ? "bg-vueling-yellow text-vueling-dark border border-vueling-yellow"
                  : "bg-white text-vueling-gray border border-gray-200 hover:border-vueling-yellow/50"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span>{ch.icon}</span>
              <span>{ch.label}</span>
            </button>
          );
        })}
      </div>
      {!allSelected && !disabled && (
        <button
          onClick={selectAll}
          className="text-[10px] text-vueling-gray underline underline-offset-2 self-start"
        >
          Select all channels
        </button>
      )}
    </div>
  );
}

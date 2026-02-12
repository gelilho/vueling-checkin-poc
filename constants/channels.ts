/**
 * Channel configuration — single source of truth for delivery channels.
 * Used by ChannelSelector component and pipeline stage executors.
 */

import type { DeliveryChannel } from "@/types";

export interface ChannelConfig {
  id: DeliveryChannel;
  label: string;
  icon: string;
}

export const CHANNELS: ChannelConfig[] = [
  { id: "email", label: "Email", icon: "✉️" },
  { id: "sms", label: "SMS", icon: "📱" },
  { id: "push", label: "Push", icon: "🔔" },
  { id: "app", label: "In-app", icon: "📲" },
];

export function getChannelLabel(id: DeliveryChannel): string {
  return CHANNELS.find((c) => c.id === id)?.label ?? id;
}

export function getChannelIcon(id: DeliveryChannel): string {
  return CHANNELS.find((c) => c.id === id)?.icon ?? "📨";
}

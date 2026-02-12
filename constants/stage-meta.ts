/**
 * Pipeline stage metadata — titles, icons, and display order.
 */

import type { StageId, StageMeta } from "@/types";

export const STAGE_ORDER: StageId[] = ["channels", "scan", "checkin", "delivery"];

export const STAGE_META: Record<StageId, StageMeta> = {
  channels: { title: "Channel Preferences", icon: "channels" },
  scan: { title: "Identity Scan", icon: "scan" },
  checkin: { title: "Automatic Check-In", icon: "checkin" },
  delivery: { title: "Delivery & Extras", icon: "delivery" },
};

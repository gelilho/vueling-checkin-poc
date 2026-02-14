/**
 * Gemini API client.
 *
 * Two functions:
 *  - scanPassport()  — Vision: sends image + DOCUMENT_SCAN_PROMPT
 *  - generateText()  — Text: sends a filled prompt, returns plain text
 *
 * Model: gemini-2.0-flash
 * Prompts: defined in ./prompts.ts
 *
 * Logging: method, model, latency only — no PII, no raw responses.
 */

import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import type { GeminiPassportData } from "@/types";
import { DOCUMENT_SCAN_PROMPT } from "./prompts";

const GEMINI_MODEL = "gemini-2.0-flash";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function getModel() {
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

/** Strip markdown code fences from Gemini responses */
function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

/* ------------------------------------------------------------------ */
/*  Gemini Call Logger (safe — no PII, no raw responses)               */
/* ------------------------------------------------------------------ */

function logGeminiCall(
  method: "Vision" | "Text",
  promptType: string,
  durationMs: number,
  success: boolean
) {
  console.log(
    `[Gemini] ${method} | ${GEMINI_MODEL} | ${promptType} | ${durationMs}ms | ${success ? "OK" : "FAIL"}`
  );
}

/* ------------------------------------------------------------------ */
/*  scanPassport — Gemini Vision                                       */
/* ------------------------------------------------------------------ */

/**
 * Scan an identity document using Gemini Vision.
 * Supports passports, Spanish DNI, NIE, and EU ID cards.
 */
export async function scanPassport(imageBase64: string): Promise<GeminiPassportData> {
  const model = getModel();
  const start = Date.now();

  const imagePart: Part = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64,
    },
  };

  const result = await model.generateContent([DOCUMENT_SCAN_PROMPT, imagePart]);
  const rawText = result.response.text();
  const cleaned = cleanJsonResponse(rawText);
  const parsed = JSON.parse(cleaned) as GeminiPassportData;

  logGeminiCall("Vision", "DOCUMENT_SCAN", Date.now() - start, true);

  return parsed;
}

/* ------------------------------------------------------------------ */
/*  generateText — Gemini Text                                         */
/* ------------------------------------------------------------------ */

/**
 * Generate plain text from a filled prompt.
 * Used for nudges, confirmations, and issue notifications.
 */
export async function generateText(prompt: string): Promise<string> {
  const model = getModel();
  const start = Date.now();

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  logGeminiCall("Text", "GENERATE_NUDGE", Date.now() - start, true);

  return text;
}

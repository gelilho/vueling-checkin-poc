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
 * All Gemini calls are logged to the server console with:
 *  - Request type and prompt preview
 *  - Full raw Gemini response JSON/text
 *  - Latency in ms
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
/*  Gemini Response Logger                                             */
/* ------------------------------------------------------------------ */

function logGeminiCall(
  method: "Vision" | "Text",
  promptPreview: string,
  rawResponse: string,
  parsed: unknown,
  durationMs: number
) {
  const divider = "─".repeat(60);
  console.log(`\n${divider}`);
  console.log(`🤖 GEMINI ${method.toUpperCase()} CALL`);
  console.log(`${divider}`);
  console.log(`  Model:    ${GEMINI_MODEL}`);
  console.log(`  Method:   ${method}`);
  console.log(`  Prompt:   ${promptPreview}`);
  console.log(`  Latency:  ${durationMs}ms`);
  console.log(`${divider}`);
  console.log(`  📥 Raw Gemini response:`);
  console.log(rawResponse);
  console.log(`${divider}`);
  console.log(`  📦 Parsed result:`);
  console.log(JSON.stringify(parsed, null, 2));
  console.log(`${divider}\n`);
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

  logGeminiCall(
    "Vision",
    "DOCUMENT_SCAN_PROMPT + [image base64]",
    rawText,
    parsed,
    Date.now() - start
  );

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

  // Extract a short preview of the prompt (first line, max 80 chars)
  const firstLine = prompt.split("\n").find((l) => l.trim()) || "";
  const preview = firstLine.length > 80 ? firstLine.slice(0, 80) + "..." : firstLine;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  logGeminiCall(
    "Text",
    preview,
    text,
    { message: text },
    Date.now() - start
  );

  return text;
}

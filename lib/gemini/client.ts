/**
 * Gemini API client.
 *
 * Two functions:
 *  - scanPassport()  — Vision: sends image + DOCUMENT_SCAN_PROMPT
 *  - generateText()  — Text: sends a filled prompt, returns plain text
 *
 * Model: gemini-2.0-flash
 * Prompts: defined in ./prompts.ts
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

/**
 * Scan an identity document using Gemini Vision.
 * Supports passports, Spanish DNI, NIE, and EU ID cards.
 */
export async function scanPassport(imageBase64: string): Promise<GeminiPassportData> {
  const model = getModel();

  const imagePart: Part = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64,
    },
  };

  const result = await model.generateContent([DOCUMENT_SCAN_PROMPT, imagePart]);
  const text = result.response.text();
  return JSON.parse(cleanJsonResponse(text)) as GeminiPassportData;
}

/**
 * Generate plain text from a filled prompt.
 * Used for nudges, confirmations, and issue notifications.
 */
export async function generateText(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}

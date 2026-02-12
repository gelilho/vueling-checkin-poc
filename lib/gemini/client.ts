/**
 * Gemini API client — model initialization and core request functions.
 */

import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import type { GeminiPassportData } from "@/types";
import { PASSPORT_SCAN_PROMPT } from "./prompts";

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
 * Scan a passport image using Gemini vision.
 * Sends the base64 image with the MRZ extraction prompt.
 */
export async function scanPassport(imageBase64: string): Promise<GeminiPassportData> {
  const model = getModel();

  const imagePart: Part = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64,
    },
  };

  const result = await model.generateContent([PASSPORT_SCAN_PROMPT, imagePart]);
  const text = result.response.text();
  return JSON.parse(cleanJsonResponse(text)) as GeminiPassportData;
}

/** Generate plain text from a prompt */
export async function generateText(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}


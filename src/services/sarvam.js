// services/sarvam.js
//
// Thin wrapper around the Sarvam AI APIs used by ClassFilter AI.
// These are placeholder implementations wired up to real endpoints so the
// app is ready to run the moment a key is added — swap in exact request
// shapes from https://docs.sarvam.ai once you've confirmed them for your
// account/plan.
//
// SECURITY NOTE: this app calls Sarvam directly from the browser using
// VITE_SARVAM_API_KEY, which is fine for a hackathon demo but means the
// key ships in the client bundle. For anything beyond a demo, proxy these
// two calls through a small backend and keep the key server-side.

const SARVAM_API_BASE = "https://api.sarvam.ai";

function getApiKey() {
  const key = import.meta.env.VITE_SARVAM_API_KEY;
  if (!key) {
    throw new Error(
      "Missing VITE_SARVAM_API_KEY. Add it to your .env file (see .env.example)."
    );
  }
  return key;
}

// Maps the app's language selector values to Sarvam's language codes.
const LANGUAGE_CODE_MAP = {
  tanglish: "ta-IN",
  hinglish: "hi-IN",
  english: "en-IN",
  auto: "unknown",
};

/**
 * Transcribe a recorded/uploaded audio clip using Sarvam's Speech-to-Text
 * (Saaras / Kivi) endpoint.
 *
 * @param {Blob} audioBlob - audio captured via MediaRecorder or a dropped file
 * @param {"tanglish"|"hinglish"|"english"|"auto"} language
 * @returns {Promise<{ transcript: string }>}
 */
export async function transcribeAudio(audioBlob, language = "auto") {
  const apiKey = getApiKey();
  const languageCode = LANGUAGE_CODE_MAP[language] ?? "unknown";

  const form = new FormData();
  form.append("file", audioBlob, "clip.wav");
  form.append("language_code", languageCode);
  form.append("model", "saaras:v2");

  const response = await fetch(`${SARVAM_API_BASE}/speech-to-text`, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam STT request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return { transcript: data.transcript ?? "" };
}

// System prompt that does the actual "fluff filtering" work.
const FILTER_SYSTEM_PROMPT = `You are ClassFilter AI, a note-taking assistant for Indian university lectures.
Given a raw, unedited lecture transcript (which may mix Tamil/Hindi and English), do the following:
1. Strip administrative chatter (attendance, roll numbers, "silence please"), personal anecdotes, jokes, and off-topic talk (sports, gossip).
2. Keep only academic content: definitions, explanations, formulas, and terms.
3. Separately surface any exam hints, deadlines, or announcements.
Return strict JSON with this shape:
{
  "noiseFilteredPercent": number,
  "keyConcepts": string[],
  "formulas": [{ "name": string, "expression": string, "note": string }],
  "examHints": [{ "level": "high"|"medium"|"low", "text": string }]
}`;

/**
 * Send a raw transcript to a Sarvam LLM chat completion and get back
 * structured, filtered lecture notes.
 *
 * @param {string} rawText
 * @returns {Promise<{
 *   noiseFilteredPercent: number,
 *   keyConcepts: string[],
 *   formulas: {name: string, expression: string, note: string}[],
 *   examHints: {level: string, text: string}[]
 * }>}
 */
export async function filterLecture(rawText) {
  const apiKey = getApiKey();

  const response = await fetch(`${SARVAM_API_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      model: "sarvam-105b-conversations",
      messages: [
        { role: "system", content: FILTER_SYSTEM_PROMPT },
        { role: "user", content: rawText },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam chat completion failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

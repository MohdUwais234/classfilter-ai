// services/sarvam.js
//
// Thin wrapper around the Sarvam AI APIs used by ClassFilter AI.

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
 * Transcribe a recorded/uploaded audio clip using Sarvam's Speech-to-Text endpoint.
 */
export async function transcribeAudio(audioBlob, language = "auto") {
  const apiKey = getApiKey();
  const languageCode = LANGUAGE_CODE_MAP[language] ?? "unknown";

  const form = new FormData();
  form.append("file", audioBlob, "clip.wav");
  form.append("language_code", languageCode);
  form.append("model", "saaras:v3"); // 👈 Updated from saaras:v2 to saaras:v3

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

// System prompt for academic noise filtering
const FILTER_SYSTEM_PROMPT = `You are ClassFilter AI, a note-taking assistant for Indian university lectures.
Given a raw, unedited lecture transcript (which may mix Tamil/Hindi and English), do the following:
1. Strip administrative chatter (attendance, roll numbers, "silence please"), personal anecdotes, jokes, and off-topic talk (sports, gossip).
2. Keep only academic content: definitions, explanations, formulas, and terms.
3. Separately surface any exam hints, deadlines, or announcements.
Return ONLY strict, raw JSON with this exact shape and no extra conversational text or markdown wrapping:
{
  "noiseFilteredPercent": 60,
  "keyConcepts": ["concept 1", "concept 2"],
  "formulas": [{ "name": "string", "expression": "string", "note": "string" }],
  "examHints": [{ "level": "high", "text": "string" }]
}`;

/**
 * Send a raw transcript to Sarvam LLM and get back structured notes.
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
      model: "sarvam-2b", // 👈 Standard Sarvam chat model name
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
  let content = data.choices?.[0]?.message?.content ?? "{}";

  // Clean markdown ```json wrapper if returned by LLM
  content = content.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(content);
}
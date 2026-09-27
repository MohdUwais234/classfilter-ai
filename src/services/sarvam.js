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
  tanglish: "en-IN",
  hinglish: "en-IN",
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
  form.append("model", "saaras:v3");

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
  let content = data.choices?.[0]?.message?.content ?? "{}";

  // Clean markdown ```json wrapper if returned by LLM
  content = content.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(content);
}

/**
 * Transcribe long-form audio (> 30s) using Sarvam Batch STT API.
 */
export async function transcribeLongAudio(audioBlob, language = "auto") {
  const apiKey = getApiKey();
  const languageCode = LANGUAGE_CODE_MAP[language] ?? "unknown";

  // Step 1: Request upload URL
  const initRes = await fetch(`${SARVAM_API_BASE}/speech-to-text/batch/upload-url`, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ file_name: "lecture.mp3" })
  });
  
  if (!initRes.ok) throw new Error("Failed to initialize batch upload");
  const { upload_url, job_id } = await initRes.json();

  // Step 2: Upload the audio binary
  await fetch(upload_url, {
    method: "PUT",
    body: audioBlob,
    headers: { "Content-Type": "audio/mp3" }
  });

  // Step 3: Start batch processing job
  await fetch(`${SARVAM_API_BASE}/speech-to-text/batch`, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      job_id,
      model: "saaras:v3",
      language_code: languageCode
    })
  });

  // Step 4: Poll job status until complete
  while (true) {
    await new Promise((r) => setTimeout(r, 3000)); // poll every 3s
    const statusRes = await fetch(`${SARVAM_API_BASE}/speech-to-text/batch/${job_id}`, {
      headers: { "api-subscription-key": apiKey }
    });
    const statusData = await statusRes.json();

    if (statusData.status === "completed") {
      return { transcript: statusData.results?.[0]?.transcript ?? "" };
    }
    if (statusData.status === "failed") {
      throw new Error("Batch transcription failed on Sarvam servers.");
    }
  }
}
// services/sarvam.js
//
// Thin wrapper around Sarvam AI APIs used by ClassFilter AI.

const SARVAM_API_BASE = "https://api.sarvam.ai";

function getApiKey() {
  const key = import.meta.env.VITE_SARVAM_API_KEY;
  if (!key) {
    throw new Error(
      "Missing VITE_SARVAM_API_KEY. Add it to your .env file."
    );
  }
  return key;
}

// Maps language selector values to Sarvam language codes
const LANGUAGE_CODE_MAP = {
  tanglish: "en-IN", // English/Latin script for Tanglish
  hinglish: "hi-IN",
  english: "en-IN",
  auto: "unknown",
};

/**
 * Transcribe a single audio blob (< 30s) using Sarvam STT.
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
    throw new Error(`Sarvam STT failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return { transcript: data.transcript ?? "" };
}

/**
 * Slices long audio into ~25 second WAV chunks and transcribes them in parallel.
 */
export async function transcribeLongAudio(audioBlob, language = "auto", onProgress = () => {}) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const duration = audioBuffer.duration;
  const chunkSizeSeconds = 25; // 25 seconds per chunk (safe under Sarvam's 30s limit)
  const numChunks = Math.ceil(duration / chunkSizeSeconds);

  onProgress(`Chunking ${Math.round(duration)}s audio into ${numChunks} parts...`);

  const chunkPromises = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSizeSeconds;
    const end = Math.min((i + 1) * chunkSizeSeconds, duration);
    const chunkBlob = await extractAudioChunkAsWav(audioBuffer, start, end);

    // Process chunk
    const promise = transcribeAudio(chunkBlob, language).catch((err) => {
      console.warn(`Chunk ${i + 1} failed:`, err);
      return { transcript: "" };
    });

    chunkPromises.push(promise);
  }

  const results = await Promise.all(chunkPromises);
  const fullTranscript = results.map((r) => r.transcript).filter(Boolean).join(" ");

  await audioContext.close();

  return { transcript: fullTranscript };
}

/**
 * Helper to encode AudioBuffer slice into WAV Blob format.
 */
async function extractAudioChunkAsWav(audioBuffer, startTime, endTime) {
  const sampleRate = audioBuffer.sampleRate;
  const startFrame = Math.floor(startTime * sampleRate);
  const endFrame = Math.floor(endTime * sampleRate);
  const frameLength = endFrame - startFrame;
  const numberOfChannels = audioBuffer.numberOfChannels;

  const offlineCtx = new OfflineAudioContext(numberOfChannels, frameLength, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0, startTime, endTime - startTime);

  const renderedBuffer = await offlineCtx.startRendering();
  return bufferToWavBlob(renderedBuffer);
}

function bufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels = [], sampleRate = buffer.sampleRate, offset = 0, pos = 0;

  function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);         // length
  setUint16(1);          // raw PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: "audio/wav" });
}

// Prompt for academic filtering
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
 * Filter lecture content via Sarvam LLM.
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
    throw new Error(`Sarvam chat failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content ?? "{}";
  content = content.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(content);
}
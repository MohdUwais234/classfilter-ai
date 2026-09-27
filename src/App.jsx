import { useRef, useState } from "react";
import RecordPanel from "./components/RecordPanel.jsx";
import TranscriptFeed from "./components/TranscriptFeed.jsx";
import StatBar from "./components/StatBar.jsx";
import NotesDashboard from "./components/NotesDashboard.jsx";
import { transcribeAudio, transcribeLongAudio, filterLecture } from "./services/sarvam.js";
import { SAMPLE_RAW_SEGMENTS, SAMPLE_FILTERED_NOTES } from "./mockData.js";

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("tanglish");
  const [segments, setSegments] = useState([]);
  const [notes, setNotes] = useState(null);
  const [status, setStatus] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function handleToggleRecord() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setStatus(`Microphone access failed: ${err.message}`);
    }
  }

  async function processAudio(audioBlob) {
    // Files larger than 1MB are roughly > 30s long and require Sarvam Batch API
    const isLongAudio = audioBlob.size > 1024 * 1024;

    if (isLongAudio) {
      setStatus("Transcribing long lecture via Sarvam Batch API (this may take a few seconds)...");
    } else {
      setStatus("Transcribing...");
    }

    try {
      const { transcript } = isLongAudio
        ? await transcribeLongAudio(audioBlob, language)
        : await transcribeAudio(audioBlob, language);

      if (!transcript || !transcript.trim()) {
        setStatus("No speech detected in audio clip.");
        return;
      }

      setSegments([{ text: transcript, tag: "ACADEMIC" }]);
      setStatus("Filtering lecture content...");
      const filtered = await filterLecture(transcript);
      setNotes(filtered);
      setStatus("");
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleFileDrop(file) {
    await processAudio(file);
  }

  function handleLoadDemo() {
    setSegments(SAMPLE_RAW_SEGMENTS);
    setNotes(SAMPLE_FILTERED_NOTES);
    setStatus("");
  }

  const rawWordCount = segments.reduce(
    (sum, s) => sum + s.text.split(/\s+/).filter(Boolean).length,
    0
  );

  return (
    <div className="min-h-screen bg-ink text-chalk font-body">
      <header className="border-b border-line px-6 py-4">
        <h1 className="font-display text-xl font-semibold">
          ClassFilter AI <span className="text-muted font-normal">— Real-Time Lecture Processing</span>
        </h1>
      </header>

      {status && (
        <div className="mx-6 mt-4 rounded-lg border border-line bg-panel px-4 py-2 text-sm text-muted">
          {status}
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left column */}
        <section className="space-y-5">
          <RecordPanel
            isRecording={isRecording}
            onToggleRecord={handleToggleRecord}
            language={language}
            onLanguageChange={setLanguage}
            onFileDrop={handleFileDrop}
            onLoadDemo={handleLoadDemo}
          />
          <TranscriptFeed segments={segments} />
        </section>

        {/* Right column */}
        <section className="space-y-5">
          <StatBar
            rawWords={rawWordCount || null}
            noiseFilteredPercent={notes?.noiseFilteredPercent}
            timeSaved={notes ? "~4 min" : null}
          />
          <NotesDashboard notes={notes} />
        </section>
      </main>
    </div>
  );
}
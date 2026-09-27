import { Mic, Square, UploadCloud, ChevronDown, Zap } from "lucide-react";

const LANGUAGES = [
  { value: "tanglish", label: "Tanglish (Tamil + English)" },
  { value: "hinglish", label: "Hinglish (Hindi + English)" },
  { value: "english", label: "English (Pure)" },
  { value: "auto", label: "Auto-Detect" },
];

export default function RecordPanel({
  isRecording,
  onToggleRecord,
  language,
  onLanguageChange,
  onFileDrop,
  onLoadDemo,
}) {
  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileDrop(file);
  }

  return (
    <div className="space-y-5">
      {/* Record toggle */}
      <button
        onClick={onToggleRecord}
        className={`w-full rounded-xl border transition-colors flex items-center justify-center gap-3 py-6 font-display text-lg font-semibold ${
          isRecording
            ? "border-alert/60 bg-alertDim text-alert"
            : "border-line bg-panelRaised text-chalk hover:border-marigold/60 hover:text-marigold"
        }`}
      >
        {isRecording ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-alert rec-pulse" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-alert" />
            </span>
            Stop Recording
            <Square size={18} className="ml-1" />
          </>
        ) : (
          <>
            <Mic size={20} />
            Start Recording
          </>
        )}
      </button>

      {/* Drag and drop */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="rounded-xl border border-dashed border-line py-6 px-4 text-center text-sm text-muted hover:border-teal/50 hover:text-teal/90 transition-colors cursor-default"
      >
        <UploadCloud size={20} className="mx-auto mb-2" />
        Drag &amp; drop a lecture recording
        <div className="text-xs mt-1 opacity-70">.mp3 &middot; .wav &middot; .m4a</div>
      </div>

      {/* Language selector */}
      <div className="relative">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-line bg-panelRaised py-2.5 pl-3 pr-9 text-sm text-chalk focus:outline-none focus:border-marigold/60"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>

      {/* Demo button */}
      <button
        onClick={onLoadDemo}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-marigold/40 bg-marigoldDim py-2.5 text-sm font-medium text-marigold hover:bg-marigold/20 transition-colors"
      >
        <Zap size={16} />
        Load Sample Demo Lecture
      </button>
    </div>
  );
}

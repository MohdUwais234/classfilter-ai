const TAG_STYLES = {
  ACADEMIC: "bg-tealDim text-teal border-teal/30",
  FLUFF: "bg-line/60 text-muted border-line",
};

export default function TranscriptFeed({ segments }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h3 className="font-display text-sm font-semibold text-chalk mb-3">
        Live Transcript
      </h3>
      <div className="thin-scroll h-72 overflow-y-auto space-y-2 pr-1">
        {segments.length === 0 ? (
          <p className="text-sm text-muted italic">
            Start recording, drop a file, or load the sample lecture to see the
            raw transcript here.
          </p>
        ) : (
          segments.map((seg, i) => (
            <div key={i} className="text-sm leading-relaxed text-chalk/90">
              <span
                className={`mr-2 inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium align-middle ${
                  TAG_STYLES[seg.tag]
                }`}
              >
                {seg.tag === "FLUFF" ? `FLUFF: ${seg.label}` : "ACADEMIC"}
              </span>
              {seg.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

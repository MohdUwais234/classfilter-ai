export default function StatBar({ rawWords, noiseFilteredPercent, timeSaved }) {
  const stats = [
    { label: "Raw Words Captured", value: rawWords || "—" },
    {
      label: "Noise Filtered Out",
      value: noiseFilteredPercent ? `${noiseFilteredPercent}%` : "—",
    },
    { label: "Time Saved", value: timeSaved || "—" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-line bg-panel px-4 py-3"
        >
          <div className="font-display text-2xl font-semibold text-marigold">
            {s.value}
          </div>
          <div className="text-xs text-muted mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

import { useState } from "react";
import {
  BookMarked,
  Sigma,
  AlertTriangle,
  Copy,
  FileDown,
  Send,
  Check,
} from "lucide-react";

const TABS = [
  { key: "concepts", label: "Key Concepts & Summary", icon: BookMarked },
  { key: "formulas", label: "Formulas, Terms & Definitions", icon: Sigma },
  { key: "exam", label: "Exam Hints & Announcements", icon: AlertTriangle },
];

function toMarkdown(notes) {
  const lines = ["# ClassFilter AI — Lecture Notes", ""];
  lines.push("## Key Concepts");
  notes.keyConcepts.forEach((c) => lines.push(`- ${c}`));
  lines.push("", "## Formulas & Definitions");
  notes.formulas.forEach((f) =>
    lines.push(`- **${f.name}**: \`${f.expression}\` — ${f.note}`)
  );
  lines.push("", "## Exam Hints & Announcements");
  notes.examHints.forEach((h) => lines.push(`- ${h.text}`));
  return lines.join("\n");
}

export default function NotesDashboard({ notes }) {
  const [activeTab, setActiveTab] = useState("concepts");
  const [copied, setCopied] = useState(false);

  const hasNotes = Boolean(notes);

  async function handleCopy() {
    if (!hasNotes) return;
    await navigator.clipboard.writeText(toMarkdown(notes));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function handleDownloadPdf() {
    if (!hasNotes) return;
    window.print();
  }

  function handleExportNotion() {
    if (!hasNotes) return;
    // Placeholder: wire this up to Notion's API (via a backend) when ready.
    alert(
      "Notion export isn't wired up yet — notes are copied as Markdown so you can paste them into a Notion page."
    );
    handleCopy();
  }

  return (
    <div className="rounded-xl border border-line bg-panel overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-line">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-medium transition-colors ${
                active
                  ? "text-marigold border-b-2 border-marigold bg-panelRaised"
                  : "text-muted hover:text-chalk"
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div id="printable-notes" className="p-5 min-h-[16rem]">
        {!hasNotes && (
          <p className="text-sm text-muted italic">
            Filtered notes will appear here once a lecture has been processed.
          </p>
        )}

        {hasNotes && activeTab === "concepts" && (
          <ul className="space-y-3">
            {notes.keyConcepts.map((c, i) => (
              <li key={i} className="text-sm leading-relaxed text-chalk/90 pl-4 border-l-2 border-teal/40">
                <FormattedBold text={c} />
              </li>
            ))}
          </ul>
        )}

        {hasNotes && activeTab === "formulas" && (
          <div className="space-y-3">
            {notes.formulas.map((f, i) => (
              <div
                key={i}
                className="rounded-lg border border-line bg-panelRaised p-4"
              >
                <div className="text-xs uppercase tracking-wide text-muted mb-1">
                  {f.name}
                </div>
                <div className="font-display text-base text-marigold mb-2">
                  {f.expression}
                </div>
                <div className="text-sm text-chalk/80">{f.note}</div>
              </div>
            ))}
          </div>
        )}

        {hasNotes && activeTab === "exam" && (
          <div className="space-y-3">
            {notes.examHints.map((h, i) => (
              <div
                key={i}
                className={`rounded-lg border p-4 text-sm flex items-start gap-2 ${
                  h.level === "high"
                    ? "border-alert/50 bg-alertDim text-alert"
                    : "border-marigold/40 bg-marigoldDim text-marigold"
                }`}
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-line p-4">
        <ActionButton onClick={handleCopy} disabled={!hasNotes} icon={copied ? Check : Copy}>
          {copied ? "Copied" : "Copy Notes (Markdown)"}
        </ActionButton>
        <ActionButton onClick={handleDownloadPdf} disabled={!hasNotes} icon={FileDown}>
          Download PDF
        </ActionButton>
        <ActionButton onClick={handleExportNotion} disabled={!hasNotes} icon={Send}>
          Export to Notion
        </ActionButton>
      </div>
    </div>
  );
}

function ActionButton({ onClick, disabled, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-lg border border-line bg-panelRaised px-3 py-2 text-xs font-medium text-chalk/90 hover:border-teal/50 hover:text-teal disabled:opacity-40 disabled:hover:border-line disabled:hover:text-chalk/90 transition-colors"
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

// Renders **bold** markdown-style spans without pulling in a markdown lib.
function FormattedBold({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-chalk font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

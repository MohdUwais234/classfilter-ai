# ClassFilter AI

A real-time lecture note-taker and noise filter for Indian university classrooms.
Records or accepts uploaded lecture audio, transcribes it, and filters out
attendance/admin chatter, jokes, and off-topic talk — keeping only academic
content, formulas, and exam/deadline announcements.

## Stack

React + Vite, Tailwind CSS, Lucide React icons. No backend — the app is a
single static front end that talks to Sarvam AI directly.

## Setup

```bash
npm install
cp .env.example .env
# paste your key into .env:
#   VITE_SARVAM_API_KEY=your_key_here
npm run dev
```

Open the printed local URL. Click **"⚡ Load Sample Demo Lecture"** to see the
full UI populated instantly without needing a key or a microphone — useful for
a hackathon pitch. Recording and file-drop require `VITE_SARVAM_API_KEY` to be
set, since they call the live Sarvam APIs.

## Project structure

```
classfilter-ai/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── .env.example
├── .gitignore
└── src/
    ├── main.jsx
    ├── App.jsx              # two-column dashboard layout + state
    ├── index.css
    ├── mockData.js          # sample Tanglish lecture used by the demo button
    ├── services/
    │   └── sarvam.js        # transcribeAudio() + filterLecture()
    └── components/
        ├── RecordPanel.jsx      # record button, drag & drop, language select
        ├── TranscriptFeed.jsx   # live tagged transcript
        ├── StatBar.jsx          # word count / noise % / time saved
        └── NotesDashboard.jsx   # tabbed notes + copy/PDF/Notion actions
```

## Notes on the Sarvam integration

- `src/services/sarvam.js` calls Sarvam's speech-to-text endpoint and a
  `sarvam-105b-conversations` chat completion directly from the browser using
  `VITE_SARVAM_API_KEY`. Confirm exact request/response shapes against
  https://docs.sarvam.ai before relying on this beyond a demo.
- Because the key ships in the client bundle, treat this as demo-only. For a
  real deployment, move both calls behind a small backend so the key never
  reaches the browser.
- "Export to Notion" is a placeholder — it currently copies notes as Markdown
  so you can paste them into a page. Wire it up to Notion's API when needed.
- "Download PDF" uses the browser's native print dialog (`window.print()`)
  scoped to the notes card, so no extra PDF library is required.

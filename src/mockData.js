// Pre-loaded sample lecture used by the "Load Sample Demo Lecture" button.
// This lets the app be demoed instantly without recording or uploading audio.

export const SAMPLE_RAW_SEGMENTS = [
  { text: "Okay students, listen up.", tag: "FLUFF", label: "Attendance" },
  {
    text: "Roll number 21 to 35, pass your assignment sheets to the front row.",
    tag: "FLUFF",
    label: "Attendance",
  },
  { text: "Class, silennce!", tag: "FLUFF", label: "Attendance" },
  {
    text: "So today we are discussing Fourier Transforms.",
    tag: "ACADEMIC",
  },
  {
    text: "Innaikkilam Fourier transform pathi dhaan paaka ponom, strictly important topic for End-Sem.",
    tag: "ACADEMIC",
  },
  {
    text: "Formula note panningo, F(omega) = integral from minus infinity to plus infinity of f(t) e^(-i omega t) dt.",
    tag: "ACADEMIC",
  },
  {
    text: "Apparam... idhu poga, adhu enna pa, last night IPL match paathingala?",
    tag: "FLUFF",
    label: "Joke/Story",
  },
  {
    text: "Chennai scored 200 runs, super game line-up.",
    tag: "FLUFF",
    label: "Joke/Story",
  },
  {
    text: "Anyway back to math. Fourier series represent periodic functions, whereas Fourier transforms break non-periodic signals into continuous frequencies.",
    tag: "ACADEMIC",
  },
  {
    text: "Remind me, assignment 2 is due this Friday by 5 PM, no extensions!",
    tag: "ACADEMIC",
  },
];

export const SAMPLE_RAW_TEXT = SAMPLE_RAW_SEGMENTS.map((s) => s.text).join(" ");

export const SAMPLE_FILTERED_NOTES = {
  noiseFilteredPercent: 62,
  rawWordCount: SAMPLE_RAW_TEXT.split(/\s+/).length,
  keyConcepts: [
    "**Fourier Transforms** decompose non-periodic signals into continuous frequencies.",
    "**Fourier series**, by contrast, represent periodic functions.",
    "The distinction between the two is the core idea for this unit.",
  ],
  formulas: [
    {
      name: "Fourier Transform",
      expression: "F(\u03c9) = \u222b\u2212\u221e\u221e f(t) e^(\u2212i\u03c9t) dt",
      note: "Maps a time-domain signal f(t) to its frequency-domain representation F(\u03c9).",
    },
  ],
  examHints: [
    {
      level: "high",
      text: "High importance for End-Sem exams \u2014 professor flagged this topic directly.",
    },
    {
      level: "medium",
      text: "Assignment 2 due Friday at 5:00 PM. No extensions.",
    },
  ],
};

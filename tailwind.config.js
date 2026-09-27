/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1117",
        panel: "#171A21",
        panelRaised: "#1E212B",
        line: "#2A2E3A",
        chalk: "#EDEFF4",
        muted: "#8A8F9C",
        marigold: "#E8A33D",
        marigoldDim: "#3A2E1B",
        teal: "#39C6A5",
        tealDim: "#173330",
        alert: "#E5484D",
        alertDim: "#3A1D1F",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

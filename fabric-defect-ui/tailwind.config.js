/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind where to look for class names
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base backgrounds
        base: "#0A0A0F",
        surface: "#111118",
        border: "#1E1E2E",

        // Accent colors
        primary: "#6366F1",   // indigo
        secondary: "#8B5CF6", // violet

        // Status colors
        success: "#10B981",   // green - PASS verdict
        danger: "#EF4444",    // red   - FAIL verdict

        // Text
        "text-primary": "#F8FAFC",
        "text-muted": "#94A3B8",
      },
      fontFamily: {
        // Display font for headings
        display: ["'Syne'", "sans-serif"],
        // Body font for paragraphs
        body: ["'DM Sans'", "sans-serif"],
        // Monospace for stats/numbers
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        // Gradient used on accent elements
        "gradient-primary": "linear-gradient(135deg, #6366F1, #8B5CF6)",
        // Subtle grid pattern for hero background
        "grid-pattern": "linear-gradient(#1E1E2E 1px, transparent 1px), linear-gradient(90deg, #1E1E2E 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
}
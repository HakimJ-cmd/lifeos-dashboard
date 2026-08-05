import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fcf8ff",
        "surface-dim": "#dcd8e5",
        "surface-bright": "#fcf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f2ff",
        "surface-container": "#f0ecf9",
        "surface-container-high": "#eae6f4",
        "surface-container-highest": "#e4e1ee",
        "on-surface": "#1b1b24",
        "on-surface-variant": "#464555",
        "inverse-surface": "#302f39",
        "inverse-on-surface": "#f3effc",
        outline: "#777587",
        "outline-variant": "#c7c4d8",
        primary: "#5b53f0",
        "on-primary": "#ffffff",
        "primary-container": "#eeebff",
        "on-primary-container": "#3423cb",
        secondary: "#505f76",
        "on-secondary": "#ffffff",
        "secondary-container": "#d0e1fb",
        "on-secondary-container": "#54647a",
        success: "#10b981",
        "success-container": "#d1fae5",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "dark-slate": "#1e1f29",
        background: "#f4f5f9",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
        input: "12px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(30, 31, 41, 0.05)",
        elevated: "0 12px 32px rgba(30, 31, 41, 0.12)",
        pill: "0 4px 12px rgba(91, 83, 240, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;

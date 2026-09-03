import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cheese: {
          purple: "#3b1360",
          violet: "#6b2fb3",
          magenta: "#c2247a",
          pink: "#ff5fa2",
          teal: "#0f9c9c",
          gold: "#ffb100",
          sun: "#ffe066",
          ink: "#160a26",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "cursive"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "cheese-radial":
          "radial-gradient(circle at 20% 20%, rgba(255,177,0,0.35), transparent 40%), radial-gradient(circle at 80% 15%, rgba(255,95,162,0.35), transparent 45%), radial-gradient(circle at 50% 80%, rgba(15,156,156,0.35), transparent 50%), linear-gradient(160deg, #160a26 0%, #3b1360 45%, #6b2fb3 100%)",
      },
      boxShadow: {
        glow: "0 0 25px rgba(255,177,0,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;

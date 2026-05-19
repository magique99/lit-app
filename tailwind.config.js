import lineClamp from "@tailwindcss/line-clamp";
import typography from "@tailwindcss/typography";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    lineClamp,
    typography,
  ],
};

export default config;

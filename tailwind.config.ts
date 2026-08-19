import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#111118",
        c1: "#18181F",
        c2: "#1E1E28",
        c3: "#252532",
        b1: "#2C2C3E",
        b2: "#363650",
        t1: "#E8E8F2",
        t2: "#9090C0",
        t3: "#55557A",
        acc: "#6C5CE7",
        acc2: "#8B7EF8",
        grn: "#00B894",
        amb: "#FDCB6E",
        red: "#E17055",
        blu: "#0984E3",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

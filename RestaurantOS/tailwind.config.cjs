module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-bg": "#0d0d0d",
        "dark-surface": "#161616",
        "dark-surface2": "#1e1e1e",
        "neon-lime": "#e8ff4d",
        "neon-orange": "#ff6b35",
        "dark-text": "#f0f0f0",
        "dark-muted": "#888",
      },
      fontFamily: {
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "sans-serif",
        ],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

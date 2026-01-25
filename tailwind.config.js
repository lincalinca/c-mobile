module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        crescender: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        gold: {
          DEFAULT: "#f5c518",
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#f5c518",
          600: "#eab308",
          700: "#ca8a04",
          800: "#a16207",
          900: "#854d0e",
          950: "#713f12",
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'system-ui', 'sans-serif'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Refined typography scale: Focus on smallest text readability
        // Smallest text gets +50%, larger text gets minimal increases to maintain hierarchy
        xs: ['18px', { lineHeight: '24px' }],      // was 12px → now 18px (+50%) CRITICAL
        sm: ['21px', { lineHeight: '28px' }],      // was 14px → now 21px (+50%) CRITICAL
        base: ['20px', { lineHeight: '28px' }],   // was 16px → now 20px (+25%) MODERATE
        lg: ['20px', { lineHeight: '28px' }],      // was 18px → now 20px (+11%) MINIMAL
        xl: ['22px', { lineHeight: '30px' }],      // was 20px → now 22px (+10%) MINIMAL
        '2xl': ['26px', { lineHeight: '34px' }],  // was 24px → now 26px (+8%) MINIMAL
        '3xl': ['32px', { lineHeight: '42px' }],  // was 30px → now 32px (+7%) MINIMAL
        '4xl': ['38px', { lineHeight: '48px' }],   // was 36px → now 38px (+6%) MINIMAL
        '5xl': ['48px', { lineHeight: '60px' }],  // was 48px → now 48px (unchanged)
        '6xl': ['60px', { lineHeight: '72px' }], // was 60px → now 60px (unchanged)
      },
    },
  },
  plugins: [],
}

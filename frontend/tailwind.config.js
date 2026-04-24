/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // 🔁 Section entrance animation
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
      },

      // 🎨 All custom colors – ADDED to Tailwind’s defaults (no overwrite)
      colors: {
        // ✅ shadcn required colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // ✅ your existing role-based colors
        student: {
          DEFAULT: '#4a69bd',
          light: '#6a89cc',
          bg: '#eef2f7',
          header: '#f6f8fa'
        },
        faculty: {
          DEFAULT: '#e67e22',
          light: '#f39c12',
          bg: '#fbfaf8',
          header: '#fdf5e6'
        },
        hod: {
          DEFAULT: '#8e44ad',
          light: '#9b59b6',
          bg: '#f9f7fb',
          header: '#f4eef7'
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
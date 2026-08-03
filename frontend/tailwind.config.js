/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ── Hallmark Design Language Colors ── */
      colors: {
        /* Warm Neutral Base */
        cream: {
          50: '#FAF8F5',
          100: '#F5F0EA',
          200: '#EDE5DA',
          300: '#DFD3C3',
        },
        /* Deep Warm Slate (text & structure) */
        slate: {
          700: '#2D3748',
          800: '#1E242B',
          900: '#141820',
        },
        /* Hallmark Gold (accent) */
        gold: {
          400: '#D4A837',
          500: '#C59B27',
          600: '#B38600',
          700: '#967000',
        },
        /* Deep Forest Emerald (official accent) */
        emerald: {
          400: '#34D399',
          500: '#10B981',
          600: '#1B6D4E',
          700: '#1B4D3E',
          800: '#14352B',
        },
        /* Status colors */
        status: {
          aktif: '#D1FAE5',     // Emerald muted bg
          aktifText: '#065F46',
          lulus: '#DBEAFE',     // Royal blue muted bg
          lulusText: '#1E40AF',
          pindah: '#FEF3C7',   // Amber warm bg
          pindahText: '#92400E',
          keluar: '#FECACA',
          keluarText: '#991B1B',
          nonaktif: '#E5E7EB',
          nonaktifText: '#4B5563',
        },
      },
      /* ── Typography ── */
      fontFamily: {
        serif: ['Lora', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      /* ── Shadows ── */
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(30, 36, 43, 0.06), 0 1px 2px -1px rgba(30, 36, 43, 0.06)',
        'warm-md': '0 4px 6px -1px rgba(30, 36, 43, 0.07), 0 2px 4px -2px rgba(30, 36, 43, 0.05)',
        'warm-lg': '0 10px 15px -3px rgba(30, 36, 43, 0.08), 0 4px 6px -4px rgba(30, 36, 43, 0.04)',
        'gold-glow': '0 0 0 3px rgba(197, 155, 39, 0.15)',
      },
      /* ── Border Radius ── */
      borderRadius: {
        'pill': '9999px',
      },
      /* ── Animations ── */
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // OnlyWorlds Browse Tool - Vibrant color palette
        primary: {
          DEFAULT: '#2c3e50', // Dark blue-grey
          dark: '#1a2531',    // Darker border
        },
        secondary: {
          DEFAULT: '#f8f9fa', // Very light grey (almost white)
          dark: '#e2e6ea',    // Darker grey for hover
        },
        sidebar: {
          DEFAULT: '#e2e8f0', // Light slate-200
          light: '#f1f5f9',   // Slate-100 for hover
          dark: '#cbd5e1',    // Slate-300 for active
        },
        accent: {
          DEFAULT: '#3b82f6', // Bright blue
          hover: '#2563eb',   // Darker blue for hover
        },
        // New vibrant colors for field sections
        sand: {
          50: '#fef3c7',    // Warm yellow-beige
          100: '#fde68a',   // Soft golden yellow
          200: '#fcd34d',   // Warm amber
        },
        field: {
          // Different colors for different field sections
          primary: '#ddd6fe',   // Light purple
          secondary: '#bfdbfe', // Light blue
          tertiary: '#fecaca',  // Light red/pink
          quaternary: '#d9f99d', // Light green
          highlight: '#fde68a',  // Warm yellow for hover
        },
        button: {
          DEFAULT: '#f8f9fa', // Light grey for buttons
          hover: '#e2e6ea',   // Darker grey for button hover
        },
        text: {
          dark: '#ffffff',    // White text on dark backgrounds
          light: '#343a40',   // Dark grey text on light backgrounds
        },
        border: {
          DEFAULT: '#dee2e6', // Standard border color
        },
        input: {
          bg: '#ffffff',      // White background for inputs
          border: '#ced4da',  // Border for inputs
        },
        success: {
          DEFAULT: '#28a745',
          bg: '#d4edda',
        },
        warning: {
          DEFAULT: '#dc3545', // Bootstrap danger color
          bg: '#f8d7da',      // Bootstrap danger background
        },
        info: {
          DEFAULT: '#17a2b8',
          bg: '#d1ecf1',
        },
        selected: {
          DEFAULT: '#a8d8ff', // Lighter blue for selected list item
        },
        link: {
          DEFAULT: '#3498db', // Same as accent
        },
        tooltip: {
          bg: 'rgba(0, 0, 0, 0.7)',
          text: '#ffffff',
        },
        delete: {
          bg: 'rgba(220, 53, 69, 0.8)',      // var(--warning-color) with alpha
          activeBg: 'rgba(190, 30, 45, 0.95)', // Darker warning color
          border: 'white',
        },
        grid: {
          DEFAULT: 'rgba(200, 200, 200, 0.5)', // Lighter grid
        },
        icon: {
          bg: '#e2e8f0',       // Match new sidebar background
          hover: '#cbd5e1',
          active: '#3b82f6',   // Use accent color
          activeBorder: '#2563eb', // Use accent hover
        },
        tab: {
          bg: '#f1f5f9',       // Slate-100 inactive tab
          activeBg: '#e2e8f0', // Match sidebar
          hover: '#cbd5e1',    // Slate-300
          text: '#475569',     // Dark text
          activeText: '#1e293b',
          border: '#cbd5e1',
        },
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // OnlyWorlds Map Tool color palette
        primary: {
          DEFAULT: '#2c3e50', // Dark blue-grey
          dark: '#1a2531',    // Darker border
        },
        secondary: {
          DEFAULT: '#f8f9fa', // Very light grey (almost white)
          dark: '#e2e6ea',    // Darker grey for hover
        },
        sidebar: {
          DEFAULT: '#d3d9df', // Slightly darker grey for sidebar
        },
        accent: {
          DEFAULT: '#3498db', // Bright blue
          hover: '#2980b9',   // Darker blue for hover
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
          bg: '#d3d9df',       // Match sidebar background
          hover: '#e2e8f0',
          active: '#3498db',   // Use accent color
          activeBorder: '#2980b9', // Use accent hover
        },
        tab: {
          bg: '#c8cfd4',       // Darker inactive tab background
          activeBg: '#d3d9df', // Match sidebar
          hover: '#f8f9fa',
          text: '#495057',
          activeText: '#000000',
          border: '#dee2e6',
        },
      },
    },
  },
  plugins: [],
}
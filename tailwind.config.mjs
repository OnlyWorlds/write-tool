/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Light paper/sand base colors
        paper: {
          50: '#faf8f2',  // Light sandy paper
          100: '#f5f1e6', // Sandy paper
          200: '#ede6d5', // Light sand
          300: '#e2d8c4', // Sand
          400: '#d6c9b2', // Medium sand
          500: '#c8b89e', // Warm sand
          600: '#b8a689', // Dark sand
          700: '#a59374', // Darker sand
          800: '#907e5f', // Deep sand
          900: '#7a684a', // Deepest sand
        },
        // Muted blue accent colors (like OnlyWorlds header)
        blue: {
          50: '#f4f6f8',  // Very light muted blue
          100: '#e8ecf1', // Light muted blue
          200: '#d1dae3', // Muted sky blue
          300: '#a8b8c8', // Medium muted blue
          400: '#7a8fa5', // Muted blue
          500: '#5c738a', // Primary muted blue
          600: '#4a5d70', // Strong muted blue
          700: '#556b7d', // Medium blue (for top bar)
          800: '#465c6e', // Dark blue
          900: '#384a5a', // Dark navy
        },
        // Warm sand/beige tones
        sand: {
          50: '#fdfbf4',  // Light warm sand
          100: '#f8f3e8', // Warm sand
          200: '#f0e7d6', // Light sandy beige
          300: '#e6d9c2', // Sandy beige
          400: '#dbc9ac', // Medium sandy beige
          500: '#ceb794', // Warm sandy beige
          600: '#bfa47a', // Dark sandy beige
          700: '#a98f62', // Darker sandy beige
          800: '#927a4d', // Deep sandy beige
          900: '#75643c', // Deepest sandy beige
        },
        // Subtle gray tones with warm tint
        gray: {
          50: '#fafaf9',  // Near white
          100: '#f5f5f3', // Very light gray
          200: '#ebebe7', // Light gray
          300: '#e0e0db', // Medium light gray
          400: '#d5d5cf', // Medium gray
          500: '#cacac3', // Neutral gray
          600: '#b0b0a9', // Dark gray
          700: '#96968f', // Darker gray
          800: '#7c7c75', // Deep gray
          900: '#62625b', // Charcoal
        },
      },
    },
  },
  plugins: [],
}
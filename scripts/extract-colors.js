#!/usr/bin/env node

/**
 * Color extraction script
 * 
 * To use:
 * 1. Make sure your dev server is running: pnpm dev
 * 2. Open http://localhost:5173/extract-colors.html in your browser
 * 3. Copy the CSS variables from the page
 * 4. Run this script with the colors: node scripts/extract-colors.js
 * 
 * Or visit the page and manually update src/index.css with the generated colors
 */

console.log(`
🎨 Color Extraction Helper

To extract colors from your logo:

1. Make sure your dev server is running:
   pnpm dev

2. Open this URL in your browser:
   http://localhost:5173/extract-colors.html

3. The page will automatically analyze your logo and display:
   - Dominant colors with hex codes
   - Generated CSS variables ready to copy

4. Copy the CSS variables from the page and update src/index.css

Alternatively, you can manually inspect your logo and provide the main colors,
and I can update the CSS for you.
`);

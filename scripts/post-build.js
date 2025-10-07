import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// GitHub Pages SPA redirect script for 404.html
// This handles direct navigation to /showcase/{id} URLs
const redirectScript = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      // GitHub Pages SPA redirect
      // Store the path and redirect to index.html
      sessionStorage.redirect = location.pathname;
      location.replace('/write-tool/');
    </script>
  </head>
  <body></body>
</html>`;

// Write the 404 redirect
writeFileSync(join(distDir, '404.html'), redirectScript);

console.log('✓ Post-build: Created 404 SPA redirect');

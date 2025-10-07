import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Create showcase directory and copy 404.html as index
const showcaseDir = join(distDir, 'showcase');
mkdirSync(showcaseDir, { recursive: true });
copyFileSync(join(distDir, '404.html'), join(showcaseDir, 'index.html'));

console.log('✓ Post-build: Created showcase fallback route');

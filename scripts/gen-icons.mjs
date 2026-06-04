// Generates SVG icons and converts to PNG using sharp
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svg192 = `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#0A0A0A"/>
  <rect x="16" y="16" width="160" height="160" rx="36" fill="#1A1A1A"/>
  <text x="96" y="110" font-family="Arial, sans-serif" font-weight="bold" font-size="96" fill="#C9A84C" text-anchor="middle">C</text>
</svg>`;

const svg512 = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0A0A0A"/>
  <rect x="40" y="40" width="432" height="432" rx="96" fill="#1A1A1A"/>
  <text x="256" y="300" font-family="Arial, sans-serif" font-weight="bold" font-size="260" fill="#C9A84C" text-anchor="middle">C</text>
</svg>`;

writeFileSync(path.join(__dirname, '../public/icon-192.svg'), svg192);
writeFileSync(path.join(__dirname, '../public/icon-512.svg'), svg512);
console.log('SVG icons written');

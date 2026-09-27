// Builds index.html from src/shell.html and the src/*.js modules (in file-name order).
// Usage: node tools/build.mjs [crazygames]
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const parts = readdirSync(src).filter(f => f.endsWith('.js')).sort();
const script = parts.map(f => readFileSync(join(src, f), 'utf8').replace(/\n+$/, '')).join('\n');
const shell = readFileSync(join(src, 'shell.html'), 'utf8');
if (!shell.includes('/*SCRIPT*/')) throw new Error('shell.html is missing the /*SCRIPT*/ marker');
const html = shell.replace('/*SCRIPT*/', () => script);
writeFileSync(join(root, 'index.html'), html);
console.log('index.html built from ' + parts.length + ' modules');
// Portal builds: `node tools/build.mjs crazygames` also writes dist/crazygames/index.html, the file to upload there.
// It is the same game with the portal's SDK loaded before it (see src/64_portal.js).
const PORTALS = { crazygames: 'https://sdk.crazygames.com/crazygames-sdk-v3.js' };
for (const name of process.argv.slice(2)) {
  if (!PORTALS[name]) throw new Error('Unknown portal "' + name + '" (known: ' + Object.keys(PORTALS).join(', ') + ')');
  const tag = '<script>window.__PORTAL__=' + JSON.stringify(name) + ';</script>\n<script src="' + PORTALS[name] + '"></script>\n';
  const i = html.lastIndexOf('<script>');
  if (i < 0) throw new Error('shell.html has no inline <script>');
  mkdirSync(join(root, 'dist', name), { recursive: true });
  writeFileSync(join(root, 'dist', name, 'index.html'), html.slice(0, i) + tag + html.slice(i));
  console.log('dist/' + name + '/index.html built');
}

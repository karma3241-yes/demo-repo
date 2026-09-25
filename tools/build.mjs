// Builds index.html from src/shell.html and the src/*.js modules (in file-name order).
// Usage: node tools/build.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const parts = readdirSync(src).filter(f => f.endsWith('.js')).sort();
const script = parts.map(f => readFileSync(join(src, f), 'utf8').replace(/\n+$/, '')).join('\n');
const shell = readFileSync(join(src, 'shell.html'), 'utf8');
if (!shell.includes('/*SCRIPT*/')) throw new Error('shell.html is missing the /*SCRIPT*/ marker');
writeFileSync(join(root, 'index.html'), shell.replace('/*SCRIPT*/', () => script));
console.log('index.html built from ' + parts.length + ' modules');

import { build } from 'esbuild';
import { cpSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const CLIENT_DIR = path.join(ROOT, 'client');

// Ensure output directories
mkdirSync(path.join(CLIENT_DIR, 'css'), { recursive: true });
mkdirSync(path.join(CLIENT_DIR, 'js'), { recursive: true });

// Bundle main.ts → app.js
build({
  entryPoints: [path.join(ROOT, 'client-src', 'main.ts')],
  bundle: true,
  outfile: path.join(CLIENT_DIR, 'app.js'),
  format: 'iife',
  minify: process.argv.includes('--minify'),
  sourcemap: !process.argv.includes('--minify'),
  target: 'es2022',
  // Exclude server-only dependencies — the domain configs don't import these
  external: ['better-sqlite3', 'express', 'nunjucks', 'multer'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
}).then(() => {
  // Copy CSS
  cpSync(path.join(ROOT, 'public', 'css', 'main.css'), path.join(CLIENT_DIR, 'css', 'main.css'));
  cpSync(path.join(ROOT, 'public', 'css', 'components.css'), path.join(CLIENT_DIR, 'css', 'components.css'));
  if (existsSync(path.join(ROOT, 'public', 'css', 'visualizations.css'))) {
    cpSync(path.join(ROOT, 'public', 'css', 'visualizations.css'), path.join(CLIENT_DIR, 'css', 'visualizations.css'));
  }

  // Copy JS libraries
  cpSync(path.join(ROOT, 'public', 'js', 'alpine.min.js'), path.join(CLIENT_DIR, 'js', 'alpine.min.js'));
  cpSync(path.join(ROOT, 'public', 'js', 'lucide.min.js'), path.join(CLIENT_DIR, 'js', 'lucide.min.js'));

  console.log('Client build complete → client/');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

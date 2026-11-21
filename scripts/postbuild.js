import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standaloneDir = path.join(root, '.next', 'standalone');
const staticDir = path.join(root, '.next', 'static');
const publicDir = path.join(root, 'public');

if (fs.existsSync(standaloneDir)) {
  const targetStatic = path.join(standaloneDir, '.next', 'static');
  const targetPublic = path.join(standaloneDir, 'public');

  if (fs.existsSync(staticDir)) {
    fs.cpSync(staticDir, targetStatic, { recursive: true });
    console.log('[Postbuild] Copied .next/static to .next/standalone/.next/static');
  }

  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, targetPublic, { recursive: true });
    console.log('[Postbuild] Copied public to .next/standalone/public');
  }
}

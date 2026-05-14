import { rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const distElectronDir = resolve(projectRoot, 'dist-electron');
const nodeEnv = process.env.NODE_ENV ?? 'production';

await rm(distElectronDir, { recursive: true, force: true });

await Promise.all([
  build({
    entryPoints: [resolve(projectRoot, 'src/main/index.ts')],
    outfile: resolve(distElectronDir, 'main/index.js'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    sourcemap: true,
    external: ['electron'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
  }),
  build({
    entryPoints: [resolve(projectRoot, 'src/preload/index.ts')],
    outfile: resolve(distElectronDir, 'preload/index.js'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    sourcemap: true,
    external: ['electron'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
  }),
]);

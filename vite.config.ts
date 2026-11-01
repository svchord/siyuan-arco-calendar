import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import minimist from 'minimist';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import livereload from 'rollup-plugin-livereload';
import zipPack from 'vite-plugin-zip-pack';
import fg from 'fast-glob';

const args = minimist(process.argv.slice(2));
const isWatch = args.watch || args.w || false;
const devDistDir = './dev';
const distDir = isWatch ? devDistDir : './dist';

console.log('isWatch=>', isWatch);
console.log('distDir=>', distDir);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [{ src: 'README*.md', dest: './' }],
    }),
  ],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(isWatch ? 'development' : 'production'),
    'process.env.DEV_MODE': JSON.stringify(`${isWatch}`),
  },

  build: {
    outDir: distDir,
    emptyOutDir: false,
    sourcemap: false,
    minify: !isWatch,
    target: 'es2022',
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.tsx'),
      fileName: 'index',
      cssFileName: 'index',
      formats: ['cjs'],
    },
    rollupOptions: {
      plugins: isWatch
        ? [
            livereload({
              watch: devDistDir,
              // Keep the default port (35729); only make the client URL explicit
              // because SiYuan's desktop window is HTTPS while livereload is HTTP.
              clientUrl: 'http://127.0.0.1:35729/livereload.js?snipver=1',
            }),
            {
              name: 'watch-external',
              async buildStart() {
                const files = await fg(['public/**', 'README*.md']);
                for (const file of files) {
                  this.addWatchFile(file);
                }
              },
            },
          ]
        : [zipPack({ inDir: './dist', outDir: './', outFileName: 'package.zip' })],
      external: ['siyuan', 'process'],
      output: {
        entryFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'index.css';
          }
          return assetInfo.name ?? 'asset';
        },
      },
    },
  },
});

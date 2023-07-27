/// <reference types="vite/client" />

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    dts({
      insertTypesEntry: true,
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'tidi',
      fileName: format => ({
        es: 'tidi.es.js',
        umd: 'tidi.umd.cjs',
      }[format]),
    },
    rollupOptions: {
      external: [],
    }
  }
});
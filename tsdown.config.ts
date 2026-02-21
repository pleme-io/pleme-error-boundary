import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    radix: 'src/radix/index.ts',
  },
  format: ['esm'],
  dts: false,
  target: 'es2022',
  splitting: true,
  treeshake: true,
  clean: true,
  platform: 'browser',
  external: ['react', '@pleme/types'],
});

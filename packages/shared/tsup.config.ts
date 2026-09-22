import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  // Not in watch mode: cleaning deletes dist/index.d.ts for the ~5s the DTS build takes,
  // and `turbo dev --parallel` starts the API's `nest start --watch` in that window — its
  // tsc then resolves `@alcha/shared` to the bare index.cjs (TS7016) and never recovers.
  clean: !options.watch,
  target: 'es2022',
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
}));

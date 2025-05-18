Bun.build({
  entrypoints: ['src/index.ts'],
  packages: 'external',
  target: 'bun',
  outdir: 'dist',
  bytecode: true
});


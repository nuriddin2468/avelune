// Size budget of the brand generator (ADR 0028, 0089), measured as for the kit's entry points: bundled with colorjs.io
// and minified by esbuild, compressed with brotli. `@avelune/ui/theme` loads it lazily, the first time a device sets a
// brand; the cached stylesheet applies without it afterwards.
//
//   size-limit --config scripts/size-limit.mts       (the tokens:size target, after tokens:build)
export default [
  {
    name: 'The brand generator: @avelune/tokens/brand',
    path: '../dist/brand/index.js',
    import: '{ generateAveBrand }',
    limit: '22.6 kB',
  },
];

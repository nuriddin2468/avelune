// Size budgets of the icon data (ADR 0028, 0036), measured as for the kit's entry points: bundled and minified by
// esbuild, compressed with brotli. One icon proves that an application's bundle keeps only the icons it imports; the
// whole set is what `provideAveIcons(lucideIcons)` costs.
//
//   size-limit --config scripts/size-limit.mts       (the icons:size target, after icons:build)
export default [
  {
    name: 'One icon from @avelune/icons/lucide',
    path: '../dist/lucide.js',
    import: '{ lucideCalendar }',
    limit: '250 B',
  },
  {
    name: 'Every icon: @avelune/icons/lucide/all',
    path: '../dist/lucide-all.js',
    import: '{ lucideIcons }',
    limit: '78 kB',
  },
];

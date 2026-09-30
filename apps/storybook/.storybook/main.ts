// Storybook on @storybook/angular-vite (ADR 0008): the Foundations pages in src/, and each component's docs page and
// stories next to it in packages/ui (ADR 0033). The dev server also serves the Storybook MCP server at /mcp, for coding
// agents (ADR 0090).
import type { StorybookConfig } from '@storybook/angular-vite';
import { join } from 'node:path';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts', '../../../packages/ui/**/*.mdx', '../../../packages/ui/**/*.stories.ts'],
  addons: [
    // GitHub-flavoured Markdown, for the tables of the docs pages; plain MDX renders them as text.
    {
      name: '@storybook/addon-docs',
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    // The MCP server on the dev server's /mcp, with its docs toolset only: it reads the components manifest below. The
    // dev and test toolsets bring a workflow of their own (their story conventions, `test-run` instead of the Nx
    // targets) that AGENTS.md and the ADRs settle otherwise (ADR 0090).
    { name: '@storybook/addon-mcp', options: { toolsets: { dev: false, docs: true, test: false } } },
  ],
  framework: {
    name: '@storybook/angular-vite',
    // JIT, the framework default: with AOT the production build drops the compiler that Storybook's wrapper needs.
    // Templates are type-checked by `storybook:typecheck` (ngc, strictTemplates) instead (ADR 0025).
    // The props table lists inputs only (with the change events of models): with the default, it also listed the
    // protected members a template reads, such as AveIcon's `icon` (ADR 0034, addendum).
    options: {
      jit: true,
      compodoc: false,
      propsTable: 'inputs',
      tsconfig: join(import.meta.dirname, '..', 'tsconfig.json'),
    },
  },
  // Storybook collects telemetry by default; nothing leaves the machine.
  core: { disableTelemetry: true },
  // The components manifest (manifests/components.json in the build): each story file's component with its inputs
  // and JSDoc, its stories' snippets and its docs page, for the MCP docs toolset. tools/manifest-check holds it to
  // the kit's whole public API (ADR 0090).
  features: { componentsManifest: true },
  // CDK's overlay and portal entry points share their portal classes through a chunk of CDK's own. Pre-bundled in
  // separate passes, each got its copy, and an overlay rejected a ComponentPortal made from @angular/cdk/portal
  // ("unknown Portal type"; the tooltip, ADR 0063). Pre-bundled together, they share it, as an application's bundle
  // does.
  viteFinal: (config) => ({
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [...(config.optimizeDeps?.include ?? []), '@angular/cdk/overlay', '@angular/cdk/portal'],
    },
  }),
};

export default config;

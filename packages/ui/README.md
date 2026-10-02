# @avelune/ui

Angular UI kit for internal work systems. Every component is a secondary entry point:

```ts
import { AveIcon } from '@avelune/ui/icon';
import { AveIconHarness } from '@avelune/ui/icon/testing';
```

Set an Angular CLI application up with one command (ADR 0103):

```bash
ng add @avelune/ui
```

It adds `@avelune/icons` and the CDK and Aria peers; puts `@avelune/ui/styles.css` first in the build's `styles`; keeps media files unhashed and turns critical-CSS inlining off; preloads the Latin face of Avelune Sans (`--preload-cyrillic` adds the Cyrillic one) and writes a script that applies the stored theme and brand before the first paint into `index.html`; adds `provideAvelune()` to the application's providers; installs `@avelune/eslint-config` and `@avelune/stylelint-config` and writes their configs where the workspace has none (`--lint=false` skips it); and puts the kit's rules for coding agents into `AGENTS.md` (`--agents=false` skips it). Running it again changes nothing; after a kit update it refreshes the script and the agent rules.

By hand, the same setup is: `provideAvelune()` in the application's providers,

```ts
import { provideAvelune } from '@avelune/ui/theme';

bootstrapApplication(App, { providers: [provideAvelune()] });
```

and the global stylesheet, loaded once through the application's bundler. It declares the cascade layers and brings the tokens, the fonts, the reset, the base typography and the focus ring; put the application's own styles in `@layer app`. With Angular's application builder (`angular.json`, the build options and the production configuration):

```json
"styles": ["@avelune/ui/styles.css"],
"optimization": { "scripts": true, "styles": { "minify": true, "inlineCritical": false }, "fonts": true },
"outputHashing": "bundles"
```

`inlineCritical: false` keeps the first paint in the right theme. `outputHashing: "bundles"` keeps font file names stable, so `index.html` can preload the Latin face:

```html
<link rel="preload" href="media/avelune-sans-latin.woff2" as="font" type="font/woff2" crossorigin />
```

The font files are also exported as `@avelune/ui/fonts/*`.

Documentation lives in the repository: `docs/GUIDELINES.md` (how to use the kit) and `docs/ARCHITECTURE.md` (how it is built).

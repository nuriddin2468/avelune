# @avelune/ui

Angular UI kit for internal work systems. Every component is a secondary entry point:

```ts
import { AveSample } from '@avelune/ui/sample';
import { AveSampleHarness } from '@avelune/ui/sample/testing';
```

Load the global stylesheet once, through the application's bundler. It declares the cascade layers and brings the tokens, the fonts, the reset, the base typography and the focus ring; put the application's own styles in `@layer app`. With Angular's application builder (`angular.json`, the build options and the production configuration):

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

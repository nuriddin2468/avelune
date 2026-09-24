# @avelune/icons

Every Lucide icon as typed data (ADR 0020, 0033, 0036), for `<ave-icon>` from `@avelune/ui/icon`.

```ts
import { lucideCalendar, lucideDownload } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';

providers: [provideAveIcons([lucideCalendar, lucideDownload])];
```

- `@avelune/icons/lucide`: one export per icon (`arrow-down` is `lucideArrowDown`); a bundle keeps only the icons it imports, about 0.2 kB each.
- `@avelune/icons/lucide/all`: `lucideIcons`, the whole set at once, about 75 kB brotli.
- `@avelune/icons`: the icon types, and `IconNames`, every name `<ave-icon>` accepts. An application adds its own icons' names by declaration merging, next to `defineAveIcon` from `@avelune/ui/icon`.

## Maintenance

- `pnpm nx run icons:generate` fails when `src/index.ts`, `src/lucide.ts`, `src/lucide-all.ts` or `LICENSE-lucide.txt` is not what the installed `lucide-static` generates; `--update` rewrites them. Review the diff.
- The generator rejects any shape, attribute or fill outside Lucide's rules (seven shapes; only dots filled, in `currentColor`).
- `pnpm nx run icons:build` compiles `src/` to `dist/`; `pnpm nx run icons:size` checks one icon (250 B) and the whole set (78 kB).

The Lucide licence (ISC) is in `LICENSE-lucide.txt`.

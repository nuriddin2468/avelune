// The fixed browser environment every browser suite runs in (ADR 0010, 0027): the pinned container, one device scale,
// locale, time zone and clock, reduced motion, and the kit's own fonts. tools/invariants imports it too.
import { expect, type Page, type PlaywrightTestConfig } from '@playwright/test';
import { join } from 'node:path';
import { containerPlatform, imageBrowsersPath, playwrightImage } from './image.ts';

export const workspaceRoot = join(import.meta.dirname, '..', '..', '..');

/** Set to the pinned image by the container runner (container.ts), and by CI jobs that run in that image. */
export const imageVariable = 'AVELUNE_PLAYWRIGHT_IMAGE';

/** The process facts that identify the pinned container. */
export interface ProcessFacts {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly platform: string;
  readonly arch: string;
}

/**
 * Whether a process runs in the pinned image on amd64: the runner's variable names the image, the browsers are the
 * image's own, and the OS and CPU match the CI runners.
 */
export function isPinnedContainer({ env, platform, arch }: ProcessFacts): boolean {
  return (
    env[imageVariable] === playwrightImage &&
    env['PLAYWRIGHT_BROWSERS_PATH'] === imageBrowsersPath &&
    platform === 'linux' &&
    arch === 'x64'
  );
}

/**
 * Throws unless this process runs in the pinned image on amd64. Screenshots from any other browser build, OS or CPU
 * differ in anti-aliasing, so baselines are made and compared only there (ADR 0010).
 */
export function requireContainer(): void {
  if (!isPinnedContainer({ env: process.env, platform: process.platform, arch: process.arch })) {
    throw new Error(
      `The browser suites run only in ${playwrightImage} on ${containerPlatform} (ADR 0010). ` +
        'Start them through their Nx targets (pnpm nx run visual:e2e, pnpm nx run invariants:e2e), which use Docker.',
    );
  }
}

/** Context options that fix everything a screenshot or a measurement depends on besides the page (ADR 0010). */
export const fixedEnvironment = {
  deviceScaleFactor: 1,
  // Stories and screens supply their own ru and uz content; the browser locale only affects defaults.
  locale: 'en-US',
  timezoneId: 'Asia/Tashkent',
  reducedMotion: 'reduce',
  // Never a service worker or a cached response between tests.
  serviceWorkers: 'block',
} as const satisfies PlaywrightTestConfig['use'];

/** The instant `Date.now()` returns in every page, so rendered dates never change (ADR 0010). */
export const fixedTime = new Date('2026-03-21T10:00:00+05:00');

/** The Playwright webServer entry that serves a built site from the workspace inside the container. */
export function staticServer(options: {
  readonly port: number;
  readonly root: string;
  readonly mounts?: Readonly<Record<string, string>>;
  readonly spa?: boolean;
}): NonNullable<PlaywrightTestConfig['webServer']> {
  const args = ['--port', String(options.port), '--root', JSON.stringify(options.root)];
  for (const [prefix, dir] of Object.entries(options.mounts ?? {}))
    args.push('--mount', JSON.stringify(`${prefix}=${dir}`));
  if (options.spa === true) args.push('--spa');
  return {
    command: `node tools/visual/src/serve.ts ${args.join(' ')}`,
    cwd: workspaceRoot,
    url: `http://127.0.0.1:${String(options.port)}/`,
    reuseExistingServer: false,
    stdout: 'ignore',
  };
}

interface FontState {
  readonly bodyFamily: string;
  readonly faces: readonly { readonly family: string; readonly status: FontFaceLoadStatus; readonly range: string }[];
  readonly textRendered: boolean;
}

/**
 * Asserts that the page's text is set in Avelune Sans from the kit's own woff2 files: the body uses the family, its
 * faces are declared, none failed to load, and every face the page's text needs has loaded. A missing fonts.css, a
 * 404 or a wrong font stack fails here instead of producing a baseline in a fallback font (ADR 0010).
 */
export async function expectKitFonts(page: Page): Promise<void> {
  const state = await page.evaluate(async (): Promise<FontState> => {
    await document.fonts.ready;
    const unquote = (family: string) => family.replace(/^["']|["']$/g, '');
    const body = getComputedStyle(document.body);
    const glyphs = document.body.innerText.replace(/\s/gu, '');
    return {
      bodyFamily: body.fontFamily,
      faces: [...document.fonts]
        .filter((face) => unquote(face.family).startsWith('Avelune '))
        .map((face) => ({ family: unquote(face.family), status: face.status, range: face.unicodeRange })),
      // check() is true when every face that matches the font and the text has loaded. White space is left out: the
      // Latin subset holds it, and Chromium loads no face for it, so a page without a Latin letter or digit would fail
      // though every glyph it shows has its face (ADR 0088).
      textRendered: glyphs === '' || document.fonts.check(`${body.fontSize} "Avelune Sans"`, glyphs),
    };
  });
  expect(state.bodyFamily, 'the body font stack starts with Avelune Sans').toMatch(/^"?Avelune Sans"?(,|$)/);
  expect(
    state.faces.filter((face) => face.family === 'Avelune Sans').length,
    'fonts.css declares Avelune Sans',
  ).toBeGreaterThan(0);
  expect(
    state.faces.filter((face) => face.status === 'error'),
    'no Avelune face failed to load',
  ).toEqual([]);
  expect(state.textRendered, 'every Avelune Sans face the page text needs has loaded').toBe(true);
}

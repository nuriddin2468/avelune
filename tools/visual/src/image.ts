// The one image every browser suite runs in (ADR 0010): the linux/amd64 manifest of mcr.microsoft.com/playwright's
// v1.63.0-noble index, pinned by digest. The digest changes only in a merge request that regenerates and explains
// every baseline. image.spec.ts checks that the tag's version equals the installed Playwright.

/** The pinned image, tag for readers and digest for the registry. */
export const playwrightImage =
  'mcr.microsoft.com/playwright:v1.63.0-noble@sha256:bc6ab0d6d44ff4826e4cb8c1e6d801e185bfc42bb0753f8e2a30efc70db054c7';

/** Always amd64, the CI runners' architecture; on Apple Silicon Docker emulates it (ADR 0010). */
export const containerPlatform = 'linux/amd64';

/** Where the image keeps its browsers (its `PLAYWRIGHT_BROWSERS_PATH`). */
export const imageBrowsersPath = '/ms-playwright';

/** The Playwright version in an image reference's tag (`…:v1.63.0-noble@…` → `1.63.0`). */
export function imageVersion(image: string = playwrightImage): string {
  const version = /:v(\d+\.\d+\.\d+)-[a-z]+@sha256:[0-9a-f]{64}$/.exec(image)?.[1];
  if (version === undefined) throw new Error(`Not a pinned Playwright image reference: ${image}`);
  return version;
}

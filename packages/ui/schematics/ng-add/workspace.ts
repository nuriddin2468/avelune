// The changes `ng add` makes to an application's build options (ADR 0030, 0103): the kit's stylesheet first, media
// files under their own names so that index.html can preload a font, and no critical-CSS inlining, which dropped the
// dark theme from the first paint. Each function returns its input when the change is already there.
import type { json } from '@angular-devkit/core';

/** The kit's global stylesheet, as the application's bundler resolves it through the package's exports. */
export const kitStylesheet = '@avelune/ui/styles.css';

/** A `styles` option with the kit's stylesheet first; an entry that names it already, as text or `input`, stays. */
export function withKitStylesheet(styles: json.JsonValue | undefined): json.JsonArray {
  const entries = Array.isArray(styles) ? styles : [];
  const named = entries.some(
    (entry) =>
      entry === kitStylesheet ||
      (typeof entry === 'object' && entry !== null && !Array.isArray(entry) && entry['input'] === kitStylesheet),
  );
  return named ? entries : [kitStylesheet, ...entries];
}

/** An `outputHashing` value that leaves media files unhashed: `all` becomes `bundles`, `media` becomes `none`. */
export function withUnhashedMedia(hashing: json.JsonValue | undefined): json.JsonValue | undefined {
  if (hashing === 'all') return 'bundles';
  if (hashing === 'media') return 'none';
  return hashing;
}

/**
 * An `optimization` value without critical-CSS inlining, everything else kept. Unset means the builder's default,
 * `true`, in the base options (`base`), and the base options' value in a configuration, which is left alone.
 */
export function withoutCriticalInlining(
  optimization: json.JsonValue | undefined,
  base: boolean,
): json.JsonValue | undefined {
  if (optimization === undefined && !base) return undefined;
  if (optimization === undefined || optimization === true) {
    return { scripts: true, styles: { minify: true, inlineCritical: false }, fonts: true };
  }
  if (typeof optimization !== 'object' || optimization === null || Array.isArray(optimization)) return optimization;
  const styles = optimization['styles'];
  if (styles === false) return optimization;
  if (styles === undefined || styles === true) {
    return { ...optimization, styles: { minify: true, inlineCritical: false } };
  }
  if (typeof styles !== 'object' || styles === null || Array.isArray(styles)) return optimization;
  return styles['inlineCritical'] === false
    ? optimization
    : { ...optimization, styles: { ...styles, inlineCritical: false } };
}

/** The folder the builder writes media files to, inside the browser output: `outputPath.media`, or `media`. */
export function mediaFolder(outputPath: json.JsonValue | undefined): string {
  if (typeof outputPath === 'object' && outputPath !== null && !Array.isArray(outputPath)) {
    const media = outputPath['media'];
    if (typeof media === 'string') return media;
  }
  return 'media';
}

/** The application's index.html: `index` as a path or `{ input }`, `null` for `index: false`, else the default. */
export function indexFile(index: json.JsonValue | undefined, sourceRoot: string): string | null {
  if (index === false) return null;
  if (typeof index === 'string') return index;
  if (typeof index === 'object' && index !== null && !Array.isArray(index) && typeof index['input'] === 'string') {
    return index['input'];
  }
  return `${sourceRoot}/index.html`;
}

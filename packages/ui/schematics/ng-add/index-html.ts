// The changes `ng add` makes to an application's index.html (ADR 0103): the pre-paint script first in the head, the
// font preloads at its end, and the script's hash in a Content-Security-Policy meta tag. Each function returns the
// document unchanged when the change is already there, so a second run writes nothing.
import { prePaintId, prePaintScript } from './pre-paint';

/** The indentation of the head's children: that of the first line after `<head>`, else two spaces. */
function childIndent(html: string, headEnd: number): string {
  return /^\r?\n([ \t]+)\S/.exec(html.slice(headEnd))?.[1] ?? '  ';
}

/** The position just after the opening `<head>` tag, or `undefined` when the document has none. */
function afterHeadTag(html: string): number | undefined {
  const head = /<head(?:\s[^>]*)?>/i.exec(html);
  return head === null ? undefined : head.index + head[0].length;
}

/**
 * The pre-paint script, replaced in place when present, else inserted after the charset declaration (or first in the
 * head), before any stylesheet. `prettier-ignore` keeps a formatter from rewriting the one line, whose hash a policy
 * may name.
 */
export function withPrePaintScript(html: string): string {
  const tag = `<script id="${prePaintId}">${prePaintScript}</script>`;
  const existing = new RegExp(`<script id="${prePaintId}">[\\s\\S]*?</script>`);
  if (existing.test(html)) return html.replace(existing, () => tag);
  const headEnd = afterHeadTag(html);
  if (headEnd === undefined) throw new Error('index.html has no <head>');
  const indent = childIndent(html, headEnd);
  const charset = /<meta\s+charset=[^>]*>/i.exec(html.slice(headEnd));
  const at = charset === null ? headEnd : headEnd + charset.index + charset[0].length;
  const block = [
    '<!-- @avelune/ui: the stored theme and brand before the first paint; ng add @avelune/ui rewrites it. -->',
    '<!-- prettier-ignore -->',
    tag,
  ];
  return `${html.slice(0, at)}${block.map((line) => `\n${indent}${line}`).join('')}${html.slice(at)}`;
}

/** A font preload link for each `href` that the head does not preload yet, at the end of the head. */
export function withPreloads(html: string, hrefs: readonly string[]): string {
  const missing = hrefs.filter((href) => !html.includes(`href="${href}"`));
  if (missing.length === 0) return html;
  const headEnd = afterHeadTag(html);
  const close = html.search(/<\/head>/i);
  if (headEnd === undefined || close < 0) throw new Error('index.html has no <head>');
  const indent = childIndent(html, headEnd);
  const lineStart = html.lastIndexOf('\n', close) + 1;
  const at = /^[ \t]*$/.test(html.slice(lineStart, close)) ? lineStart : close;
  const links = missing
    .map((href) => `${indent}<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>\n`)
    .join('');
  return at === lineStart
    ? `${html.slice(0, at)}${links}${html.slice(at)}`
    : `${html.slice(0, at)}\n${links}${html.slice(at)}`;
}

/** What {@link withScriptHash} found: no policy in the document, the hash added or already there, or no `script-src`. */
export type PolicyResult = 'none' | 'added' | 'present' | 'no-script-src';

/**
 * The script's hash in the `script-src` of a Content-Security-Policy meta tag. A policy without `script-src` is left
 * alone: `ng add` asks the application to add the directive rather than guess it from `default-src`.
 */
export function withScriptHash(html: string, source: string): { readonly html: string; readonly result: PolicyResult } {
  const meta = /<meta\s[^>]*http-equiv=(["'])Content-Security-Policy\1[^>]*>/i.exec(html);
  if (meta === null) return { html, result: 'none' };
  // A policy's sources are quoted ('self'), so the attribute is double-quoted; a single-quoted one is read too.
  const content = /\scontent=(?:"([^"]*)"|'([^']*)')/i.exec(meta[0]);
  const directives = (content?.[1] ?? content?.[2] ?? '').split(';').map((directive) => directive.trim());
  const index = directives.findIndex((directive) => /^script-src(?:\s|$)/i.test(directive));
  if (content === null || index < 0) return { html, result: 'no-script-src' };
  if (directives[index]?.split(/\s+/).includes(source)) return { html, result: 'present' };
  directives[index] = `${directives[index] ?? 'script-src'} ${source}`;
  const updated = meta[0].replace(content[0], ` content="${directives.filter(Boolean).join('; ')}"`);
  return { html: html.replace(meta[0], () => updated), result: 'added' };
}

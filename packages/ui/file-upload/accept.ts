/**
 * Whether a file matches an `accept` list as the native attribute reads it: comma-separated extensions (`.pdf`), MIME
 * types (`application/pdf`) and wildcards (`image/*`), in any case. An empty list takes every file. The system's
 * dialog filters by the same list, but a dropped file, or one chosen with "All files", is checked here.
 */
export function accepts(accept: string, file: { readonly name: string; readonly type: string }): boolean {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token !== '');
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/** Whether two files are the same file chosen twice: the same name, size and time of change. */
export function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

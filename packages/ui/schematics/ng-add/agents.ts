// The kit's section in an application's AGENTS.md (ADR 0103): docs/consumers/AGENTS.snippet.md between two markers,
// replaced in place on every run, so a newer kit's rules take the old ones' place.

const start = '<!-- avelune:start -->';
const end = '<!-- avelune:end -->';

/** Text without its white space: a section a formatter re-wrapped (the Angular CLI runs Prettier) is the same text. */
const squeezed = (text: string) => text.replace(/\s+/g, '');

/** AGENTS.md with the kit's section: replaced between the markers, appended, or the whole file when there is none. */
export function withAgentSnippet(agents: string | null, snippet: string): string {
  const block = `${start}\n${snippet.trim()}\n${end}`;
  if (agents === null) return `# AGENTS.md\n\n${block}\n`;
  const from = agents.indexOf(start);
  const to = agents.indexOf(end, from);
  if (from >= 0 && to >= 0) {
    if (squeezed(agents.slice(from + start.length, to)) === squeezed(snippet)) return agents;
    return `${agents.slice(0, from)}${block}${agents.slice(to + end.length)}`;
  }
  return `${agents.trimEnd()}\n\n${block}\n`;
}

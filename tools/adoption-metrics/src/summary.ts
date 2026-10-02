// The CI summary of a scan (ADR 0105): the counts with their change since the previous scan, the kit version lag, what
// was scanned and what was not, and the files with the most findings. The ratchet lists every count that rose.
import { metrics, type Counts, type Metric, type Report } from './scan.ts';

const labels: Readonly<Record<Metric, string>> = {
  rawColors: 'Raw colours',
  rawPixels: 'Raw pixel values',
  rawElements: 'Raw interactive elements',
  localKeyframes: 'Local keyframes',
  ngDeep: '`::ng-deep`',
  tokenOverrides: '`--ave-*` declared or unknown',
  inlineStyles: 'Inline styles in templates',
  bannedImports: 'Banned or deep imports',
};

/** A count's change: `+3`, `−2` or `0`; empty without a previous scan. */
function change(now: number, before: number | undefined): string {
  if (before === undefined) return '';
  const difference = now - before;
  if (difference > 0) return `+${String(difference)}`;
  return difference < 0 ? `−${String(-difference)}` : '0';
}

/** The previous scan's totals, if a value is one. */
export function previousTotals(value: unknown): Partial<Counts> | undefined {
  const totals: unknown = typeof value === 'object' && value !== null ? Reflect.get(value, 'totals') : undefined;
  if (typeof totals !== 'object' || totals === null) return undefined;
  return Object.fromEntries(
    metrics.flatMap((metric) => {
      const count: unknown = Reflect.get(totals, metric);
      return typeof count === 'number' ? [[metric, count]] : [];
    }),
  );
}

/** Every metric whose count rose since the previous scan. */
export function increases(report: Report, previous: Partial<Counts>): readonly Metric[] {
  return metrics.filter((metric) => {
    const before = previous[metric];
    return before !== undefined && report.totals[metric] > before;
  });
}

/** The lag in words. */
function lagText(report: Report): string {
  const { installed, latest, behind, distance } = report.kit;
  if (behind === 'not-installed') return `@avelune/ui is not installed; the latest is ${latest}.`;
  if (behind === 'none') return `@avelune/ui ${String(installed)}, up to date with ${latest}.`;
  const versions = distance === 1 ? 'version' : 'versions';
  return `@avelune/ui ${String(installed)}, ${String(distance)} ${behind} ${versions} behind ${latest}.`;
}

/** The Markdown summary of a scan of `name`. */
export function summary(name: string, report: Report, previous?: Partial<Counts>): string {
  const rows = metrics.map((metric) => {
    const cells = [labels[metric], String(report.totals[metric]), change(report.totals[metric], previous?.[metric])];
    return `| ${cells.join(' | ')} |`;
  });
  const { coverage } = report;
  const lines = [
    `## Avelune adoption: ${name}`,
    '',
    '| Metric | Count | Change |',
    '|---|---:|---:|',
    ...rows,
    '',
    lagText(report),
    '',
    `Scanned: ${String(coverage.stylesheets)} stylesheets, ${String(coverage.componentStyles)} component styles, ` +
      `${String(coverage.templates)} templates, ${String(coverage.scripts)} scripts. Not scanned: ` +
      `${String(coverage.skipped.preprocessed)} SCSS, Sass or Less files, ` +
      `${String(coverage.skipped.interpolatedStyles)} interpolated component styles, ` +
      `${String(coverage.skipped.unparsed)} files that did not parse.`,
  ];
  if (report.notes.length > 0) lines.push('', ...report.notes.map((note) => `- ${note}`));
  const top = report.files.slice(0, 10);
  if (top.length > 0) {
    lines.push('', '| File | Findings |', '|---|---|');
    for (const file of top) {
      const findings = metrics
        .flatMap((metric) => {
          const counted = file.counts[metric];
          return counted === undefined ? [] : [`${labels[metric]} ${String(counted)}`];
        })
        .join(', ');
      lines.push(`| \`${file.path}\` | ${findings} |`);
    }
  }
  return `${lines.join('\n')}\n`;
}

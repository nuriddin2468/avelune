// One branch of this file is never tested, so the per-file coverage thresholds of ui:test must fail the run.
export function toneLabel(tone: 'neutral' | 'accent'): string {
  if (tone === 'accent') {
    return 'Accent';
  }
  return 'Neutral';
}

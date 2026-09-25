/** A value moved into the bounds; a missing or reversed range leaves it as it is. */
export function clamp(value: number, min: number, max: number): number {
  if (!(max > min)) return value;
  return Math.min(max, Math.max(min, value));
}

/** Where a value lies between the bounds, from 0 to 1: the share of the track before its thumb. */
export function ratio(value: number, min: number, max: number): number {
  return max > min ? (clamp(value, min, max) - min) / (max - min) : 0;
}

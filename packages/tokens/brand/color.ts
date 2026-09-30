// Colour maths of the palette and the brand generator (ADR 0011, 0089): OKLCH in, 8-bit sRGB hex out, WCAG 2.x contrast
// measured on the hex the browser paints. colorjs.io's functions and space objects, imported one by one and passed
// directly, so no space is registered and a bundle leaves out the spaces the `colorjs.io/fn` barrel would bring (the
// package declares no side-effect-free modules); its `to` still brings the ΔE methods of its gamut mapping.
import contrastWCAG21 from 'colorjs.io/src/contrast/WCAG21.js';
import inGamut from 'colorjs.io/src/inGamut.js';
import OKLCH from 'colorjs.io/src/spaces/oklch.js';
import sRGB from 'colorjs.io/src/spaces/srgb.js';
import to from 'colorjs.io/src/to.js';
import toGamut from 'colorjs.io/src/toGamut.js';
import type { PlainColorObject } from 'colorjs.io/src/types.js';

/** A six-digit sRGB hex colour, lower case. */
export type Hex = `#${string}`;

const HEX = /^#[0-9a-f]{6}$/;

/** Whether a string is a six-digit hex colour; upper case is accepted. */
export function isHex(value: string): boolean {
  return HEX.test(value.toLowerCase());
}

/** The colour object of a hex colour, as colorjs.io's parser would make it. */
function srgbOf(hex: Hex): PlainColorObject {
  const channel = (offset: number) => parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return { space: sRGB, coords: [channel(1), channel(3), channel(5)], alpha: 1 };
}

/** OKLCH of a hex colour: lightness 0–1, chroma, hue in degrees (0 when achromatic), rounded as the palette stores it. */
export function oklchOf(hex: Hex): readonly [lightness: number, chroma: number, hue: number] {
  const [lightness, chroma, hue] = to(srgbOf(hex), OKLCH).coords;
  return [round(lightness ?? 0, 4), round(chroma ?? 0, 4), round(hue === null || Number.isNaN(hue) ? 0 : hue, 2)];
}

/** The largest chroma at this lightness and hue that is still inside sRGB. */
export function maxChroma(lightness: number, hue: number): number {
  let low = 0;
  let high = 0.5;
  for (let i = 0; i < 40; i++) {
    const middle = (low + high) / 2;
    if (inGamut({ space: OKLCH, coords: [lightness, middle, hue], alpha: 1 }, sRGB)) low = middle;
    else high = middle;
  }
  return low;
}

/**
 * The 8-bit sRGB hex of an OKLCH colour. Callers cap chroma at the sRGB boundary (`maxChroma`); CSS Color 4's gamut
 * mapping stays as a guard (ADR 0011).
 */
export function hexOf(lightness: number, chroma: number, hue: number): Hex {
  const mapped = toGamut({ space: OKLCH, coords: [lightness, chroma, hue], alpha: 1 }, { space: sRGB, method: 'css' });
  const channels = to(mapped, sRGB).coords.map((value) => Math.round(Math.min(1, Math.max(0, value ?? 0)) * 255));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG 2.x contrast ratio of two opaque colours (ADR 0011: the normative metric). */
export function contrast(a: Hex, b: Hex): number {
  return contrastWCAG21(srgbOf(a), srgbOf(b));
}

/**
 * A translucent colour composited over an opaque one in gamma-encoded sRGB, rounded to 8 bits, as browsers paint it
 * (the method of tools/tokens-check).
 */
export function over(top: Hex, alpha: number, bottom: Hex): Hex {
  const channels = [1, 3, 5].map((offset) => {
    const upper = parseInt(top.slice(offset, offset + 2), 16);
    const lower = parseInt(bottom.slice(offset, offset + 2), 16);
    return Math.round(upper * alpha + lower * (1 - alpha));
  });
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** Distance of two hues in degrees, 0–180. */
export function hueDistance(a: number, b: number): number {
  const distance = Math.abs(a - b) % 360;
  return distance > 180 ? 360 - distance : distance;
}

export function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

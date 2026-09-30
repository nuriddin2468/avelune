/**
 * The logo at the start of the application bar (ADR 0092): the product's or the tenant's image, never a token.
 *
 * @beta
 */
export interface AveAppLogo {
  /** The image's address on the light bar: a URL, or a `data:` URL the tenant uploaded. */
  readonly src: string;
  /** The image's address on the dark bar, for a logo that the dark surface would hide; `src` without it. */
  readonly darkSrc?: string;
  /**
   * What the logo says to someone who cannot see it: the organisation it stands for ("Узбекский банк"), or `''`
   * when the product's name beside it says the same.
   */
  readonly alt: string;
}

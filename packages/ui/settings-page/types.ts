import type { AveIconName } from '@avelune/ui/icon';

/**
 * A section of a settings page (ADR 0099): a page of its own, with its own address.
 *
 * @beta
 */
export interface AveSettingsSection {
  /** The section's name in the list: "Оформление". */
  readonly label: string;
  /** The section's address, a route of the application: "/settings/appearance". */
  readonly link: string;
  /** An icon before the name; none by default. */
  readonly icon?: AveIconName;
}

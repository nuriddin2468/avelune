import { lucideCircleAlert, lucideCircleCheck, lucideInfo, lucideTriangleAlert } from '@avelune/icons/lucide';
import type { AveIconName } from '@avelune/ui/icon';
import type { AveAlertVariant } from './types';

/**
 * The icons of the four variants, registered by the components that draw them: the alert, the banner and the toast.
 *
 * @beta
 */
export const aveStatusIcons = [lucideInfo, lucideCircleCheck, lucideTriangleAlert, lucideCircleAlert];

/**
 * Each variant's icon, a shape of its own, so the kind never rests on colour alone.
 *
 * @beta
 */
export const aveStatusIcon: Readonly<Record<AveAlertVariant, AveIconName>> = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  danger: 'circle-alert',
};

/**
 * Each variant's word in the kit's messages, which names its icon for assistive technology.
 *
 * @beta
 */
export const aveStatusLabel: Readonly<
  Record<AveAlertVariant, 'alertInfo' | 'alertSuccess' | 'alertWarning' | 'alertDanger'>
> = {
  info: 'alertInfo',
  success: 'alertSuccess',
  warning: 'alertWarning',
  danger: 'alertDanger',
};

/**
 * The live role of a message: a warning or an error interrupts (`alert`), information and success wait their turn
 * (`status`). Either is announced when the message appears, not when the page loads with it.
 *
 * @beta
 */
export function aveStatusRole(variant: AveAlertVariant): 'alert' | 'status' {
  return variant === 'warning' || variant === 'danger' ? 'alert' : 'status';
}

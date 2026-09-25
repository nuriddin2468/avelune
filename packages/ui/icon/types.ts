import type { IconDefinition, IconName } from '@avelune/icons';

/**
 * The name of an icon: every Lucide icon (`@avelune/icons/lucide`), and an application's own, declared on
 * `IconNames` of `@avelune/icons` (see `defineAveIcon`).
 *
 * @beta
 */
export type AveIconName = IconName;

/**
 * An icon `<ave-icon>` can draw: a Lucide export such as `lucideCalendar`, or the result of `defineAveIcon`.
 *
 * @beta
 */
export type AveIconDefinition<TName extends AveIconName = AveIconName> = IconDefinition<TName>;

/**
 * Icon sizes: `sm` 16px, `md` 20px, `lg` 24px (the `size.icon.*` tokens).
 *
 * @beta
 */
export type AveIconSize = 'sm' | 'md' | 'lg';

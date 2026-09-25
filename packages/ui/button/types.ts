/**
 * Button variants (ADR 0037): `primary` for the one main action of a region, `secondary` for every other action,
 * `ghost` for low-emphasis actions in dense places, `danger` for the confirming action of a destructive flow.
 *
 * @beta
 */
export type AveButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Button sizes, the control sizes shared with every control (`control.height.*`): `sm` 32px, `md` 36px, `lg` 40px,
 * one step smaller in compact density.
 *
 * @beta
 */
export type AveButtonSize = 'sm' | 'md' | 'lg';

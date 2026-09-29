/**
 * What a record's status means: `neutral` (default) for a state without a judgement ("Черновик"), `info` for work
 * under way ("На согласовании"), `success` for a good end ("Подписан"), `warning` for a risk ("Истекает") and
 * `danger` for a failure or an end that needs action ("Истёк", "Отклонён").
 *
 * @alpha
 */
export type AveBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

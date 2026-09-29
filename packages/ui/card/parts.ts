import { Component, DestroyRef, Directive, InjectionToken, inject, type WritableSignal } from '@angular/core';

/** The card around a title or an end, which draws its heading's row while it has one. */
export interface AveCardParts {
  /** How many titles the card holds. */
  readonly titles: WritableSignal<number>;
  /** How many ends of the heading's row the card holds. */
  readonly ends: WritableSignal<number>;
}

/** Provided by `<ave-card>` for its parts to say they are there. */
export const AVE_CARD_PARTS = new InjectionToken<AveCardParts>('AVE_CARD_PARTS');

/** Counts the caller in its card's parts for as long as it lives. */
function present(part: keyof AveCardParts): void {
  const card = inject(AVE_CARD_PARTS, { optional: true });
  if (card === null) return;
  card[part].update((count) => count + 1);
  inject(DestroyRef).onDestroy(() => {
    card[part].update((count) => count - 1);
  });
}

/**
 * A card's heading (ADR 0083), on the application's heading element of the page's level: the heading's small role.
 *
 * ```html
 * <h3 aveCardTitle><a aveLink routerLink="/contracts/114">Поставка офисной мебели</a></h3>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveCardTitle]',
  template: '<ng-content />',
  styleUrl: './title.css',
})
export class AveCardTitle {
  constructor() {
    present('titles');
  }
}

/**
 * Marks what stands at the end of a card's heading row (ADR 0083): the record's status, a menu of its actions. The
 * card places it; it may be a component.
 *
 * ```html
 * <ave-badge aveCardEnd variant="success">Подписан</ave-badge>
 * ```
 *
 * @alpha
 */
@Directive({ selector: '[aveCardEnd]' })
export class AveCardEnd {
  constructor() {
    present('ends');
  }
}

/**
 * A row of actions at the foot of a card (ADR 0083), at the inline end, 8px apart, wrapping.
 *
 * ```html
 * <div aveCardFooter><a aveButton routerLink="/contracts/114">Открыть договор</a></div>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveCardFooter]',
  template: '<ng-content />',
  styleUrl: './footer.css',
})
export class AveCardFooter {}

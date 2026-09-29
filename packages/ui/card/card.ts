import { Component, signal } from '@angular/core';
import { AVE_CARD_PARTS } from './parts';

/**
 * The kit's card (brief §9.4, ADR 0083): a bordered surface without a shadow for one record or one group of
 * settings, with its heading and what stands at the end of the heading's row, its content, and a row of actions at
 * its foot. It is a surface, with no role and no interaction of its own: a card that stands for a record links it
 * from its title.
 *
 * ```html
 * <ave-card>
 *   <h3 aveCardTitle>Поставка офисной мебели</h3>
 *   <ave-badge aveCardEnd variant="success">Подписан</ave-badge>
 *   <p>ООО «Мебель Сервис», до 31.12.2026</p>
 *   <div aveCardFooter><button aveButton type="button">Продлить</button></div>
 * </ave-card>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-card',
  providers: [{ provide: AVE_CARD_PARTS, useExisting: AveCard }],
  template: `
    @if (titles() > 0 || ends() > 0) {
      <div class="head">
        <ng-content select="[aveCardTitle]" />
        @if (ends() > 0) {
          <div class="end"><ng-content select="[aveCardEnd]" /></div>
        }
      </div>
    }
    <ng-content />
    <ng-content select="[aveCardFooter]" />
  `,
  styleUrl: './card.css',
})
export class AveCard {
  /** @internal How many titles the card holds; its titles count themselves in. */
  readonly titles = signal(0);

  /** @internal How many ends of the heading's row the card holds; they count themselves in. */
  readonly ends = signal(0);
}

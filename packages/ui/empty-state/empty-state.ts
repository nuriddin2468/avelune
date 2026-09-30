import { Component, input } from '@angular/core';
import { AveIcon, type AveIconName } from '@avelune/ui/icon';

/**
 * The actions of an empty state: the one or two buttons or links that lead out of it, in a centred row under its
 * message that wraps, the primary one last (ADR 0062).
 *
 * ```html
 * <div aveEmptyStateActions><a aveButton variant="primary" routerLink="/contracts/new">Создать договор</a></div>
 * ```
 *
 * @beta
 */
@Component({
  selector: '[aveEmptyStateActions]',
  template: '<ng-content />',
  styleUrl: './actions.css',
})
export class AveEmptyStateActions {}

/**
 * The kit's empty state (GUIDELINES.md, "Writing"; ADR 0062): what a list, a table or a panel shows when it holds
 * nothing, saying why and offering the next action. An icon in a circle, a heading, the message and the actions,
 * centred in the space the content would take. Register the icon with `provideAveIcons`.
 *
 * ```html
 * <ave-empty-state icon="search" heading="Ничего не найдено">
 *   <p>Ни один договор не подходит под фильтры.</p>
 *   <div aveEmptyStateActions><button aveButton type="button" (click)="reset()">Сбросить фильтры</button></div>
 * </ave-empty-state>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-empty-state',
  imports: [AveIcon],
  template: `
    @if (icon(); as name) {
      <span class="badge"><ave-icon [name]="name" size="lg" decorative /></span>
    }
    <p class="heading">{{ heading() }}</p>
    <div class="message"><ng-content /></div>
    <ng-content select="[aveEmptyStateActions]" />
  `,
  styleUrl: './empty-state.css',
})
export class AveEmptyState {
  /** What is empty, or why, in a few words: "Договоров пока нет", "Ничего не найдено". */
  readonly heading = input.required<string>();

  /** An icon for the kind of content that is missing, registered with `provideAveIcons`; decorative. */
  readonly icon = input<AveIconName>();
}

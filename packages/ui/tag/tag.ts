import {
  Component,
  ElementRef,
  EnvironmentInjector,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { lucideX } from '@avelune/icons/lucide';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import type { AveTagSize } from './types';

/** Unique ids for the words of tags, which name their remove buttons. */
let nextTag = 0;

/**
 * The kit's tag (brief §9.4, ADR 0080): a value in an outlined rectangle, such as a region chosen for a filter or a
 * label of a document. With `removable`, a button at its end takes the value away: it emits `remove`, and the
 * application removes the value. Screen readers hear the button as "Убрать" and the tag's words; once the tag has
 * gone, focus moves to the remove button of the tag after it, or of the one before.
 *
 * ```html
 * @for (region of regions(); track region.value) {
 *   <ave-tag removable (remove)="drop(region)">{{ region.label }}</ave-tag>
 * }
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-tag',
  imports: [AveIcon],
  providers: [provideAveIcons([lucideX])],
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-removable]': 'removable() ? "" : null',
  },
  template: `
    <span class="words" [id]="wordsId"><ng-content /></span>
    @if (removable()) {
      <button
        type="button"
        class="remove"
        data-focus-ring="inset"
        [attr.aria-labelledby]="nameId + ' ' + wordsId"
        (click)="press()"
      >
        <span hidden [id]="nameId">{{ messages.remove }}</span>
        <ave-icon name="x" decorative />
      </button>
    }
  `,
  styleUrl: './tag.css',
})
export class AveTag {
  /** The height: `md` (default) 28px on a page, `sm` 24px inside a field. */
  readonly size = input<AveTagSize>('md');

  /** Whether the tag has a button that takes its value away. */
  readonly removable = input(false, { transform: booleanAttribute });

  /** Emits when the person presses the remove button: remove the value, and the tag with it. */
  readonly remove = output();

  protected readonly messages = injectAveMessages();
  protected readonly wordsId = `ave-tag-${String(nextTag)}`;
  protected readonly nameId = `ave-tag-${String(nextTag++)}-remove`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Outlives the tag, so the focus can move once the tag has gone. */
  private readonly environment = inject(EnvironmentInjector);

  protected press(): void {
    const neighbour = this.neighbour();
    this.remove.emit();
    afterNextRender(
      () => {
        const focused = document.activeElement;
        if (this.host.isConnected || (focused !== null && focused !== document.body)) return;
        if (neighbour?.isConnected === true) neighbour.focus();
      },
      { injector: this.environment },
    );
  }

  /** The remove button of the tag after this one among its siblings, or of the one before. */
  private neighbour(): HTMLElement | undefined {
    let list = this.host.parentElement;
    if (list?.tagName === 'LI') list = list.parentElement;
    if (list === null) return undefined;
    const buttons = [
      ...list.querySelectorAll<HTMLElement>(':scope > ave-tag > .remove, :scope > li > ave-tag > .remove'),
    ];
    const own = buttons.findIndex((button) => this.host.contains(button));
    return buttons[own + 1] ?? buttons[own - 1];
  }
}

import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, type TemplateRef } from '@angular/core';
import { AveIcon } from '@avelune/ui/icon';
import type { AveOptionContext } from './templates';
import type { AveOption } from './types';

/** Unique ids for the options of the family's lists. */
let nextList = 0;

/** A prefix for the ids of one list's options. */
export function optionIds(): string {
  return `ave-options-${String(nextList++)}`;
}

/**
 * The ids that describe an option (ADR 0055): its description and its meta, as its row draws them; none when a
 * template draws the row.
 */
export function describedBy(option: AveOption<unknown>, id: string, templated: boolean): string | null {
  if (templated) return null;
  const ids = [
    ...(option.description === undefined ? [] : [`${id}-description`]),
    ...(option.meta === undefined ? [] : [`${id}-meta`]),
  ];
  return ids.length === 0 ? null : ids.join(' ');
}

/** A URL as a CSS `url()`: its quotes and backslashes escaped, its line breaks dropped. */
function cssUrl(url: string): string {
  return `url("${url.replace(/[\n\r\f]/g, '').replace(/["\\]/g, '\\$&')}")`;
}

/**
 * The inside of an option's row in the select family (ADR 0055): an icon or an image at the start, the label and a
 * second line, the meta at the end; or the application's template. In a trigger, one line: the start and the label.
 * The image is the start box's background, from a custom property bound here, on the host, outside the template.
 */
@Component({
  selector: 'ave-option-content',
  imports: [AveIcon, NgTemplateOutlet],
  host: {
    '[attr.data-lines]': 'lines()',
    '[style.--ave-option-image]': 'image()',
  },
  template: `
    @if (template(); as custom) {
      <span class="custom"
        ><ng-container [ngTemplateOutlet]="custom" [ngTemplateOutletContext]="{ $implicit: option() }"
      /></span>
    } @else {
      @if (option().icon; as icon) {
        <span class="lead"><ave-icon [name]="icon" decorative /></span>
      } @else if (option().image !== undefined) {
        <span class="lead image"></span>
      }
      <span class="text">
        <span class="label">{{ option().label }}</span>
        @if (lines() === 'two' && option().description; as description) {
          <span class="description" [id]="idPrefix() + '-description'">{{ description }}</span>
        }
      </span>
      @if (lines() === 'two' && option().meta; as meta) {
        <span class="meta" [id]="idPrefix() + '-meta'">{{ meta }}</span>
      }
    }
  `,
  styleUrl: './option-content.css',
})
export class AveOptionContent<V> {
  /** The option drawn. */
  readonly option = input.required<AveOption<V>>();
  /** The application's template for the inside of the row, if any. */
  readonly template = input<TemplateRef<AveOptionContext<V>>>();
  /** Two lines in a list; one in a trigger, the start and the label. */
  readonly lines = input<'one' | 'two'>('two');
  /** The prefix of the ids of the description and the meta, which describe the option. */
  readonly idPrefix = input('');

  protected readonly image = computed(() => {
    const { image } = this.option();
    return image === undefined ? null : cssUrl(image);
  });
}

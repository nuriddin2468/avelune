import type { TestElement } from '@angular/cdk/testing';

/** An option's name: its label, which the kit gives it as `aria-label` whatever its row draws (ADR 0055). */
export function optionName(option: TestElement): Promise<string> {
  return option.getProperty<string>('ariaLabel');
}

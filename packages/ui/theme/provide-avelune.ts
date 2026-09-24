import {
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { AVE_OPTIONS, AveTheme, type AveOptions } from './theme';

/**
 * Sets Avelune up in an application (brief §6.6): the theme, density and motion that apply until the user chooses
 * otherwise, and an {@link AveTheme} created at bootstrap, so the attributes are on `<html>` before the first
 * render. Add it to the application's providers:
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideAvelune({ density: 'compact' })] });
 * ```
 *
 * @alpha
 */
export function provideAvelune(options: AveOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AVE_OPTIONS, useValue: options },
    provideEnvironmentInitializer(() => {
      inject(AveTheme);
    }),
  ]);
}

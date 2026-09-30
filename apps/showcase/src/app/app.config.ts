import { type ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  lucideCircleAlert,
  lucideCircleCheck,
  lucideFileText,
  lucideLayoutDashboard,
  lucideMoon,
  lucideNetwork,
  lucideRows2,
  lucideRows3,
  lucideSettings,
  lucideSun,
} from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { provideAvelune } from '@avelune/ui/theme';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  // Only the icons the screens draw themselves are registered, so only they reach the bundle (ADR 0036); the kit's
  // components register their own.
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The screens are in Russian; the kit's own words follow (ADR 0047).
    { provide: LOCALE_ID, useValue: 'ru' },
    provideAvelune({ theme: 'light' }),
    // A route's parameters are the inputs of its screen (a contract's `:id`).
    provideRouter(routes, withComponentInputBinding()),
    provideAveIcons([
      lucideCircleAlert,
      lucideCircleCheck,
      lucideFileText,
      lucideLayoutDashboard,
      lucideMoon,
      lucideNetwork,
      lucideRows2,
      lucideRows3,
      lucideSettings,
      lucideSun,
    ]),
  ],
};

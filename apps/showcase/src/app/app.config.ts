import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  lucideCircleAlert,
  lucideCircleCheck,
  lucideMoon,
  lucideRows2,
  lucideRows3,
  lucideSun,
} from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { provideAvelune } from '@avelune/ui/theme';

export const appConfig: ApplicationConfig = {
  // Only the icons the screens draw themselves are registered, so only they reach the bundle (ADR 0036); the kit's
  // components register their own.
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAvelune({ theme: 'light' }),
    provideAveIcons([lucideCircleAlert, lucideCircleCheck, lucideMoon, lucideRows2, lucideRows3, lucideSun]),
  ],
};

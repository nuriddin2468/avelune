import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { lucideCircleCheck } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { provideAvelune } from '@avelune/ui/theme';

export const appConfig: ApplicationConfig = {
  // Only the icons the screens use are registered, so only they reach the bundle (ADR 0036).
  providers: [provideBrowserGlobalErrorListeners(), provideAvelune(), provideAveIcons([lucideCircleCheck])],
};

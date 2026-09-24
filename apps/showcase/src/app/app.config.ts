import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAvelune } from '@avelune/ui/theme';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideAvelune()],
};

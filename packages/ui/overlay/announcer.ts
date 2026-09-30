import { ElementRef, inject, type Provider } from '@angular/core';
import { LIVE_ANNOUNCER_ELEMENT_TOKEN, LiveAnnouncer } from '@angular/cdk/a11y';
import { _CdkPrivateStyleLoader, _VisuallyHiddenLoader } from '@angular/cdk/private';

let nextAnnouncer = 0;

/**
 * A `LiveAnnouncer` of the component's own, whose live element is inside the component's host (ADR 0066, 0068). A
 * modal `<dialog>` makes everything outside it inert, CDK's live element in `<body>` included, so what a control inside
 * the dialog announces (a file upload, a searched list) would be silent; the kit's dialogs and its toast region, which
 * moves into an open modal dialog, provide this instead.
 *
 * @beta
 */
export const aveHostAnnouncer: Provider[] = [
  LiveAnnouncer,
  {
    provide: LIVE_ANNOUNCER_ELEMENT_TOKEN,
    useFactory: (): HTMLElement => {
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      // CDK hides its live element with this class but loads its styles only through its directives.
      inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
      const live = host.ownerDocument.createElement('div');
      live.classList.add('cdk-live-announcer-element', 'cdk-visually-hidden');
      live.setAttribute('aria-atomic', 'true');
      live.setAttribute('aria-live', 'polite');
      live.id = `ave-announcer-${String(nextAnnouncer++)}`;
      host.append(live);
      return live;
    },
  },
];

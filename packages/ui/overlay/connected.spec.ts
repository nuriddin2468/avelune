import { describe, expect, it } from 'vitest';
import { aveConnectedOverlay } from '@avelune/ui/overlay';

describe('aveConnectedOverlay', () => {
  it('opens a list from its control, as wide as it, in the top layer', () => {
    const control = document.createElement('button');
    const config = aveConnectedOverlay(control);
    expect(config.usePopover).toBe('inline');
    expect(config.matchWidth).toBe(true);
    expect(config.positions).toHaveLength(2);
    expect(config.push).toBeUndefined();
    expect(config.disableClose).toBe(true);
  });

  it('lets a menu or a popover end at its button and be pushed space.2 inside the viewport', () => {
    const button = document.createElement('button');
    document.body.append(button);
    expect(aveConnectedOverlay(button, { align: 'either' }).viewportMargin).toBe(0);
    button.style.setProperty('--ave-space-2', '8px');
    const config = aveConnectedOverlay(button, { matchWidth: false, align: 'either', transformOrigin: '.menu' });
    expect(config.positions).toHaveLength(4);
    expect(config.push).toBe(true);
    expect(config.viewportMargin).toBe(8);
    expect(config.transformOriginSelector).toBe('.menu');
    button.remove();
  });
});

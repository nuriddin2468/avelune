// A popup under every [data-popup] control, as the kit's overlays behave: a popover whose surface enters and leaves on
// the motion catalog's keyframes, closes on Escape (focus back to the control) and on a press outside, and leaves the
// DOM once its exit has played. data-broken="look motion escape outside" turns parts off for the violation page.
for (const control of document.querySelectorAll('[data-popup]')) {
  const broken = new Set((control.getAttribute('data-broken') ?? '').split(' '));
  let host = null;

  const open = () => {
    host = document.createElement('div');
    host.setAttribute('popover', 'manual');
    host.className = 'popup-host';
    const surface = document.createElement('div');
    surface.className = broken.has('look') ? 'surface flat' : 'surface';
    if (!broken.has('motion')) surface.classList.add('enter');
    surface.textContent = 'Popup';
    host.append(surface);
    control.after(host);
    host.showPopover();
    control.setAttribute('aria-expanded', 'true');
  };

  const close = (returnFocus) => {
    if (host === null) return;
    const closing = host;
    host = null;
    control.setAttribute('aria-expanded', 'false');
    const surface = closing.firstElementChild;
    surface.classList.remove('enter');
    if (!broken.has('motion')) surface.classList.add('exit');
    void Promise.allSettled(surface.getAnimations().map((animation) => animation.finished)).then(() =>
      closing.remove(),
    );
    if (returnFocus) control.focus();
  };

  control.addEventListener('click', () => (host === null ? open() : close(false)));
  if (!broken.has('escape')) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close(true);
    });
  }
  if (!broken.has('outside')) {
    document.addEventListener('pointerdown', (event) => {
      if (host !== null && !host.contains(event.target) && !control.contains(event.target)) close(false);
    });
  }
}

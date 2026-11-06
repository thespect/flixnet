// Cineflex Shared Scroll Lock Manager
// Previene carreras de montaje/desmontaje entre modales múltiples (iOS Safari, Android Chrome y Desktop)

let activeScrollLocks = 0;
let originalScrollStyles = null;

export function lockBodyScroll() {
  if (typeof document === 'undefined') return () => {};

  activeScrollLocks++;
  if (activeScrollLocks === 1) {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    originalScrollStyles = {
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      touchAction: document.body.style.touchAction,
      scrollY
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.touchAction = 'none';
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeScrollLocks = Math.max(0, activeScrollLocks - 1);

    if (activeScrollLocks === 0 && originalScrollStyles) {
      const { bodyOverflow, htmlOverflow, position, top, width, touchAction, scrollY } = originalScrollStyles;
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      document.body.style.touchAction = touchAction;
      window.scrollTo(0, scrollY);
      originalScrollStyles = null;
    }
  };
}

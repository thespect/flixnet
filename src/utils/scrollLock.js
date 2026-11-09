// Cineflex Shared Scroll Lock Manager
// Previene carreras de montaje/desmontaje entre modales múltiples sin atrapar el scroll (iOS Safari, Android Chrome y Desktop)

let activeScrollLocks = 0;

export function lockBodyScroll() {
  if (typeof document === 'undefined') return () => {};

  activeScrollLocks++;
  if (activeScrollLocks === 1) {
    document.body.classList.add('overflow-hidden');
    document.documentElement.classList.add('overflow-hidden');
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeScrollLocks = Math.max(0, activeScrollLocks - 1);

    if (activeScrollLocks === 0) {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
    }
  };
}

export function forceUnlockAllScroll() {
  activeScrollLocks = 0;
  if (typeof document !== 'undefined') {
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.touchAction = '';
  }
}

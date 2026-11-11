/** Keep an unattended TV eligible for new worker releases without refreshing other routes. */
export function watchTVWorkerUpdates(): () => void {
  if (window.location.pathname !== '/video' || !('serviceWorker' in navigator)) return () => {};
  let active = true;
  let checking = false;
  const check = async () => {
    if (!active || checking || document.visibilityState !== 'visible') return;
    checking = true;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (active) await registration?.update();
    } catch { /* Offline TVs retry on the next tick or connection event. */ }
    finally { checking = false; }
  };
  void check();
  const timer = window.setInterval(() => void check(), 60_000);
  window.addEventListener('online', check);
  document.addEventListener('visibilitychange', check);
  return () => {
    active = false;
    window.clearInterval(timer);
    window.removeEventListener('online', check);
    document.removeEventListener('visibilitychange', check);
  };
}

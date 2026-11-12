import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let registered = false;
// skipWaiting/clientsClaim stay off so an update never reloads a half-filled form;
// the waiter is activated only by this explicit call.
let applyUpdate: ((reloadPage?: boolean) => Promise<void>) | null = null;

export function usePwa() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);
  const [registerError, setRegisterError] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installFailed, setInstallFailed] = useState(false);

  useEffect(() => {
    const sync = (): void => setOnline(navigator.onLine);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    // Service workers (and the offline cache) require HTTPS or localhost; over plain
    // HTTP the API is not even exposed, so the UI must say offline is unavailable.
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      setRegisterError(true);
    } else if (!registered) {
      registered = true;
      applyUpdate = registerSW({
        onOfflineReady: () => setOfflineReady(true),
        onNeedRefresh: () => setUpdateReady(true),
        onRegisterError: () => setRegisterError(true),
      });
      void navigator.serviceWorker.ready.then(() => setOfflineReady(true));
    }

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  useEffect(() => {
    const capture = (event: Event): void => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installed = (): void => setPrompt(null);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  async function install(): Promise<void> {
    if (!prompt) return;
    const pending = prompt;
    setPrompt(null);
    try {
      await pending.prompt();
      await pending.userChoice;
    } catch {
      setInstallFailed(true);
    }
  }

  function update(): void {
    if (!applyUpdate) return;
    void applyUpdate(true);
  }

  return {
    offlineReady,
    online,
    updateReady,
    registerError,
    canInstall: prompt !== null,
    installFailed,
    install,
    update,
  };
}

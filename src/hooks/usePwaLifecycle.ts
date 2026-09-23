import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

import {
  getInitialPwaLifecycleSnapshot,
  getPwaLifecycleCopy,
  reducePwaLifecycleSnapshot,
  shouldShowPwaStatus,
  type PwaLifecycleSnapshot,
} from '../lib/pwaLifecycle';

type BeforeInstallPromptChoice = {
  outcome: 'accepted' | 'dismissed';
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
};

function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return typeof (event as BeforeInstallPromptEvent).prompt === 'function'
    && Boolean((event as BeforeInstallPromptEvent).userChoice);
}

export function usePwaLifecycle(language?: string) {
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const updateServiceWorkerRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const [snapshot, setSnapshot] = useState<PwaLifecycleSnapshot>(() => getInitialPwaLifecycleSnapshot());

  const dispatch = useCallback((event: Parameters<typeof reducePwaLifecycleSnapshot>[1]) => {
    setSnapshot(current => reducePwaLifecycleSnapshot(current, event));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    dispatch({ type: 'sw-registering' });
    updateServiceWorkerRef.current = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        dispatch({ type: 'sw-registered' });
        registration?.update().catch(() => dispatch({ type: 'sw-error' }));
      },
      onOfflineReady() {
        dispatch({ type: 'sw-offline-ready' });
      },
      onNeedRefresh() {
        dispatch({ type: 'sw-update-ready' });
      },
      onRegisterError() {
        dispatch({ type: 'sw-error' });
      },
    });

    const handleOnline = () => dispatch({ type: 'connectivity', online: true });
    const handleOffline = () => dispatch({ type: 'connectivity', online: false });
    const handleBeforeInstallPrompt = (event: Event) => {
      if (!isBeforeInstallPromptEvent(event)) return;
      event.preventDefault();
      installPromptRef.current = event;
      dispatch({ type: 'install-ready' });
    };
    const handleAppInstalled = () => {
      installPromptRef.current = null;
      dispatch({ type: 'installed' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dispatch]);

  const installApp = useCallback(async () => {
    const promptEvent = installPromptRef.current;
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    installPromptRef.current = null;
    dispatch({ type: choice.outcome === 'accepted' ? 'installed' : 'install-dismissed' });
  }, [dispatch]);

  const dismissInstallPrompt = useCallback(() => {
    installPromptRef.current = null;
    dispatch({ type: 'install-dismissed' });
  }, [dispatch]);

  const updateApp = useCallback(async () => {
    const updateServiceWorker = updateServiceWorkerRef.current;
    if (!updateServiceWorker) return;
    await updateServiceWorker(true);
  }, []);

  const copy = useMemo(
    () => getPwaLifecycleCopy(snapshot, language || (typeof navigator !== 'undefined' ? navigator.language : 'en')),
    [language, snapshot],
  );

  return {
    snapshot,
    copy,
    visible: shouldShowPwaStatus(snapshot),
    installApp,
    dismissInstallPrompt,
    updateApp,
  };
}

export type PwaConnectivity = 'online' | 'offline';
export type PwaInstallState = 'unsupported' | 'ready' | 'installed' | 'dismissed';
export type PwaServiceWorkerState = 'unsupported' | 'registering' | 'registered' | 'offline-ready' | 'update-ready' | 'error';

export type PwaLifecycleSnapshot = {
  connectivity: PwaConnectivity;
  installState: PwaInstallState;
  serviceWorkerState: PwaServiceWorkerState;
  standalone: boolean;
  updateAvailable: boolean;
  offlineReady: boolean;
  lastEvent: string;
};

export type PwaLifecycleEvent =
  | { type: 'connectivity'; online: boolean }
  | { type: 'install-ready' }
  | { type: 'install-dismissed' }
  | { type: 'installed' }
  | { type: 'sw-registering' }
  | { type: 'sw-registered' }
  | { type: 'sw-offline-ready' }
  | { type: 'sw-update-ready' }
  | { type: 'sw-error' };

export type PwaLifecycleCopy = {
  title: string;
  body: string;
  primaryAction?: string;
  secondaryAction?: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
};

function browserNavigator(): Navigator | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator;
}

export function isStandaloneDisplay(win: Window | undefined = typeof window === 'undefined' ? undefined : window) {
  if (!win) return false;
  const standaloneNavigator = browserNavigator() as (Navigator & { standalone?: boolean }) | undefined;
  return Boolean(
    win.matchMedia?.('(display-mode: standalone)').matches
    || win.matchMedia?.('(display-mode: fullscreen)').matches
    || standaloneNavigator?.standalone,
  );
}

export function getInitialPwaLifecycleSnapshot(
  options: {
    online?: boolean;
    standalone?: boolean;
    serviceWorkerSupported?: boolean;
    beforeInstallPromptSupported?: boolean;
  } = {},
): PwaLifecycleSnapshot {
  const nav = browserNavigator();
  const online = options.online ?? nav?.onLine ?? true;
  const serviceWorkerSupported = options.serviceWorkerSupported ?? Boolean(nav && 'serviceWorker' in nav);
  const standalone = options.standalone ?? isStandaloneDisplay();

  return {
    connectivity: online ? 'online' : 'offline',
    installState: standalone
      ? 'installed'
      : options.beforeInstallPromptSupported === false
        ? 'unsupported'
        : 'unsupported',
    serviceWorkerState: serviceWorkerSupported ? 'registering' : 'unsupported',
    standalone,
    updateAvailable: false,
    offlineReady: false,
    lastEvent: online ? 'initial-online' : 'initial-offline',
  };
}

export function reducePwaLifecycleSnapshot(
  snapshot: PwaLifecycleSnapshot,
  event: PwaLifecycleEvent,
): PwaLifecycleSnapshot {
  if (event.type === 'connectivity') {
    return {
      ...snapshot,
      connectivity: event.online ? 'online' : 'offline',
      lastEvent: event.online ? 'online' : 'offline',
    };
  }
  if (event.type === 'install-ready') {
    return {
      ...snapshot,
      installState: snapshot.standalone ? 'installed' : 'ready',
      lastEvent: 'install-ready',
    };
  }
  if (event.type === 'install-dismissed') {
    return {
      ...snapshot,
      installState: 'dismissed',
      lastEvent: 'install-dismissed',
    };
  }
  if (event.type === 'installed') {
    return {
      ...snapshot,
      standalone: true,
      installState: 'installed',
      lastEvent: 'installed',
    };
  }
  if (event.type === 'sw-registering') {
    return {
      ...snapshot,
      serviceWorkerState: snapshot.serviceWorkerState === 'unsupported' ? 'unsupported' : 'registering',
      lastEvent: 'sw-registering',
    };
  }
  if (event.type === 'sw-registered') {
    return {
      ...snapshot,
      serviceWorkerState: snapshot.serviceWorkerState === 'unsupported' ? 'unsupported' : 'registered',
      lastEvent: 'sw-registered',
    };
  }
  if (event.type === 'sw-offline-ready') {
    return {
      ...snapshot,
      serviceWorkerState: 'offline-ready',
      offlineReady: true,
      lastEvent: 'sw-offline-ready',
    };
  }
  if (event.type === 'sw-update-ready') {
    return {
      ...snapshot,
      serviceWorkerState: 'update-ready',
      updateAvailable: true,
      lastEvent: 'sw-update-ready',
    };
  }
  return {
    ...snapshot,
    serviceWorkerState: 'error',
    lastEvent: 'sw-error',
  };
}

export function shouldShowPwaStatus(snapshot: PwaLifecycleSnapshot) {
  return snapshot.connectivity === 'offline'
    || snapshot.updateAvailable
    || snapshot.installState === 'ready'
    || snapshot.serviceWorkerState === 'error';
}

export function getPwaLifecycleCopy(
  snapshot: PwaLifecycleSnapshot,
  language = 'en',
): PwaLifecycleCopy {
  const ja = language.toLowerCase().startsWith('ja');

  if (snapshot.updateAvailable) {
    return {
      title: ja ? 'アプリを更新できます' : 'App update available',
      body: ja
        ? '新しいAGIDアプリ基盤を読み込めます。作業中の入力を確認してから更新してください。'
        : 'A newer AGID app shell is ready. Check active work before refreshing.',
      primaryAction: ja ? '更新' : 'Update',
      secondaryAction: ja ? '後で' : 'Later',
      tone: 'info',
    };
  }

  if (snapshot.connectivity === 'offline') {
    return {
      title: ja ? 'オフラインで動作中' : 'Working offline',
      body: ja
        ? '保存済みのアプリ基盤は使えます。地図タイル、検索、外部APIは制限される場合があります。'
        : 'The cached app shell is available. Map tiles, search, and external APIs may be limited.',
      tone: 'warning',
    };
  }

  if (snapshot.installState === 'ready') {
    return {
      title: ja ? 'AGIDをインストールできます' : 'Install AGID',
      body: ja
        ? 'ホーム画面やデスクトップから起動できるPWAとして追加できます。'
        : 'Add AGID as a PWA so it can open from your home screen or desktop.',
      primaryAction: ja ? 'インストール' : 'Install',
      secondaryAction: ja ? '閉じる' : 'Dismiss',
      tone: 'success',
    };
  }

  if (snapshot.serviceWorkerState === 'error') {
    return {
      title: ja ? 'PWAキャッシュを確認してください' : 'PWA cache needs attention',
      body: ja
        ? 'Service Worker登録に失敗しました。通常利用は可能ですが、オフライン起動が弱くなります。'
        : 'Service worker registration failed. The app can run, but offline startup is weaker.',
      tone: 'danger',
    };
  }

  return {
    title: ja ? 'PWA準備完了' : 'PWA ready',
    body: ja ? 'アプリ基盤はオフライン起動に対応しています。' : 'The app shell is ready for offline startup.',
    tone: 'info',
  };
}

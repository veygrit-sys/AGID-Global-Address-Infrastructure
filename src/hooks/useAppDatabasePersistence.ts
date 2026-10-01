import React from 'react';

import type { RegisteredAddressRecord } from '../lib/registeredAddressQr';
import type { SyncQueueRecord } from '../lib/appDatabase';

const loadAppDatabase = () => import('../lib/appDatabase');

type AppDatabasePersistenceOptions = {
  savedAgids: any[];
  setSavedAgids: React.Dispatch<React.SetStateAction<any[]>>;
  savedQrs: any[];
  setSavedQrs: React.Dispatch<React.SetStateAction<any[]>>;
  syncQueue?: SyncQueueRecord[];
  setSyncQueue?: React.Dispatch<React.SetStateAction<SyncQueueRecord[]>>;
  registeredAddresses: RegisteredAddressRecord[];
  setRegisteredAddresses: React.Dispatch<React.SetStateAction<RegisteredAddressRecord[]>>;
  aoids: any[];
  setAoids: React.Dispatch<React.SetStateAction<any[]>>;
};

export function useAppDatabasePersistence({
  savedAgids,
  setSavedAgids,
  savedQrs,
  setSavedQrs,
  syncQueue = [],
  setSyncQueue,
  registeredAddresses,
  setRegisteredAddresses,
  aoids,
  setAoids,
}: AppDatabasePersistenceOptions) {
  const [isAppDatabaseHydrated, setIsAppDatabaseHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    loadAppDatabase().then(async database => {
      const snapshot = await database.loadAppDatabaseSnapshot({
        savedAgids,
        savedQrs,
        syncQueue,
        registeredAddresses,
        aoids,
      });
      if (cancelled) return;

      const cleanupKey = 'agid_removed_initial_mali_records_v1';
      if (localStorage.getItem(cleanupKey) !== 'done') {
        const removedIds = new Set(['ML027YNZ0533', 'ML027YNZ1TDY']);
        snapshot.savedAgids = snapshot.savedAgids.filter(record => !removedIds.has(record.id));
        snapshot.syncQueue = snapshot.syncQueue.filter(record =>
          record.entityType !== 'savedAgid' || !removedIds.has(record.entityId)
        );
        await database.persistSavedAgids(snapshot.savedAgids);
        await database.persistSyncQueue(snapshot.syncQueue);
        localStorage.setItem('saved_agids', JSON.stringify(snapshot.savedAgids));
        localStorage.setItem('agid_sync_queue', JSON.stringify(snapshot.syncQueue));
        localStorage.setItem(cleanupKey, 'done');
      }
      if (cancelled) return;

      setSavedAgids(snapshot.savedAgids);
      setSavedQrs(snapshot.savedQrs);
      setSyncQueue?.(snapshot.syncQueue);
      setRegisteredAddresses(snapshot.registeredAddresses);
      setAoids(snapshot.aoids);
      setIsAppDatabaseHydrated(true);
    }).catch(error => {
      console.warn('[AGID DB] Failed to hydrate app database:', error);
      if (!cancelled) setIsAppDatabaseHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem('saved_agids', JSON.stringify(savedAgids));
    if (isAppDatabaseHydrated) {
      void loadAppDatabase().then(database => database.persistSavedAgids(savedAgids));
    }
  }, [savedAgids, isAppDatabaseHydrated]);

  React.useEffect(() => {
    localStorage.setItem('saved_qrs', JSON.stringify(savedQrs));
    if (isAppDatabaseHydrated) {
      void loadAppDatabase().then(database => database.persistSavedQrs(savedQrs));
    }
  }, [savedQrs, isAppDatabaseHydrated]);

  React.useEffect(() => {
    localStorage.setItem('agid_sync_queue', JSON.stringify(syncQueue));
    if (isAppDatabaseHydrated) {
      void loadAppDatabase().then(database => database.persistSyncQueue(syncQueue));
    }
  }, [syncQueue, isAppDatabaseHydrated]);

  React.useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem('agid_grid_aoids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        void import('../lib/aoid').then(({ normalizeAOIDRecord }) => {
          if (cancelled) return;
          setAoids(Array.isArray(parsed)
            ? parsed.flatMap(record => {
              try {
                return [normalizeAOIDRecord({ ...record, type: 'AOID' })];
              } catch {
                return [];
              }
            })
            : []);
        });
      } catch (error) {
        console.error('Failed to load AOIDs', error);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [setAoids]);

  React.useEffect(() => {
    localStorage.setItem('agid_grid_aoids', JSON.stringify(aoids));
    if (isAppDatabaseHydrated) {
      void loadAppDatabase().then(database => database.persistAoids(aoids));
    }
  }, [aoids, isAppDatabaseHydrated]);

  React.useEffect(() => {
    localStorage.setItem('agid_registered_addresses', JSON.stringify(registeredAddresses));
    if (isAppDatabaseHydrated) {
      void loadAppDatabase().then(database => database.persistRegisteredAddresses(registeredAddresses));
    }
  }, [registeredAddresses, isAppDatabaseHydrated]);

  return isAppDatabaseHydrated;
}

import {
  enqueueMutation,
  getPendingMutations,
  markMutationAttempt,
  removeCachedRecord,
  removePendingMutation,
  upsertCachedRecord,
} from './offlineStore';

let syncInProgress = false;
let onlineListenerRegistered = false;

export const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine;

export const isNetworkError = (error) => isOffline()
  || error instanceof TypeError
  || /network|fetch|timeout|failed to connect/i.test(error?.message || '');

const notify = (name, detail = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
};

export const queueMutation = async ({ table, operation, id, payload, localRecord }) => {
  if (operation === 'delete') {
    await removeCachedRecord(table, id);
  } else {
    await upsertCachedRecord(table, localRecord);
  }

  await enqueueMutation({ table, operation, id, payload });
  notify('commission-shop-sync-pending');
  return operation === 'delete' ? { pendingSync: true } : { ...localRecord, pendingSync: true };
};

export const startOfflineSync = (applyMutation) => {
  if (typeof window === 'undefined') return;

  if (!onlineListenerRegistered) {
    window.addEventListener('online', () => flushOfflineQueue(applyMutation));
    onlineListenerRegistered = true;
  }

  if (!isOffline()) {
    flushOfflineQueue(applyMutation);
  }
};

export const flushOfflineQueue = async (applyMutation) => {
  if (syncInProgress || isOffline()) return { synced: 0, remaining: 0 };

  syncInProgress = true;
  let synced = 0;

  try {
    const mutations = await getPendingMutations();

    for (const mutation of mutations) {
      try {
        const record = await applyMutation(mutation);
        if (mutation.operation === 'delete') {
          await removeCachedRecord(mutation.table, mutation.id);
        } else if (record) {
          await upsertCachedRecord(mutation.table, record);
        }
        await removePendingMutation(mutation.id);
        synced += 1;
      } catch (error) {
        await markMutationAttempt(mutation.id, error);
        notify('commission-shop-sync-error', { error, mutation });
        // Preserve order: later stock changes can depend on this mutation.
        break;
      }
    }

    const remaining = (await getPendingMutations()).length;
    notify('commission-shop-sync-complete', { synced, remaining });
    return { synced, remaining };
  } finally {
    syncInProgress = false;
  }
};

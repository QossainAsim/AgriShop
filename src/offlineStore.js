const DATABASE_NAME = 'commission-shop-offline';
const DATABASE_VERSION = 1;
const SNAPSHOT_STORE = 'snapshot';
const MUTATION_STORE = 'mutations';

let databasePromise;
let snapshotWriteChain = Promise.resolve();

const openDatabase = () => {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) {
        database.createObjectStore(SNAPSHOT_STORE, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(MUTATION_STORE)) {
        database.createObjectStore(MUTATION_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return databasePromise;
};

const requestResult = (request) => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const initialSnapshot = () => ({
  categories: [],
  parts: [],
  sales: [],
  suppliers: [],
  savedAt: null,
});

export const getCachedSnapshot = async () => {
  const database = await openDatabase();
  const transaction = database.transaction(SNAPSHOT_STORE, 'readonly');
  const record = await requestResult(transaction.objectStore(SNAPSHOT_STORE).get('current'));
  return record?.value || initialSnapshot();
};

const updateSnapshot = (updater) => {
  const operation = snapshotWriteChain.then(async () => {
    const database = await openDatabase();
    const readTransaction = database.transaction(SNAPSHOT_STORE, 'readonly');
    const current = await requestResult(readTransaction.objectStore(SNAPSHOT_STORE).get('current'));
    const next = updater(current?.value || initialSnapshot());
    const writeTransaction = database.transaction(SNAPSHOT_STORE, 'readwrite');
    await requestResult(writeTransaction.objectStore(SNAPSHOT_STORE).put({ key: 'current', value: next }));
    return next;
  });

  // A failed local write must not block later writes in the same browser session.
  snapshotWriteChain = operation.catch(() => undefined);
  return operation;
};

export const replaceCachedTable = (table, records) => updateSnapshot((snapshot) => ({
  ...snapshot,
  [table]: records,
  savedAt: new Date().toISOString(),
}));

export const upsertCachedRecord = (table, record) => updateSnapshot((snapshot) => {
  const records = snapshot[table] || [];
  const exists = records.some((item) => item.id === record.id);
  return {
    ...snapshot,
    [table]: exists
      ? records.map((item) => (item.id === record.id ? record : item))
      : [...records, record],
    savedAt: new Date().toISOString(),
  };
});

export const removeCachedRecord = (table, id) => updateSnapshot((snapshot) => ({
  ...snapshot,
  [table]: (snapshot[table] || []).filter((item) => item.id !== id),
  savedAt: new Date().toISOString(),
}));

export const enqueueMutation = async (mutation) => {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, 'readwrite');
  return requestResult(transaction.objectStore(MUTATION_STORE).add({
    ...mutation,
    createdAt: new Date().toISOString(),
    attempts: 0,
  }));
};

export const getPendingMutations = async () => {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, 'readonly');
  const mutations = await requestResult(transaction.objectStore(MUTATION_STORE).getAll());
  return mutations.sort((first, second) => first.id - second.id);
};

export const removePendingMutation = async (id) => {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, 'readwrite');
  await requestResult(transaction.objectStore(MUTATION_STORE).delete(id));
};

export const markMutationAttempt = async (id, error) => {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, 'readwrite');
  const store = transaction.objectStore(MUTATION_STORE);
  const mutation = await requestResult(store.get(id));
  if (mutation) {
    mutation.attempts = (mutation.attempts || 0) + 1;
    mutation.lastError = error?.message || 'Unknown sync error';
    await requestResult(store.put(mutation));
  }
};

export type CreativeAsset = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  addedAt: number;
};

const DB_NAME = 'plf-creative-library-v1';
const STORE_NAME = 'assets';

function openCreativeAssetDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('This browser does not support a local file library.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open the creative file library.'));
  });
}

export async function listCreativeAssets(): Promise<CreativeAsset[]> {
  const db = await openCreativeAssetDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = () => { db.close(); resolve((request.result as CreativeAsset[]).sort((a, b) => b.addedAt - a.addedAt)); };
    request.onerror = () => { db.close(); reject(request.error || new Error('Could not read the creative file library.')); };
  });
}

export async function saveCreativeAsset(asset: CreativeAsset): Promise<void> {
  const db = await openCreativeAssetDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(asset);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('Could not save this file.')) };
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('Saving this file was cancelled.')) };
  });
}

export async function deleteCreativeAsset(id: string): Promise<void> {
  const db = await openCreativeAssetDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('Could not remove this file.')) };
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('Removing this file was cancelled.')) };
  });
}

export function readCreativeFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read this file.'));
    reader.onerror = () => reject(reader.error || new Error('Could not read this file.'));
    reader.readAsDataURL(file);
  });
}

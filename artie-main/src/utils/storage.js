// IndexedDB storage for transcriptions and responses

const DB_NAME = 'artie-db';
const DB_VERSION = 1;
const STORE_NAME = 'segments';

let db = null;

export async function initStorage() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open IndexedDB:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB initialized');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
    });
}

export async function saveSegment(transcription, response) {
    if (!db) {
        await initStorage();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const segment = {
            transcription,
            response,
            createdAt: new Date().toISOString()
        };

        const request = store.add(segment);

        request.onsuccess = () => {
            console.log('Segment saved:', { id: request.result, ...segment });
            resolve({ id: request.result, ...segment });
        };

        request.onerror = () => {
            console.error('Failed to save segment:', request.error);
            reject(request.error);
        };
    });
}

export async function getAllSegments() {
    if (!db) {
        await initStorage();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

export async function getSegment(id) {
    if (!db) {
        await initStorage();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

export async function clearAllSegments() {
    if (!db) {
        await initStorage();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            console.log('All segments cleared');
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// IndexedDB Helper Module for Local-First Architecture
// This module provides a simple interface to IndexedDB for storing clients, measurements, and sync queue

const DB_NAME = 'tailors_vault_db';
const DB_VERSION = 1;

// Store names
const STORE_CLIENTS = 'clients';
const STORE_MEASUREMENTS = 'measurements';
const STORE_SYNC_QUEUE = 'sync_queue';

let dbInstance = null;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[IndexedDB] Failed to open database:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            console.log('[IndexedDB] Database opened successfully');
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create clients store
            if (!db.objectStoreNames.contains(STORE_CLIENTS)) {
                const clientsStore = db.createObjectStore(STORE_CLIENTS, { keyPath: 'local_id' });
                clientsStore.createIndex('server_id', 'server_id', { unique: false });
                clientsStore.createIndex('synced', 'synced', { unique: false });
                clientsStore.createIndex('user_id', 'user_id', { unique: false });
            }

            // Create measurements store
            if (!db.objectStoreNames.contains(STORE_MEASUREMENTS)) {
                const measurementsStore = db.createObjectStore(STORE_MEASUREMENTS, { keyPath: 'local_id' });
                measurementsStore.createIndex('server_id', 'server_id', { unique: false });
                measurementsStore.createIndex('synced', 'synced', { unique: false });
                measurementsStore.createIndex('user_id', 'user_id', { unique: false });
                measurementsStore.createIndex('client_id', 'client_id', { unique: false });
            }

            // Create sync_queue store
            if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
                const syncQueueStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
                syncQueueStore.createIndex('type', 'type', { unique: false });
                syncQueueStore.createIndex('synced', 'synced', { unique: false });
            }
        };
    });
}

// Get database instance
async function getDB() {
    if (!dbInstance) {
        await initDB();
    }
    return dbInstance;
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ========== CLIENTS OPERATIONS ==========

// Save client to IndexedDB
async function saveClientLocal(clientData, userId, businessId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_CLIENTS], 'readwrite');
    const store = transaction.objectStore(STORE_CLIENTS);

    const localId = clientData.local_id || generateUUID();
    const client = {
        local_id: localId,
        server_id: clientData.server_id || null,
        user_id: userId,
        business_id: businessId,
        name: clientData.name,
        phone: clientData.phone || null,
        sex: clientData.sex || null,
        synced: clientData.synced !== undefined ? clientData.synced : false,
        created_at: clientData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
        const request = store.put(client);
        request.onsuccess = () => {
            resolve({ ...client, id: client.server_id || client.local_id });
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get all clients from IndexedDB
async function getClientsLocal(userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_CLIENTS], 'readonly');
    const store = transaction.objectStore(STORE_CLIENTS);
    const index = store.index('user_id');

    return new Promise((resolve, reject) => {
        const request = index.getAll(userId);
        request.onsuccess = () => {
            const clients = request.result.map(c => ({
                id: c.server_id || c.local_id,
                local_id: c.local_id,
                name: c.name,
                phone: c.phone || '',
                sex: c.sex || '',
                createdAt: c.created_at,
                synced: c.synced
            }));
            resolve(clients);
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get client by local_id or server_id
async function getClientLocal(identifier, userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_CLIENTS], 'readonly');
    const store = transaction.objectStore(STORE_CLIENTS);

    return new Promise((resolve, reject) => {
        // Try by local_id first
        const request = store.get(identifier);
        request.onsuccess = () => {
            if (request.result && request.result.user_id === userId) {
                const client = request.result;
                resolve({
                    id: client.server_id || client.local_id,
                    local_id: client.local_id,
                    name: client.name,
                    phone: client.phone || '',
                    sex: client.sex || '',
                    createdAt: client.created_at,
                    synced: client.synced
                });
            } else {
                // Try by server_id
                const index = store.index('server_id');
                const indexRequest = index.getAll(identifier);
                indexRequest.onsuccess = () => {
                    const client = indexRequest.result.find(c => c.user_id === userId);
                    if (client) {
                        resolve({
                            id: client.server_id || client.local_id,
                            local_id: client.local_id,
                            name: client.name,
                            phone: client.phone || '',
                            sex: client.sex || '',
                            createdAt: client.created_at,
                            synced: client.synced
                        });
                    } else {
                        resolve(null);
                    }
                };
                indexRequest.onerror = () => reject(indexRequest.error);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// Update client in IndexedDB
async function updateClientLocal(localId, updates, userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_CLIENTS], 'readwrite');
    const store = transaction.objectStore(STORE_CLIENTS);

    return new Promise((resolve, reject) => {
        const getRequest = store.get(localId);
        getRequest.onsuccess = () => {
            const client = getRequest.result;
            if (!client || client.user_id !== userId) {
                reject(new Error('Client not found or access denied'));
                return;
            }

            const updated = {
                ...client,
                ...updates,
                updated_at: new Date().toISOString(),
                synced: false // Mark as unsynced when updated
            };

            const putRequest = store.put(updated);
            putRequest.onsuccess = () => {
                resolve({
                    id: updated.server_id || updated.local_id,
                    local_id: updated.local_id,
                    name: updated.name,
                    phone: updated.phone || '',
                    sex: updated.sex || '',
                    createdAt: updated.created_at,
                    synced: updated.synced
                });
            };
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Delete client from IndexedDB
async function deleteClientLocal(localId, userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_CLIENTS], 'readwrite');
    const store = transaction.objectStore(STORE_CLIENTS);

    return new Promise((resolve, reject) => {
        const getRequest = store.get(localId);
        getRequest.onsuccess = () => {
            const client = getRequest.result;
            if (!client || client.user_id !== userId) {
                reject(new Error('Client not found or access denied'));
                return;
            }

            const deleteRequest = store.delete(localId);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Get unsynced clients
async function getUnsyncedClients(userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_CLIENTS], 'readonly');
    const store = transaction.objectStore(STORE_CLIENTS);
    const index = store.index('user_id');

    return new Promise((resolve, reject) => {
        // Get all clients for this user, then filter by synced === false
        const request = index.getAll(userId);
        request.onsuccess = () => {
            const clients = request.result.filter(c => c.synced === false);
            resolve(clients);
        };
        request.onerror = () => reject(request.error);
    });
}

// Mark client as synced
async function markClientSynced(localId, serverId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_CLIENTS], 'readwrite');
    const store = transaction.objectStore(STORE_CLIENTS);

    return new Promise((resolve, reject) => {
        const getRequest = store.get(localId);
        getRequest.onsuccess = () => {
            const client = getRequest.result;
            if (!client) {
                reject(new Error('Client not found'));
                return;
            }

            const updated = {
                ...client,
                server_id: serverId,
                synced: true,
                updated_at: new Date().toISOString()
            };

            const putRequest = store.put(updated);
            putRequest.onsuccess = () => resolve(updated);
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// ========== MEASUREMENTS OPERATIONS ==========

// Save measurement to IndexedDB
async function saveMeasurementLocal(measurementData, userId, businessId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_MEASUREMENTS], 'readwrite');
    const store = transaction.objectStore(STORE_MEASUREMENTS);

    const localId = measurementData.local_id || generateUUID();
    const measurement = {
        local_id: localId,
        server_id: measurementData.server_id || null,
        user_id: userId,
        business_id: businessId,
        client_id: measurementData.client_id, // Can be local_id or server_id
        garment_type: measurementData.garment_type || null,
        shoulder: measurementData.shoulder || null,
        chest: measurementData.chest || null,
        waist: measurementData.waist || null,
        sleeve: measurementData.sleeve || null,
        length: measurementData.length || null,
        neck: measurementData.neck || null,
        hip: measurementData.hip || null,
        inseam: measurementData.inseam || null,
        thigh: measurementData.thigh || null,
        seat: measurementData.seat || null,
        notes: measurementData.notes || null,
        custom_fields: measurementData.custom_fields || {},
        synced: measurementData.synced !== undefined ? measurementData.synced : false,
        created_at: measurementData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
        const request = store.put(measurement);
        request.onsuccess = () => {
            resolve({ ...measurement, id: measurement.server_id || measurement.local_id });
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get all measurements from IndexedDB
async function getMeasurementsLocal(userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_MEASUREMENTS], 'readonly');
    const store = transaction.objectStore(STORE_MEASUREMENTS);
    const index = store.index('user_id');

    return new Promise((resolve, reject) => {
        const request = index.getAll(userId);
        request.onsuccess = () => {
            const measurements = request.result.map(m => ({
                id: m.server_id || m.local_id,
                local_id: m.local_id,
                client_id: m.client_id,
                garment_type: m.garment_type || null,
                date_created: m.created_at,
                shoulder: m.shoulder || null,
                chest: m.chest || null,
                waist: m.waist || null,
                sleeve: m.sleeve || null,
                length: m.length || null,
                neck: m.neck || null,
                hip: m.hip || null,
                inseam: m.inseam || null,
                thigh: m.thigh || null,
                seat: m.seat || null,
                notes: m.notes || null,
                customFields: m.custom_fields || {},
                synced: m.synced
            }));
            // Sort by date_created descending
            measurements.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
            resolve(measurements);
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get measurement by local_id or server_id
async function getMeasurementLocal(identifier, userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_MEASUREMENTS], 'readonly');
    const store = transaction.objectStore(STORE_MEASUREMENTS);

    return new Promise((resolve, reject) => {
        const request = store.get(identifier);
        request.onsuccess = () => {
            if (request.result && request.result.user_id === userId) {
                const m = request.result;
                resolve({
                    id: m.server_id || m.local_id,
                    local_id: m.local_id,
                    client_id: m.client_id,
                    garment_type: m.garment_type || null,
                    date_created: m.created_at,
                    shoulder: m.shoulder || null,
                    chest: m.chest || null,
                    waist: m.waist || null,
                    sleeve: m.sleeve || null,
                    length: m.length || null,
                    neck: m.neck || null,
                    hip: m.hip || null,
                    inseam: m.inseam || null,
                    thigh: m.thigh || null,
                    seat: m.seat || null,
                    notes: m.notes || null,
                    customFields: m.custom_fields || {},
                    synced: m.synced
                });
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// Update measurement in IndexedDB
async function updateMeasurementLocal(localId, updates, userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_MEASUREMENTS], 'readwrite');
    const store = transaction.objectStore(STORE_MEASUREMENTS);

    return new Promise((resolve, reject) => {
        const getRequest = store.get(localId);
        getRequest.onsuccess = () => {
            const measurement = getRequest.result;
            if (!measurement || measurement.user_id !== userId) {
                reject(new Error('Measurement not found or access denied'));
                return;
            }

            const updated = {
                ...measurement,
                ...updates,
                updated_at: new Date().toISOString(),
                synced: false // Mark as unsynced when updated
            };

            const putRequest = store.put(updated);
            putRequest.onsuccess = () => {
                const m = updated;
                resolve({
                    id: m.server_id || m.local_id,
                    local_id: m.local_id,
                    client_id: m.client_id,
                    garment_type: m.garment_type || null,
                    date_created: m.created_at,
                    shoulder: m.shoulder || null,
                    chest: m.chest || null,
                    waist: m.waist || null,
                    sleeve: m.sleeve || null,
                    length: m.length || null,
                    neck: m.neck || null,
                    hip: m.hip || null,
                    inseam: m.inseam || null,
                    thigh: m.thigh || null,
                    seat: m.seat || null,
                    notes: m.notes || null,
                    customFields: m.custom_fields || {},
                    synced: m.synced
                });
            };
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Delete measurement from IndexedDB
async function deleteMeasurementLocal(localId, userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_MEASUREMENTS], 'readwrite');
    const store = transaction.objectStore(STORE_MEASUREMENTS);

    return new Promise((resolve, reject) => {
        const getRequest = store.get(localId);
        getRequest.onsuccess = () => {
            const measurement = getRequest.result;
            if (!measurement || measurement.user_id !== userId) {
                reject(new Error('Measurement not found or access denied'));
                return;
            }

            const deleteRequest = store.delete(localId);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Get unsynced measurements
async function getUnsyncedMeasurements(userId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_MEASUREMENTS], 'readonly');
    const store = transaction.objectStore(STORE_MEASUREMENTS);
    const index = store.index('user_id');

    return new Promise((resolve, reject) => {
        // Get all measurements for this user, then filter by synced === false
        const request = index.getAll(userId);
        request.onsuccess = () => {
            const measurements = request.result.filter(m => m.synced === false);
            resolve(measurements);
        };
        request.onerror = () => reject(request.error);
    });
}

// Mark measurement as synced
async function markMeasurementSynced(localId, serverId) {
    const db = await getDB();
    const transaction = db.transaction([STORE_MEASUREMENTS], 'readwrite');
    const store = transaction.objectStore(STORE_MEASUREMENTS);

    return new Promise((resolve, reject) => {
        const getRequest = store.get(localId);
        getRequest.onsuccess = () => {
            const measurement = getRequest.result;
            if (!measurement) {
                reject(new Error('Measurement not found'));
                return;
            }

            const updated = {
                ...measurement,
                server_id: serverId,
                synced: true,
                updated_at: new Date().toISOString()
            };

            const putRequest = store.put(updated);
            putRequest.onsuccess = () => resolve(updated);
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Export functions
if (typeof window !== 'undefined') {
    window.indexedDBHelper = {
        initDB,
        getDB,
        // Clients
        saveClientLocal,
        getClientsLocal,
        getClientLocal,
        updateClientLocal,
        deleteClientLocal,
        getUnsyncedClients,
        markClientSynced,
        // Measurements
        saveMeasurementLocal,
        getMeasurementsLocal,
        getMeasurementLocal,
        updateMeasurementLocal,
        deleteMeasurementLocal,
        getUnsyncedMeasurements,
        markMeasurementSynced
    };
}


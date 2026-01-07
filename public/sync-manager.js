// Silent Background Sync Manager
// Handles syncing local IndexedDB data to Supabase without any UI indicators

const SYNC_INTERVAL = 3 * 60 * 1000; // 3 minutes
let syncIntervalId = null;
let isSyncing = false;

// Check if online
function isOnline() {
    return navigator.onLine;
}

// Get Supabase client
function getSupabase() {
    if (typeof window !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    return null;
}

// Get current user
async function getCurrentUser() {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Get business for user
async function getBusinessForUser(userId) {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single();
    
    if (error || !data) return null;
    return data;
}

// Resolve client ID for sync (convert local_id to server_id if needed)
async function resolveClientIdForSync(clientId, userId) {
    if (!window.indexedDBHelper) return clientId;
    
    try {
        // If it's a UUID format, it might be a local_id
        const client = await window.indexedDBHelper.getClientLocal(clientId, userId);
        if (client && client.local_id === clientId && client.server_id && client.id !== clientId) {
            // This is a local_id, return the server_id
            return client.server_id || client.id;
        }
        // Otherwise, it's already a server_id or doesn't exist
        return clientId;
    } catch (err) {
        console.warn('[Sync] Error resolving client ID:', err);
        return clientId; // Return original ID on error
    }
}

// Sync a single client to Supabase
async function syncClient(client, userId, businessId) {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
        if (client.server_id) {
            // Update existing client
            const { data, error } = await supabase
                .from('clients')
                .update({
                    name: client.name,
                    phone: client.phone || null,
                    sex: client.sex || null
                })
                .eq('id', client.server_id)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return true;
        } else {
            // Create new client
            const { data, error } = await supabase
                .from('clients')
                .insert([{
                    user_id: userId,
                    business_id: businessId,
                    name: client.name,
                    phone: client.phone || null,
                    sex: client.sex || null
                }])
                .select()
                .single();

            if (error) throw error;

            // Mark as synced in IndexedDB
            await window.indexedDBHelper.markClientSynced(client.local_id, data.id);
            return true;
        }
    } catch (error) {
        console.warn('[Sync] Failed to sync client:', client.local_id, error);
        return false;
    }
}

// Sync a single measurement to Supabase
async function syncMeasurement(measurement, userId, businessId) {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
        // Resolve client_id (convert local_id to server_id if needed)
        const resolvedClientId = await resolveClientIdForSync(measurement.client_id, userId);
        if (!resolvedClientId) {
            console.warn('[Sync] Cannot sync measurement: client not found');
            return false;
        }

        if (measurement.server_id) {
            // Update existing measurement
            const { data, error } = await supabase
                .from('measurements')
                .update({
                    garment_type: measurement.garment_type || null,
                    shoulder: measurement.shoulder ? parseFloat(measurement.shoulder) : null,
                    chest: measurement.chest ? parseFloat(measurement.chest) : null,
                    waist: measurement.waist ? parseFloat(measurement.waist) : null,
                    sleeve: measurement.sleeve ? parseFloat(measurement.sleeve) : null,
                    length: measurement.length ? parseFloat(measurement.length) : null,
                    neck: measurement.neck ? parseFloat(measurement.neck) : null,
                    hip: measurement.hip ? parseFloat(measurement.hip) : null,
                    inseam: measurement.inseam ? parseFloat(measurement.inseam) : null,
                    thigh: measurement.thigh ? parseFloat(measurement.thigh) : null,
                    seat: measurement.seat ? parseFloat(measurement.seat) : null,
                    notes: measurement.notes || null,
                    custom_fields: measurement.custom_fields || {}
                })
                .eq('id', measurement.server_id)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return true;
        } else {
            // Create new measurement
            const { data, error } = await supabase
                .from('measurements')
                .insert([{
                    user_id: userId,
                    business_id: businessId,
                    client_id: resolvedClientId,
                    garment_type: measurement.garment_type || null,
                    shoulder: measurement.shoulder ? parseFloat(measurement.shoulder) : null,
                    chest: measurement.chest ? parseFloat(measurement.chest) : null,
                    waist: measurement.waist ? parseFloat(measurement.waist) : null,
                    sleeve: measurement.sleeve ? parseFloat(measurement.sleeve) : null,
                    length: measurement.length ? parseFloat(measurement.length) : null,
                    neck: measurement.neck ? parseFloat(measurement.neck) : null,
                    hip: measurement.hip ? parseFloat(measurement.hip) : null,
                    inseam: measurement.inseam ? parseFloat(measurement.inseam) : null,
                    thigh: measurement.thigh ? parseFloat(measurement.thigh) : null,
                    seat: measurement.seat ? parseFloat(measurement.seat) : null,
                    notes: measurement.notes || null,
                    custom_fields: measurement.custom_fields || {}
                }])
                .select()
                .single();

            if (error) throw error;

            // Mark as synced in IndexedDB
            await window.indexedDBHelper.markMeasurementSynced(measurement.local_id, data.id);
            return true;
        }
    } catch (error) {
        console.warn('[Sync] Failed to sync measurement:', measurement.local_id, error);
        return false;
    }
}

// Sync all unsynced clients
async function syncClients(userId, businessId) {
    if (!isOnline()) return;

    const unsyncedClients = await window.indexedDBHelper.getUnsyncedClients(userId);
    if (unsyncedClients.length === 0) return;

    // Sync clients in batches of 5
    const batchSize = 5;
    for (let i = 0; i < unsyncedClients.length; i += batchSize) {
        const batch = unsyncedClients.slice(i, i + batchSize);
        await Promise.all(batch.map(client => syncClient(client, userId, businessId)));
    }
}

// Sync all unsynced measurements
async function syncMeasurements(userId, businessId) {
    if (!isOnline()) return;

    const unsyncedMeasurements = await window.indexedDBHelper.getUnsyncedMeasurements(userId);
    if (unsyncedMeasurements.length === 0) return;

    // Sync measurements in batches of 5
    const batchSize = 5;
    for (let i = 0; i < unsyncedMeasurements.length; i += batchSize) {
        const batch = unsyncedMeasurements.slice(i, i + batchSize);
        await Promise.all(batch.map(measurement => syncMeasurement(measurement, userId, businessId)));
    }
}

// Main sync function - runs silently in background
async function performSync() {
    if (isSyncing) return; // Prevent concurrent syncs
    if (!isOnline()) return;

    // CRITICAL: Ensure IndexedDB is initialized before syncing
    if (!window.indexedDBHelper) {
        console.warn('[Sync] IndexedDB helper not available, skipping sync');
        return;
    }
    
    try {
        // Verify IndexedDB is accessible
        await window.indexedDBHelper.getDB();
    } catch (dbErr) {
        console.warn('[Sync] IndexedDB not ready, skipping sync:', dbErr);
        return;
    }

    const user = await getCurrentUser();
    if (!user) return;

    const business = await getBusinessForUser(user.id);
    if (!business) return;

    isSyncing = true;

    try {
        // Sync clients first (measurements depend on clients)
        await syncClients(user.id, business.id);
        
        // Then sync measurements
        await syncMeasurements(user.id, business.id);
        
        // After sync, trigger re-render of measurements to update client names
        if (typeof renderRecentMeasurements === 'function') {
            // Small delay to ensure IndexedDB updates are reflected
            setTimeout(() => {
                renderRecentMeasurements().catch(err => {
                    console.warn('[Sync] Error re-rendering measurements:', err);
                });
            }, 500);
        }
    } catch (error) {
        console.warn('[Sync] Sync error:', error);
    } finally {
        isSyncing = false;
    }
}

// Start background sync
function startBackgroundSync() {
    // Perform initial sync
    performSync();

    // Set up interval sync
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    syncIntervalId = setInterval(performSync, SYNC_INTERVAL);

    // Sync when coming online
    window.addEventListener('online', () => {
        performSync();
    });
}

// Stop background sync
function stopBackgroundSync() {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
    }
}

// Export functions
if (typeof window !== 'undefined') {
    window.syncManager = {
        startBackgroundSync,
        stopBackgroundSync,
        performSync
    };
}


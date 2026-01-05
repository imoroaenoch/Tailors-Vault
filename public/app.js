// Data Storage Key (single key for all data)
const VAULT_DATA_KEY = 'measurement_vault_data';

// Legacy Keys (for migration)
const LEGACY_CLIENTS_KEY = 'measurement_vault_clients';
const LEGACY_MEASUREMENTS_KEY = 'measurement_vault_measurements';

// Logout state key
const LOGOUT_STATE_KEY = 'measurement_vault_logged_out';

// Current business session ID key
const CURRENT_BUSINESS_ID_KEY = 'measurement_vault_current_business_id';

// Garment Types by Sex (including Custom option)
const GARMENT_TYPES = {
    Male: [
        'Shirt',
        'Trousers / Pants',
        'Kaftan',
        'Senator',
        'Suit',
        'Shorts',
        'Blazer',
        'Custom'
    ],
    Female: [
        'Dress / Gown',
        'Skirt',
        'Blouse / Top',
        'Trousers / Pants',
        'Kaftan / Traditional',
        'Suit',
        'Shorts',
        'Custom'
    ]
};

// Smart Fields by Garment Type
const GARMENT_FIELDS = {
    // Shirt / Blouse / Top / Kaftan / Suit Jackets / Blazer
    'Shirt': ['shoulder', 'chest', 'sleeve', 'length', 'neck'],
    'Blouse / Top': ['shoulder', 'chest', 'sleeve', 'length', 'neck'],
    'Kaftan': ['shoulder', 'chest', 'sleeve', 'length', 'neck'],
    'Kaftan / Traditional': ['shoulder', 'chest', 'sleeve', 'length', 'neck'],
    'Senator': ['shoulder', 'chest', 'sleeve', 'length', 'neck'],
    'Suit': ['shoulder', 'chest', 'sleeve', 'length', 'neck'],
    'Blazer': ['shoulder', 'chest', 'sleeve', 'length', 'neck'],
    
    // Trousers / Pants / Shorts
    'Trousers / Pants': ['waist', 'hip', 'inseam', 'length', 'thigh', 'seat'],
    'Shorts': ['waist', 'hip', 'inseam', 'length', 'thigh', 'seat'],
    
    // Skirt
    'Skirt': ['waist', 'hip', 'length'],
    
    // Dress / Gown
    'Dress / Gown': ['shoulder', 'chest', 'waist', 'hip', 'sleeve', 'length', 'neck']
};

// Get Supabase client (initialized in page.tsx)
function getSupabase() {
    if (typeof window !== 'undefined') {
        // Wait a bit if client isn't ready yet (for async initialization)
        if (window.supabaseClient) {
            return window.supabaseClient;
        }
        // Try to initialize it if it's not ready
        if (!window.supabaseInitAttempted && typeof window.initSupabase === 'function') {
            window.supabaseInitAttempted = true;
            window.initSupabase();
        }
        console.error('Supabase client not initialized yet. Make sure Supabase is initialized in page.tsx');
    }
    return null;
}

// Check if business exists
async function hasBusiness() {
    const supabase = getSupabase();
    if (!supabase) return false;
    
    const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .limit(1)
        .single();
    
    return !error && data && data.id;
}

// Get business
async function getBusiness() {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    // First, check if we have a stored business ID in session
    const storedBusinessId = localStorage.getItem(CURRENT_BUSINESS_ID_KEY);
    
    if (storedBusinessId) {
        // Fetch the specific business by ID
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', storedBusinessId)
            .single();
        
        if (!error && data) {
            // Convert to match old format
            return {
                id: data.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                createdAt: data.created_at
            };
        }
        // If stored ID is invalid, clear it and fall through to default behavior
        localStorage.removeItem(CURRENT_BUSINESS_ID_KEY);
    }
    
    // Fallback: get first business (for backward compatibility)
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .limit(1)
        .single();
    
    if (error || !data) return null;
    
    // Store the ID for future use
    localStorage.setItem(CURRENT_BUSINESS_ID_KEY, data.id);
    
    // Convert to match old format
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        createdAt: data.created_at
    };
}

// Generate a UUID v4
function generateUUID() {
    // Use browser's native crypto.randomUUID() if available (more reliable)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback to manual generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Create business and initialize data structure
async function createBusiness(name, email, phone) {
    const supabase = getSupabase();
    if (!supabase) {
        console.error('Supabase client not available');
        return null;
    }
    
    try {
        // Let Supabase generate the ID automatically (no manual ID assignment)
        const { data, error } = await supabase
            .from('businesses')
            .insert([{ name: name.trim(), email: email.trim(), phone: phone.trim() }])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating business:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return null;
        }
        
        if (!data) {
            console.error('No data returned from insert');
            return null;
        }
        
        // Store the business ID in localStorage for session tracking
        localStorage.setItem(CURRENT_BUSINESS_ID_KEY, data.id);
        
        // Convert to match old format
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            createdAt: data.created_at
        };
    } catch (err) {
        console.error('Exception in createBusiness:', err);
        return null;
    }
}

// Update business details
async function updateBusiness(name, email, phone) {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    // Get current business ID
    const currentBusiness = await getBusiness();
    if (!currentBusiness) return null;
    
    const { data, error } = await supabase
        .from('businesses')
        .update({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim()
        })
        .eq('id', currentBusiness.id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating business:', error);
        return null;
    }
    
    // Convert to match old format
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        createdAt: data.created_at
    };
}

// Check if business credentials match (for login)
async function matchBusiness(name, email, phone) {
    const business = await getBusiness();
    if (!business) return false;
    
    return (
        business.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        business.email.toLowerCase().trim() === email.toLowerCase().trim() &&
        business.phone.trim() === phone.trim()
    );
}

// Find business by credentials (for login)
async function findBusinessByCredentials(name, email, phone) {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    try {
        // Search for business matching all three credentials
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('name', name.trim())
            .eq('email', email.trim().toLowerCase())
            .eq('phone', phone.trim())
            .limit(1);
        
        // Check if we got results and no error
        if (error || !data || data.length === 0) {
            return null;
        }
        
        const business = data[0];
        
        // Store the business ID for session tracking
        localStorage.setItem(CURRENT_BUSINESS_ID_KEY, business.id);
        
        // Convert to match old format
        return {
            id: business.id,
            name: business.name,
            email: business.email,
            phone: business.phone,
            createdAt: business.created_at
        };
    } catch (err) {
        console.error('Exception in findBusinessByCredentials:', err);
        return null;
    }
}

// Logout - Set logged out state without deleting data
function logoutBusiness() {
    // Clear all localStorage items related to business data
    localStorage.removeItem(VAULT_DATA_KEY);
    localStorage.removeItem(LEGACY_CLIENTS_KEY);
    localStorage.removeItem(LEGACY_MEASUREMENTS_KEY);
    
    // Clear current business session ID
    localStorage.removeItem(CURRENT_BUSINESS_ID_KEY);
    
    // Set logged out state in localStorage (persists across refreshes)
    // This ensures that after logout, refreshing or reopening the app always shows Business Registration
    localStorage.setItem(LOGOUT_STATE_KEY, 'true');
    
    // Clear all sessionStorage items (clients, measurements, etc.)
    try {
        sessionStorage.clear();
    } catch (e) {
        console.warn('Error clearing sessionStorage:', e);
    }
    
    // Reset all in-memory variables
    currentClientId = null;
    currentMeasurementId = null;
    currentMeasurementDetailId = null;
    previousScreen = 'home-screen';
    recentMeasurementsOffset = 0;
    recentMeasurementsExpanded = false;
    
    // Reset all forms
    const businessLoginForm = document.getElementById('business-login-form');
    if (businessLoginForm) {
        businessLoginForm.reset();
    }
    
    const businessSetupForm = document.getElementById('business-setup-form');
    if (businessSetupForm) {
        businessSetupForm.reset();
    }
    
    const measurementForm = document.getElementById('measurement-form');
    if (measurementForm) {
        measurementForm.reset();
        // Also reset the form state
        resetMeasurementForm();
    }
    
    const editBusinessForm = document.getElementById('edit-business-form');
    if (editBusinessForm) {
        editBusinessForm.reset();
    }
    
    const editClientForm = document.getElementById('edit-client-form');
    if (editClientForm) {
        editClientForm.reset();
    }
}

function loginBusiness() {
    // Clear logout state from localStorage
    localStorage.removeItem(LOGOUT_STATE_KEY);
    // Note: Business ID is already set when business is found/created
}

function isUserLoggedOut() {
    // Check localStorage for logout state (persists across refreshes)
    return localStorage.getItem(LOGOUT_STATE_KEY) === 'true';
}

// Reset - Clear all data permanently
function resetBusiness() {
    localStorage.removeItem(VAULT_DATA_KEY);
    localStorage.removeItem(LEGACY_CLIENTS_KEY);
    localStorage.removeItem(LEGACY_MEASUREMENTS_KEY);
    // Clear current business session ID
    localStorage.removeItem(CURRENT_BUSINESS_ID_KEY);
    // Clear logout state as well (user will need to register again)
    localStorage.removeItem(LOGOUT_STATE_KEY);
    
    // Clear sessionStorage
    try {
        sessionStorage.clear();
    } catch (e) {
        console.warn('Error clearing sessionStorage:', e);
    }
}

// Initialize data structures if they don't exist
async function initStorage() {
    // Step 1: Check if user is logged out (check localStorage for measurement_vault_logged_out)
    // If logged out, always show Business Registration screen (regardless of existing business)
    if (isUserLoggedOut()) {
        showScreen('business-setup-screen');
        return false;
    }
    
    // Step 2: User is not logged out - check if business exists in Supabase
    const hasBiz = await hasBusiness();
    if (!hasBiz) {
        // No business exists - show business registration screen
        showScreen('business-setup-screen');
        return false;
    }
    
    // Step 3: Valid session exists - user is logged in and business exists
    // Continue to dashboard (normal flow)
    return true;
}

// Get all clients
async function getClients() {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    const business = await getBusiness();
    if (!business) return [];
    
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
    
    // Convert to match old format - ensure always returns array
    const normalizedData = Array.isArray(data) ? data : [];
    return normalizedData.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        sex: c.sex || '',
        createdAt: c.created_at
    }));
}

// Get all measurements
async function getMeasurements() {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    const business = await getBusiness();
    if (!business) return [];
    
    const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching measurements:', error);
        return [];
    }
    
    // Convert to legacy format for compatibility - ensure always returns array
    const normalizedData = Array.isArray(data) ? data : [];
    return normalizedData.map(m => ({
        id: m.id,
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
        customFields: m.custom_fields || {}
    }));
}

// Save clients (legacy function - kept for compatibility but will use individual operations)
async function saveClients(clients) {
    // This function is kept for compatibility but shouldn't be used
    // Use individual insert/update/delete operations instead
    console.warn('saveClients is deprecated - use individual operations');
}

// Update client
async function updateClient(clientId, name, phone, sex) {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    const { data, error } = await supabase
        .from('clients')
        .update({
            name: name.trim(),
            phone: phone ? phone.trim() : null,
            sex: sex || null
        })
        .eq('id', clientId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating client:', error);
        return null;
    }
    
    // Convert to match old format
    return {
        id: data.id,
        name: data.name,
        phone: data.phone || '',
        sex: data.sex || '',
        createdAt: data.created_at
    };
}

// Delete client and all associated measurements
async function deleteClient(clientId) {
    const supabase = getSupabase();
    if (!supabase) return;
    
    // Delete measurements first (cascade should handle this, but being explicit)
    await supabase
        .from('measurements')
        .delete()
        .eq('client_id', clientId);
    
    // Delete client
    await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
}

// Save measurements (legacy function - kept for compatibility but will use individual operations)
async function saveMeasurements(legacyMeasurements) {
    // This function is kept for compatibility but shouldn't be used
    // Use individual insert/update/delete operations instead
    console.warn('saveMeasurements is deprecated - use individual operations');
}

// Find or create client
async function findOrCreateClient(name, phone, sex) {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    const business = await getBusiness();
    if (!business) return null;
    
    const phoneNormalized = phone ? phone.trim() : '';
    const nameNormalized = name.toLowerCase().trim();
    
    // Try to find existing client by name and phone
    let query = supabase
        .from('clients')
        .select('*')
        .eq('business_id', business.id)
        .eq('name', name.trim());
    
    if (phoneNormalized) {
        query = query.eq('phone', phoneNormalized);
    } else {
        query = query.is('phone', null);
    }
    
    const { data: existingClients, error: searchError } = await query.limit(1);
    
    if (!searchError && existingClients && existingClients.length > 0) {
        let client = existingClients[0];
        
        // Update phone if provided and different
        if (phoneNormalized && client.phone !== phoneNormalized) {
            const updatedClient = await updateClient(client.id, name, phoneNormalized, client.sex || sex);
            if (updatedClient) {
                client = updatedClient;
            }
        }
        
        // Update sex if provided and different
        if (sex && client.sex !== sex) {
            const updatedClient = await updateClient(client.id, name, client.phone || phoneNormalized, sex);
            if (updatedClient) {
                client = updatedClient;
            }
        }
        
        // Convert to match old format
        return {
            id: client.id,
            name: client.name,
            phone: client.phone || '',
            sex: client.sex || '',
            createdAt: client.created_at
        };
    }
    
    // Create new client - let Supabase generate the ID automatically
    const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert([{
            business_id: business.id,
            name: name.trim(),
            phone: phoneNormalized || null,
            sex: sex || null
        }])
        .select()
        .single();
    
    if (insertError) {
        console.error('Error creating client:', insertError);
        return null;
    }
    
    // Convert to match old format
    return {
        id: newClient.id,
        name: newClient.name,
        phone: newClient.phone || '',
        sex: newClient.sex || '',
        createdAt: newClient.created_at
    };
}

// Update garment type dropdown based on sex
function updateGarmentTypes(sex) {
    const garmentSelect = document.getElementById('garment-type');
    const currentValue = garmentSelect.value;
    
    // Clear existing options except the first one
    garmentSelect.innerHTML = '<option value="">Select garment type</option>';
    
    if (sex && GARMENT_TYPES[sex]) {
        GARMENT_TYPES[sex].forEach(garment => {
            const option = document.createElement('option');
            option.value = garment;
            option.textContent = garment;
            garmentSelect.appendChild(option);
        });
        
        // Try to restore previous selection if it's still valid
        if (currentValue && GARMENT_TYPES[sex].includes(currentValue)) {
            garmentSelect.value = currentValue;
            updateMeasurementFields(currentValue);
            handleCustomGarmentVisibility(currentValue);
            handleAddFieldButtonVisibility(currentValue);
        } else {
            // Clear fields if garment type is not valid
            updateMeasurementFields('');
            handleCustomGarmentVisibility('');
            handleAddFieldButtonVisibility('');
        }
    } else {
        updateMeasurementFields('');
        handleCustomGarmentVisibility('');
        handleAddFieldButtonVisibility('');
    }
}

// Handle Custom garment input visibility
function handleCustomGarmentVisibility(garmentType) {
    const customGarmentGroup = document.getElementById('custom-garment-group');
    const customGarmentInput = document.getElementById('custom-garment-name');
    
    if (garmentType === 'Custom') {
        customGarmentGroup.style.display = 'block';
        customGarmentInput.required = true;
    } else {
        customGarmentGroup.style.display = 'none';
        customGarmentInput.required = false;
        customGarmentInput.value = '';
    }
}

// Handle Add Measurement Field button visibility
function handleAddFieldButtonVisibility(garmentType) {
    const addFieldWrapper = document.getElementById('add-custom-field-wrapper');
    
    if (garmentType && garmentType !== '') {
        // Show the Add Measurement Field button when any garment type is selected
        addFieldWrapper.style.display = 'flex';
    } else {
        // Hide when no garment type selected
        addFieldWrapper.style.display = 'none';
    }
}

// Update measurement fields visibility based on garment type
function updateMeasurementFields(garmentType) {
    const allFields = ['shoulder', 'chest', 'waist', 'sleeve', 'length', 'neck', 'hip', 'inseam', 'thigh', 'seat'];
    
    // For Custom garment type, show ALL fields
    if (garmentType === 'Custom') {
        allFields.forEach(field => {
            const fieldElement = document.getElementById(field);
            if (fieldElement) {
                fieldElement.closest('.form-group').style.display = 'block';
            }
        });
        return;
    }
    
    if (!garmentType || !GARMENT_FIELDS[garmentType]) {
        // Hide all fields if no garment type selected
        allFields.forEach(field => {
            const fieldElement = document.getElementById(field);
            if (fieldElement) {
                fieldElement.closest('.form-group').style.display = 'none';
            }
        });
        return;
    }
    
    const requiredFields = GARMENT_FIELDS[garmentType];
    
    // Show/hide fields based on garment type
    allFields.forEach(field => {
        const fieldElement = document.getElementById(field);
        if (fieldElement) {
            const formGroup = fieldElement.closest('.form-group');
            if (requiredFields.includes(field)) {
                formGroup.style.display = 'block';
            } else {
                formGroup.style.display = 'none';
                // Clear value when hiding
                fieldElement.value = '';
            }
        }
    });
}

// Check if client exists and update form accordingly
async function checkExistingClient() {
    const nameInput = document.getElementById('client-name');
    const name = nameInput.value.trim();
    const sexSelect = document.getElementById('client-sex');
    const phoneInput = document.getElementById('phone-number');
    
    if (!name) {
        sexSelect.disabled = false;
        sexSelect.required = true;
        updateGarmentTypes('');
        return;
    }
    
    const clients = await getClients();
    if (!Array.isArray(clients)) return;
    
    const existingClient = clients.find(c => 
        c.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingClient) {
        // Client exists - pre-fill sex and phone
        if (existingClient.sex) {
            sexSelect.value = existingClient.sex;
            sexSelect.disabled = true; // Don't allow changing sex for existing client
            sexSelect.required = false;
            updateGarmentTypes(existingClient.sex);
        } else {
            // Old client without sex - allow setting it
            sexSelect.disabled = false;
            sexSelect.required = true;
            updateGarmentTypes('');
        }
        if (existingClient.phone && !phoneInput.value) {
            phoneInput.value = existingClient.phone;
        }
    } else {
        // New client - enable sex selection
        sexSelect.disabled = false;
        sexSelect.required = true;
        if (!sexSelect.value) {
            updateGarmentTypes('');
        }
    }
}

// Save measurement (create or update)
async function saveMeasurement(clientId, formData, measurementId = null) {
    const supabase = getSupabase();
    if (!supabase) {
        console.error('Supabase client not available');
        return null;
    }
    
    const business = await getBusiness();
    if (!business) {
        console.error('Business not found');
        return null;
    }
    
    if (measurementId) {
        // Update existing measurement
        const { data, error } = await supabase
            .from('measurements')
            .update({
                garment_type: formData.garmentType || null,
                sex: formData.sex || null,
                shoulder: formData.shoulder || null,
                chest: formData.chest || null,
                waist: formData.waist || null,
                sleeve: formData.sleeve || null,
                length: formData.length || null,
                neck: formData.neck || null,
                hip: formData.hip || null,
                inseam: formData.inseam || null,
                thigh: formData.thigh || null,
                seat: formData.seat || null,
                notes: formData.notes || null,
                custom_fields: formData.customFields || {}
            })
            .eq('id', measurementId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating measurement:', error);
            return null;
        }
        
        // Convert to match old format
        return {
            id: data.id,
            client_id: data.client_id,
            garment_type: data.garment_type || null,
            date_created: data.created_at,
            shoulder: data.shoulder || null,
            chest: data.chest || null,
            waist: data.waist || null,
            sleeve: data.sleeve || null,
            length: data.length || null,
            neck: data.neck || null,
            hip: data.hip || null,
            inseam: data.inseam || null,
            thigh: data.thigh || null,
            seat: data.seat || null,
            notes: data.notes || null,
            customFields: data.custom_fields || {}
        };
    } else {
        // Create new measurement - let Supabase generate the ID automatically
        const { data, error } = await supabase
            .from('measurements')
            .insert([{
                business_id: business.id,
                client_id: clientId,
                garment_type: formData.garmentType || null,
                sex: formData.sex || null,
                shoulder: formData.shoulder || null,
                chest: formData.chest || null,
                waist: formData.waist || null,
                sleeve: formData.sleeve || null,
                length: formData.length || null,
                neck: formData.neck || null,
                hip: formData.hip || null,
                inseam: formData.inseam || null,
                thigh: formData.thigh || null,
                seat: formData.seat || null,
                notes: formData.notes || null,
                custom_fields: formData.customFields || {}
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating measurement:', error);
            return null;
        }
        
        // Convert to match old format
        return {
            id: data.id,
            client_id: data.client_id,
            garment_type: data.garment_type || null,
            date_created: data.created_at,
            shoulder: data.shoulder || null,
            chest: data.chest || null,
            waist: data.waist || null,
            sleeve: data.sleeve || null,
            length: data.length || null,
            neck: data.neck || null,
            hip: data.hip || null,
            inseam: data.inseam || null,
            thigh: data.thigh || null,
            seat: data.seat || null,
            notes: data.notes || null,
            customFields: data.custom_fields || {}
        };
    }
}

// Edit measurement
async function editMeasurement(measurementId, clientId) {
    const measurements = await getMeasurements();
    const clients = await getClients();
    
    if (!Array.isArray(measurements)) {
        alert('Error loading measurements');
        return;
    }
    if (!Array.isArray(clients)) {
        alert('Error loading clients');
        return;
    }
    
    const measurement = measurements.find(m => m.id === measurementId);
    const client = clients.find(c => c.id === clientId);
    
    if (!measurement || !client) {
        alert('Measurement or client not found');
        return;
    }
    
    currentMeasurementId = measurementId;
    currentClientId = clientId;
    
    // Update form header
    document.querySelector('#new-measurement-screen h2').textContent = 'Edit Measurement';
    
    // Pre-fill form with measurement data
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-name').disabled = true;
    document.getElementById('phone-number').value = client.phone || '';
    
    if (client.sex) {
        document.getElementById('client-sex').value = client.sex;
        document.getElementById('client-sex').disabled = true;
        document.getElementById('client-sex').required = false;
        updateGarmentTypes(client.sex);
    }
    
    // Set garment type and update fields
    if (measurement.garment_type) {
        const garmentSelect = document.getElementById('garment-type');
        const isCustomGarment = !GARMENT_TYPES[client.sex]?.includes(measurement.garment_type);
        
        if (isCustomGarment) {
            // This is a custom garment type - set dropdown to "Custom" and fill in the name
            garmentSelect.value = 'Custom';
            handleCustomGarmentVisibility('Custom');
            document.getElementById('custom-garment-name').value = measurement.garment_type;
            updateMeasurementFields('Custom');
        } else {
            garmentSelect.value = measurement.garment_type;
            updateMeasurementFields(measurement.garment_type);
        }
        handleAddFieldButtonVisibility(measurement.garment_type || 'Custom');
    }
    
    // Fill in all measurement values
    document.getElementById('shoulder').value = measurement.shoulder || '';
    document.getElementById('chest').value = measurement.chest || '';
    document.getElementById('waist').value = measurement.waist || '';
    document.getElementById('sleeve').value = measurement.sleeve || '';
    document.getElementById('length').value = measurement.length || '';
    document.getElementById('neck').value = measurement.neck || '';
    document.getElementById('hip').value = measurement.hip || '';
    document.getElementById('inseam').value = measurement.inseam || '';
    document.getElementById('thigh').value = measurement.thigh || '';
    document.getElementById('seat').value = measurement.seat || '';
    document.getElementById('notes').value = measurement.notes || '';
    
    // Load custom fields
    const customFieldsContainer = document.getElementById('custom-fields-container');
    customFieldsContainer.innerHTML = '';
    if (measurement.customFields && typeof measurement.customFields === 'object') {
        Object.entries(measurement.customFields).forEach(([name, value]) => {
            if (name && value !== null && value !== undefined) {
                addCustomFieldRow(name, value);
            }
        });
    }
    
    // Show measurement form
    showScreen('new-measurement-screen');
}

// Delete measurement
async function deleteMeasurement(measurementId, clientId) {
    if (!confirm('Are you sure you want to delete this measurement?')) {
        return;
    }
    
    const supabase = getSupabase();
    if (!supabase) {
        console.error('Supabase client not available');
        return;
    }
    
    const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', measurementId);
    
    if (error) {
        console.error('Error deleting measurement:', error);
        alert('Error deleting measurement');
        return;
    }
    
    // Return to client detail view
    await showClientDetails(clientId, previousScreen);
}

// Update business header name
async function updateBusinessHeader() {
    const headerElement = document.getElementById('business-header-name');
    if (headerElement) {
        const business = await getBusiness();
        if (business && business.name && !isUserLoggedOut()) {
            const businessName = business.name;
            headerElement.textContent = businessName;
            headerElement.setAttribute('title', businessName);
        } else {
            headerElement.textContent = 'Measurement Vault';
            headerElement.removeAttribute('title');
        }
    }
}

// Update business name in all navbar instances
async function updateNavbarBusinessName() {
    const business = await getBusiness();
    const businessName = (business && business.name && !isUserLoggedOut()) ? business.name : 'Measurement Vault';
    
    document.querySelectorAll('.navbar-business-name').forEach(element => {
        element.textContent = businessName;
        if (business && business.name) {
            element.setAttribute('title', businessName);
        } else {
            element.removeAttribute('title');
        }
    });
}

// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Update business header when showing home screen
    if (screenId === 'home-screen') {
        updateBusinessHeader();
    }
    
    // Update business name in all navbar instances
    updateNavbarBusinessName();
}

// Navigation Event Listeners
document.getElementById('new-measurement-btn').addEventListener('click', () => {
    resetMeasurementForm();
    document.querySelector('#new-measurement-screen h2').textContent = 'New Measurement';
    showScreen('new-measurement-screen');
    document.getElementById('client-name').focus();
});

document.getElementById('search-measurements-btn').addEventListener('click', () => {
    showScreen('search-screen');
    document.getElementById('search-input').focus();
    renderSearchResults('');
});


document.getElementById('back-from-search-btn').addEventListener('click', () => {
    showScreen('home-screen');
    document.getElementById('search-input').value = '';
    renderRecentMeasurements();
});

// Track previous screen for back navigation
let previousScreen = 'home-screen';

document.getElementById('back-from-details-btn').addEventListener('click', () => {
    showScreen(previousScreen);
});

// Clients Screen Navigation
document.getElementById('clients-btn').addEventListener('click', async () => {
    showScreen('clients-screen');
    await renderClientsList();
});

document.getElementById('back-from-clients-btn').addEventListener('click', () => {
    showScreen('home-screen');
    renderRecentMeasurements();
});

// Track current client ID when viewing details (for adding measurements)
let currentClientId = null;
// Track current measurement ID when editing
let currentMeasurementId = null;

// Form Submission
document.getElementById('measurement-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Handle custom garment type
    let garmentType = document.getElementById('garment-type').value;
    if (garmentType === 'Custom') {
        const customGarmentName = document.getElementById('custom-garment-name').value.trim();
        if (!customGarmentName) {
            alert('Please enter a custom garment name');
            return;
        }
        garmentType = customGarmentName;
    }
    
    // Collect custom fields from inline inputs
    const customFields = {};
    const customFieldGroups = document.querySelectorAll('#custom-fields-container .custom-field-group');
    customFieldGroups.forEach(group => {
        const input = group.querySelector('.custom-field-input');
        if (input) {
            const fieldName = input.getAttribute('data-field-name');
            const fieldValue = parseFloat(input.value) || null;
            if (fieldName && fieldValue !== null) {
                customFields[fieldName] = fieldValue;
            }
        }
    });
    
    const formData = {
        clientName: document.getElementById('client-name').value.trim(),
        phone: document.getElementById('phone-number').value.trim(),
        sex: document.getElementById('client-sex').value,
        garmentType: garmentType,
        shoulder: parseFloat(document.getElementById('shoulder').value) || null,
        chest: parseFloat(document.getElementById('chest').value) || null,
        waist: parseFloat(document.getElementById('waist').value) || null,
        sleeve: parseFloat(document.getElementById('sleeve').value) || null,
        length: parseFloat(document.getElementById('length').value) || null,
        neck: parseFloat(document.getElementById('neck').value) || null,
        hip: parseFloat(document.getElementById('hip').value) || null,
        inseam: parseFloat(document.getElementById('inseam').value) || null,
        thigh: parseFloat(document.getElementById('thigh').value) || null,
        seat: parseFloat(document.getElementById('seat').value) || null,
        notes: document.getElementById('notes').value.trim(),
        customFields: customFields
    };
    
    if (!formData.clientName) {
        alert('Client name is required');
        return;
    }
    
    if (!formData.sex) {
        alert('Sex is required');
        return;
    }
    
    // Find or create client
    const client = await findOrCreateClient(formData.clientName, formData.phone, formData.sex);
    if (!client) {
        alert('Error creating/finding client');
        return;
    }
    
    // Save measurement (create or update)
    await saveMeasurement(client.id, formData, currentMeasurementId);
    
    // Reset form
    resetMeasurementForm();
    
    // Return to appropriate screen
    if (currentClientId && currentClientId === client.id) {
        // We were adding/editing a measurement from client detail view
        await showClientDetails(client.id, previousScreen);
    } else {
        // Normal flow - return to home
        showScreen('home-screen');
        renderRecentMeasurements();
    }
});

// Reset measurement form
function resetMeasurementForm() {
    document.getElementById('measurement-form').reset();
    document.getElementById('client-name').disabled = false;
    document.getElementById('client-sex').disabled = false;
    document.getElementById('client-sex').required = true;
    currentClientId = null;
    currentMeasurementId = null;
    updateGarmentTypes('');
    updateMeasurementFields('');
    handleCustomGarmentVisibility('');
    handleAddFieldButtonVisibility('');
    
    // Clear custom fields
    const customFieldsContainer = document.getElementById('custom-fields-container');
    if (customFieldsContainer) {
        customFieldsContainer.innerHTML = '';
    }
    
    // Reset form header
    const header = document.querySelector('#new-measurement-screen h2');
    if (header) {
        header.textContent = 'New Measurement';
    }
    
    // Initially hide all measurement fields
    const allFields = ['shoulder', 'chest', 'waist', 'sleeve', 'length', 'neck', 'hip', 'inseam', 'thigh', 'seat'];
    allFields.forEach(field => {
        const fieldElement = document.getElementById(field);
        if (fieldElement) {
            fieldElement.closest('.form-group').style.display = 'none';
        }
    });
}

// Event listeners for form fields
document.getElementById('client-name').addEventListener('input', checkExistingClient);
document.getElementById('client-name').addEventListener('blur', checkExistingClient);

document.getElementById('client-sex').addEventListener('change', (e) => {
    updateGarmentTypes(e.target.value);
});

// Add Measurement button from Client Detail View
document.getElementById('add-measurement-from-details-btn').addEventListener('click', async () => {
    if (!currentClientId) {
        alert('Client not found');
        return;
    }
    
    const clients = await getClients();
    if (!Array.isArray(clients)) return;
    
    const client = clients.find(c => c.id === currentClientId);
    
    if (!client) {
        alert('Client not found');
        return;
    }
    
    // Reset form first
    resetMeasurementForm();
    currentClientId = client.id;
    
    // Update form header
    document.querySelector('#new-measurement-screen h2').textContent = 'New Measurement';
    
    // Pre-fill form with client data
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-name').disabled = true;
    document.getElementById('phone-number').value = client.phone || '';
    
    if (client.sex) {
        document.getElementById('client-sex').value = client.sex;
        document.getElementById('client-sex').disabled = true;
        document.getElementById('client-sex').required = false;
        updateGarmentTypes(client.sex);
    } else {
        document.getElementById('client-sex').value = '';
        document.getElementById('client-sex').disabled = false;
        document.getElementById('client-sex').required = true;
        updateGarmentTypes('');
    }
    
    // Show measurement form
    showScreen('new-measurement-screen');
});

// Garment type change listener
document.getElementById('garment-type').addEventListener('change', async (e) => {
    const garmentType = e.target.value;
    updateMeasurementFields(garmentType);
    handleCustomGarmentVisibility(garmentType);
    handleAddFieldButtonVisibility(garmentType);
});

// Update back button from new measurement
document.getElementById('back-from-new-btn').addEventListener('click', async () => {
    if (currentClientId) {
        // If we were adding/editing from client detail view, return there
        const clientId = currentClientId;
        resetMeasurementForm();
        await showClientDetails(clientId, previousScreen);
    } else {
        // Normal flow - return to home
        resetMeasurementForm();
        showScreen('home-screen');
        await renderRecentMeasurements();
    }
    // Reset form header
    document.querySelector('#new-measurement-screen h2').textContent = 'New Measurement';
});

// Search Functionality
async function searchClients(query) {
    const clients = await getClients();
    const measurements = await getMeasurements();
    
    if (!Array.isArray(clients)) return [];
    if (!Array.isArray(measurements)) return [];
    
    const queryLower = query.toLowerCase().trim();
    
    if (!queryLower) {
        return [];
    }
    
    // Filter clients by name or phone
    const matchingClients = clients.filter(client => {
        const nameMatch = client.name.toLowerCase().includes(queryLower);
        const phoneMatch = client.phone && client.phone.includes(queryLower);
        return nameMatch || phoneMatch;
    });
    
    // Add measurement count to each client
    return matchingClients.map(client => {
        const clientMeasurements = measurements.filter(m => m.client_id === client.id);
        return {
            ...client,
            measurementCount: clientMeasurements.length
        };
    });
}

async function renderSearchResults(query) {
    const resultsContainer = document.getElementById('search-results');
    const clients = await searchClients(query);
    
    if (!Array.isArray(clients)) {
        resultsContainer.innerHTML = '<div class="no-results">Error loading clients</div>';
        return;
    }
    
    if (!query.trim()) {
        resultsContainer.innerHTML = '<div class="no-results">Start typing to search for clients...</div>';
        return;
    }
    
    if (clients.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No clients found</div>';
        return;
    }
    
    resultsContainer.innerHTML = clients.map(client => `
        <div class="client-card" data-client-id="${client.id}">
            <div class="client-name">${escapeHtml(client.name)}</div>
            ${client.phone ? `<div class="client-phone">${escapeHtml(client.phone)}</div>` : ''}
            <div class="client-phone" style="margin-top: 8px; color: #4a5568;">
                ${client.measurementCount} measurement${client.measurementCount !== 1 ? 's' : ''}
            </div>
        </div>
    `).join('');
    
    // Add click listeners to client cards
    resultsContainer.querySelectorAll('.client-card').forEach(card => {
        card.addEventListener('click', async () => {
            const clientId = card.getAttribute('data-client-id');
            await showClientDetails(clientId, 'search-screen');
        });
    });
}

// Search input listener
document.getElementById('search-input').addEventListener('input', async (e) => {
    await renderSearchResults(e.target.value);
});

// Show Client Details
async function showClientDetails(clientId, fromScreen = 'search-screen') {
    previousScreen = fromScreen;
    currentClientId = clientId;
    const clients = await getClients();
    const measurements = await getMeasurements();
    
    if (!Array.isArray(clients)) return;
    if (!Array.isArray(measurements)) return;
    
    const client = clients.find(c => c.id === clientId);
    if (!client) {
        alert('Client not found');
        return;
    }
    
    const clientMeasurements = measurements
        .filter(m => m.client_id === clientId)
        .sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
    
    // Set client name in header
    document.getElementById('client-details-name').textContent = client.name;
    
    // Render client details
    const detailsContainer = document.getElementById('client-details-content');
    
    // Always show client info (name, phone, sex)
    let html = `
        <div class="client-info">
            <div class="client-info-item">
                <span class="client-info-label">Name:</span>
                <span>${escapeHtml(client.name)}</span>
            </div>
            ${client.phone ? `
                <div class="client-info-item">
                    <span class="client-info-label">Phone:</span>
                    <span>${escapeHtml(client.phone)}</span>
                </div>
            ` : ''}
            ${client.sex ? `
                <div class="client-info-item">
                    <span class="client-info-label">Sex:</span>
                    <span>${escapeHtml(client.sex)}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    if (clientMeasurements.length === 0) {
        html += `
            <div class="empty-state" style="margin-top: 30px;">
                <div class="empty-state-icon">📏</div>
                <div class="empty-state-text">No measurements recorded yet</div>
            </div>
        `;
    } else {
        // Show all measurements as individual records (most recent first)
        html += '<div class="measurements-list" style="margin-top: 30px;">';
        clientMeasurements.forEach(measurement => {
            html += `
                <div class="measurement-record">
                    <div class="measurement-record-header">
                        <div class="measurement-garment">${measurement.garment_type || 'No garment type'}</div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="measurement-date">${formatDate(measurement.date_created)}</div>
                            <div class="measurement-menu-wrapper">
                                <button class="btn-menu measurement-menu-btn" aria-label="Measurement actions" data-measurement-id="${measurement.id}">⋮</button>
                                <div class="menu-dropdown measurement-menu-dropdown" data-measurement-id="${measurement.id}">
                                    <button class="menu-item edit-measurement-btn" data-measurement-id="${measurement.id}">Edit Measurement</button>
                                    <button class="menu-item menu-item-danger delete-measurement-btn" data-measurement-id="${measurement.id}">Delete Measurement</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="measurement-values">
                        ${renderMeasurementValue('Shoulder', measurement.shoulder)}
                        ${renderMeasurementValue('Chest', measurement.chest)}
                        ${renderMeasurementValue('Waist', measurement.waist)}
                        ${renderMeasurementValue('Sleeve', measurement.sleeve)}
                        ${renderMeasurementValue('Length', measurement.length)}
                        ${renderMeasurementValue('Neck', measurement.neck)}
                        ${renderMeasurementValue('Hip', measurement.hip)}
                        ${renderMeasurementValue('Inseam', measurement.inseam)}
                        ${renderMeasurementValue('Thigh', measurement.thigh)}
                        ${renderMeasurementValue('Seat', measurement.seat)}
                        ${renderCustomFields(measurement.customFields)}
                    </div>
                    ${measurement.notes ? `
                        <div class="measurement-notes" style="margin-top: 12px;">
                            <strong>Notes:</strong> ${escapeHtml(measurement.notes)}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';
    }
    
    detailsContainer.innerHTML = html;
    showScreen('client-details-screen');
    
    // Add event listeners for measurement menu buttons
    detailsContainer.querySelectorAll('.measurement-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const measurementId = e.target.getAttribute('data-measurement-id');
            const dropdown = detailsContainer.querySelector(`.measurement-menu-dropdown[data-measurement-id="${measurementId}"]`);
            toggleMenuDropdown(dropdown);
        });
    });
    
    // Add event listeners for Edit measurement
    detailsContainer.querySelectorAll('.edit-measurement-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const measurementId = e.target.getAttribute('data-measurement-id');
            closeAllMenuDropdowns();
            await editMeasurement(measurementId, clientId);
        });
    });
    
    // Add event listeners for Delete measurement
    detailsContainer.querySelectorAll('.delete-measurement-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const measurementId = e.target.getAttribute('data-measurement-id');
            closeAllMenuDropdowns();
            deleteMeasurement(measurementId, clientId);
        });
    });
}

// Group measurements by date
function groupMeasurementsByDate(measurements) {
    const groups = {};
    
    measurements.forEach(measurement => {
        const date = new Date(measurement.date_created);
        const dateKey = date.toDateString();
        
        if (!groups[dateKey]) {
            groups[dateKey] = {
                date: measurement.date_created,
                garmentType: measurement.garment_type,
                shoulder: measurement.shoulder,
                chest: measurement.chest,
                waist: measurement.waist,
                sleeve: measurement.sleeve,
                length: measurement.length,
                neck: measurement.neck,
                notes: measurement.notes
            };
        }
    });
    
    return Object.values(groups);
}

// Render measurement value
function renderMeasurementValue(label, value) {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    return `
        <div class="measurement-item">
            <span class="measurement-label">${label}</span>
            <span class="measurement-value">${value}</span>
        </div>
    `;
}

// Render custom fields
function renderCustomFields(customFields) {
    if (!customFields || typeof customFields !== 'object' || Object.keys(customFields).length === 0) {
        return '';
    }
    
    return Object.entries(customFields).map(([name, value]) => {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        // Capitalize first letter of field name
        const displayName = name.charAt(0).toUpperCase() + name.slice(1);
        return `
            <div class="measurement-item custom-measurement-item">
                <span class="measurement-label">${escapeHtml(displayName)}</span>
                <span class="measurement-value">${escapeHtml(String(value))}</span>
            </div>
        `;
    }).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get recent measurements (most recent first, with pagination)
async function getRecentMeasurements(limit = null, offset = 0) {
    const measurements = await getMeasurements();
    const clients = await getClients();
    
    if (!Array.isArray(measurements)) return { measurements: [], total: 0, hasMore: false };
    if (!Array.isArray(clients)) return { measurements: [], total: 0, hasMore: false };
    
    // Sort by date, most recent first
    const sorted = measurements
        .sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
    
    // Apply pagination if limit is specified
    const paginated = limit ? sorted.slice(offset, offset + limit) : sorted.slice(offset);
    
    // Map to include client info
    return {
        measurements: paginated.map(measurement => {
            const client = clients.find(c => c.id === measurement.client_id);
            return {
                ...measurement,
                clientName: client ? client.name : 'Unknown',
                clientId: measurement.client_id
            };
        }),
        total: sorted.length,
        hasMore: limit ? (offset + limit < sorted.length) : false
    };
}

// Render Recent Measurements on Home Screen with pagination
let recentMeasurementsOffset = 0;
let recentMeasurementsLimit = 4; // Initial limit
let recentMeasurementsExpanded = false;

async function renderRecentMeasurements(resetPagination = true) {
    const container = document.getElementById('recent-measurements');
    // Reset offset when rendering from scratch (unless explicitly continuing pagination)
    if (resetPagination) {
        recentMeasurementsOffset = 0;
    }
    const limit = recentMeasurementsExpanded ? 15 : recentMeasurementsLimit;
    const result = await getRecentMeasurements(limit, recentMeasurementsOffset);
    
    if (result.measurements.length === 0) {
        container.innerHTML = '<div class="recent-empty">No measurements yet. Start by adding a new measurement.</div>';
        return;
    }
    
    let html = result.measurements.map(item => `
        <div class="recent-item" data-measurement-id="${item.id}" data-client-id="${item.clientId}">
            <div class="recent-item-field">
                <div class="recent-item-label">Name</div>
                <div class="recent-item-name">${escapeHtml(item.clientName)}</div>
            </div>
            <div class="recent-item-field">
                <div class="recent-item-label">Garment</div>
                <div class="recent-item-garment">${item.garment_type || 'No garment type'}</div>
            </div>
            <div class="recent-item-field">
                <div class="recent-item-label">Date</div>
                <div class="recent-item-date">${formatDateShort(item.date_created)}</div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Update header control (See More / Collapse button)
    const controlContainer = document.getElementById('recent-measurements-control');
    if (controlContainer) {
        let controlHtml = '';
        
        // Add "See More" button if not expanded and there are more measurements
        if (!recentMeasurementsExpanded && result.hasMore) {
            controlHtml = `
                <button id="see-more-measurements-btn" class="recent-control-btn">
                    See more
                </button>
            `;
        }
        
        // Add "Collapse" button if expanded
        if (recentMeasurementsExpanded) {
            controlHtml = `
                <button id="collapse-measurements-btn" class="recent-control-btn">
                    Collapse
                </button>
            `;
        }
        
        controlContainer.innerHTML = controlHtml;
    }
    
    // Add click listeners for measurement items - open Measurement Detail View
    container.querySelectorAll('.recent-item').forEach(item => {
        item.addEventListener('click', async () => {
            const measurementId = item.getAttribute('data-measurement-id');
            await showMeasurementDetail(measurementId);
        });
    });
    
    // Add "See More" button listener
    const seeMoreBtn = document.getElementById('see-more-measurements-btn');
    if (seeMoreBtn) {
        seeMoreBtn.addEventListener('click', () => {
            recentMeasurementsExpanded = true;
            recentMeasurementsLimit = 15;
            renderRecentMeasurements();
        });
    }
    
    // Add "Collapse" button listener
    const collapseBtn = document.getElementById('collapse-measurements-btn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            recentMeasurementsExpanded = false;
            recentMeasurementsLimit = 4;
            recentMeasurementsOffset = 0;
            renderRecentMeasurements(true);
        });
    }
    
    // Add "Next" button listener
    const nextBtn = document.getElementById('next-measurements-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            recentMeasurementsOffset += 15;
            const nextResult = await getRecentMeasurements(15, recentMeasurementsOffset);
            if (nextResult.measurements.length > 0) {
                const existingItems = container.querySelectorAll('.recent-item');
                const nextItems = nextResult.measurements.map(item => `
                    <div class="recent-item" data-measurement-id="${item.id}" data-client-id="${item.clientId}">
                        <div class="recent-item-field">
                            <div class="recent-item-label">Name</div>
                            <div class="recent-item-name">${escapeHtml(item.clientName)}</div>
                        </div>
                        <div class="recent-item-field">
                            <div class="recent-item-label">Garment</div>
                            <div class="recent-item-garment">${item.garment_type || 'No garment type'}</div>
                        </div>
                        <div class="recent-item-field">
                            <div class="recent-item-label">Date</div>
                            <div class="recent-item-date">${formatDateShort(item.date_created)}</div>
                        </div>
                    </div>
                `).join('');
                
                // Remove the Next button temporarily
                nextBtn.remove();
                
                // Add new items
                container.insertAdjacentHTML('beforeend', nextItems);
                
                // Re-add Next button if there are more
                if (nextResult.hasMore) {
                    container.insertAdjacentHTML('beforeend', `
                        <button id="next-measurements-btn" class="btn btn-secondary" style="margin-top: 16px;">
                            Next
                        </button>
                    `);
                    document.getElementById('next-measurements-btn').addEventListener('click', arguments.callee);
                }
                
                // Add click listeners to new items - open Measurement Detail View
                container.querySelectorAll('.recent-item').forEach(item => {
                    if (!item.hasAttribute('data-listener-added')) {
                        item.setAttribute('data-listener-added', 'true');
                        item.addEventListener('click', async () => {
                            const measurementId = item.getAttribute('data-measurement-id');
                            await showMeasurementDetail(measurementId);
                        });
                    }
                });
            }
        });
    }
}

// Format date for recent items (shorter format)
function formatDateShort(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Today';
    } else if (diffDays === 2) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
}

// Render Clients List
async function renderClientsList() {
    const container = document.getElementById('clients-list');
    const countElement = document.getElementById('clients-count');
    const clients = await getClients();
    const measurements = await getMeasurements();
    
    if (!Array.isArray(clients)) {
        container.innerHTML = '<div class="clients-empty">Error loading clients</div>';
        return;
    }
    if (!Array.isArray(measurements)) {
        container.innerHTML = '<div class="clients-empty">Error loading measurements</div>';
        return;
    }
    
    // Update count
    countElement.textContent = `Clients: ${clients.length}`;
    
    if (clients.length === 0) {
        container.innerHTML = '<div class="clients-empty">No clients yet. Start by adding a new measurement.</div>';
        return;
    }
    
    // Sort clients alphabetically by name
    const sortedClients = [...clients].sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    
    container.innerHTML = sortedClients.map(client => {
        const clientMeasurements = measurements.filter(m => m.client_id === client.id);
        return `
            <div class="client-list-item" data-client-id="${client.id}">
                <div class="client-list-item-content">
                    <div class="client-list-name">${escapeHtml(client.name)}</div>
                </div>
                <div class="client-menu-wrapper">
                    <button class="btn-menu client-list-menu-btn" data-client-id="${client.id}" aria-label="Client actions">⋮</button>
                    <div class="menu-dropdown client-list-dropdown" data-client-id="${client.id}">
                        <button class="menu-item edit-client-list-btn" data-client-id="${client.id}">Edit Client</button>
                        <button class="menu-item menu-item-danger delete-client-list-btn" data-client-id="${client.id}">Delete Client</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click listeners for client content (to view details)
    container.querySelectorAll('.client-list-item-content').forEach(content => {
        content.addEventListener('click', async () => {
            const clientId = content.closest('.client-list-item').getAttribute('data-client-id');
            await showClientDetails(clientId, 'clients-screen');
        });
    });
    
    // Add click listeners for menu buttons
    container.querySelectorAll('.client-list-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const clientId = btn.getAttribute('data-client-id');
            const dropdown = container.querySelector(`.client-list-dropdown[data-client-id="${clientId}"]`);
            
            // Close all other dropdowns first
            closeAllMenuDropdowns();
            
            // Toggle this dropdown with proper positioning
            if (!dropdown.classList.contains('active')) {
                positionDropdown(btn, dropdown);
                dropdown.classList.add('active');
            }
        });
    });
    
    // Add click listeners for Edit Client in list
    container.querySelectorAll('.edit-client-list-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const clientId = btn.getAttribute('data-client-id');
            closeAllMenuDropdowns();
            await editClientFromList(clientId);
        });
    });
    
    // Add click listeners for Delete Client in list
    container.querySelectorAll('.delete-client-list-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const clientId = btn.getAttribute('data-client-id');
            closeAllMenuDropdowns();
            deleteClientFromList(clientId);
        });
    });
}

// Edit client from list
async function editClientFromList(clientId) {
    const clients = await getClients();
    if (!Array.isArray(clients)) {
        alert('Error loading clients');
        return;
    }
    
    const client = clients.find(c => c.id === clientId);
    
    if (!client) {
        alert('Client not found');
        return;
    }
    
    currentClientId = clientId;
    previousScreen = 'clients-screen';
    
    // Pre-fill edit form
    document.getElementById('edit-client-name').value = client.name;
    document.getElementById('edit-client-phone').value = client.phone || '';
    document.getElementById('edit-client-sex').value = client.sex || '';
    
    showScreen('edit-client-screen');
}

// Delete client from list
async function deleteClientFromList(clientId) {
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated measurements.')) {
        return;
    }
    
    deleteClient(clientId);
    
    // Refresh the clients list
    await renderClientsList();
}

// Show Measurement Detail View
let currentMeasurementDetailId = null;

async function showMeasurementDetail(measurementId) {
    const measurements = await getMeasurements();
    const clients = await getClients();
    
    if (!Array.isArray(measurements)) {
        alert('Error loading measurements');
        return;
    }
    if (!Array.isArray(clients)) {
        alert('Error loading clients');
        return;
    }
    
    const measurement = measurements.find(m => m.id === measurementId);
    
    if (!measurement) {
        alert('Measurement not found');
        return;
    }
    
    const client = clients.find(c => c.id === measurement.client_id);
    if (!client) {
        alert('Client not found');
        return;
    }
    
    currentMeasurementDetailId = measurementId;
    currentClientId = client.id;
    
    const detailsContainer = document.getElementById('measurement-detail-content');
    
    // Build HTML with client info and measurement details
    let html = `
        <div class="client-info">
            <div class="client-info-item">
                <span class="client-info-label">Client Name:</span>
                <span>${escapeHtml(client.name)}</span>
            </div>
            ${client.phone ? `
                <div class="client-info-item">
                    <span class="client-info-label">Phone:</span>
                    <span>${escapeHtml(client.phone)}</span>
                </div>
            ` : ''}
            ${client.sex ? `
                <div class="client-info-item">
                    <span class="client-info-label">Sex:</span>
                    <span>${escapeHtml(client.sex)}</span>
                </div>
            ` : ''}
        </div>
        
        <div class="measurement-record" style="margin-top: 30px;">
            <div class="measurement-record-header">
                <div class="measurement-garment">${measurement.garment_type || 'No garment type'}</div>
                <div class="measurement-date">${formatDate(measurement.date_created)}</div>
            </div>
            <div class="measurement-values">
                ${renderMeasurementValue('Shoulder', measurement.shoulder)}
                ${renderMeasurementValue('Chest', measurement.chest)}
                ${renderMeasurementValue('Waist', measurement.waist)}
                ${renderMeasurementValue('Sleeve', measurement.sleeve)}
                ${renderMeasurementValue('Length', measurement.length)}
                ${renderMeasurementValue('Neck', measurement.neck)}
                ${renderMeasurementValue('Hip', measurement.hip)}
                ${renderMeasurementValue('Inseam', measurement.inseam)}
                ${renderMeasurementValue('Thigh', measurement.thigh)}
                ${renderMeasurementValue('Seat', measurement.seat)}
                ${renderCustomFields(measurement.customFields)}
            </div>
            ${measurement.notes ? `
                <div class="measurement-notes" style="margin-top: 12px;">
                    <strong>Notes:</strong> ${escapeHtml(measurement.notes)}
                </div>
            ` : ''}
        </div>
    `;
    
    detailsContainer.innerHTML = html;
    showScreen('measurement-detail-screen');
}

// Back button from Measurement Detail View
document.getElementById('back-from-measurement-detail-btn').addEventListener('click', () => {
    showScreen('home-screen');
    renderRecentMeasurements();
});

// View Client button from Measurement Detail View
document.getElementById('view-client-from-measurement-btn').addEventListener('click', async () => {
    if (currentClientId) {
        await showClientDetails(currentClientId, 'measurement-detail-screen');
    }
});

// Toggle menu dropdown
function toggleMenuDropdown(dropdownElement) {
    if (!dropdownElement) return;
    
    closeAllMenuDropdowns(dropdownElement); // Close others
    
    // Find the associated button
    const measurementId = dropdownElement.getAttribute('data-measurement-id');
    const button = document.querySelector(`.measurement-menu-btn[data-measurement-id="${measurementId}"]`) ||
                   dropdownElement.previousElementSibling;
    
    if (button) {
        positionDropdown(button, dropdownElement);
    }
    
    dropdownElement.classList.toggle('active');
}

// Close all menu dropdowns
function closeAllMenuDropdowns(excludeDropdown = null) {
    document.querySelectorAll('.menu-dropdown.active').forEach(dropdown => {
        if (dropdown !== excludeDropdown) {
            dropdown.classList.remove('active');
            dropdown.style.top = '';
            dropdown.style.right = '';
            dropdown.style.left = '';
        }
    });
}

// Position dropdown relative to the button (for fixed positioning)
function positionDropdown(button, dropdown) {
    const rect = button.getBoundingClientRect();
    const dropdownHeight = 100; // Approximate height
    const viewportHeight = window.innerHeight;
    
    // Position below the button by default
    let top = rect.bottom + 4;
    
    // If dropdown would go below viewport, position above
    if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 4;
        if (top < 0) top = rect.bottom + 4; // Fallback to below if not enough space above
    }
    
    dropdown.style.top = top + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    dropdown.style.left = 'auto';
}

// Client Details menu toggle
document.getElementById('client-menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const button = e.currentTarget;
    const dropdown = document.getElementById('client-menu-dropdown');
    
    // Close other dropdowns first
    document.querySelectorAll('.menu-dropdown.active').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('active');
        }
    });
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
    } else {
        positionDropdown(button, dropdown);
        dropdown.classList.add('active');
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.client-menu-wrapper') && 
        !e.target.closest('.measurement-menu-wrapper') && 
        !e.target.closest('.btn-menu')) {
        closeAllMenuDropdowns();
    }
});

// Close dropdowns on scroll (for fixed position dropdowns)
document.addEventListener('scroll', () => {
    closeAllMenuDropdowns();
}, true);

// Theme Toggle Functionality
const THEME_STORAGE_KEY = 'measurement_vault_theme';

// Initialize theme immediately (before DOMContentLoaded to prevent flash)
(function initThemeEarly() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
    if (document.documentElement) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
})();

// Set theme
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    updateThemeToggleIcon(theme);
}

// Update theme toggle button icon
function updateThemeToggleIcon(theme) {
    // Moon icon SVG (for dark mode - clicking switches to light)
    const moonIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    
    // Sun icon SVG (for light mode - clicking switches to dark)
    const sunIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    
    const icon = theme === 'dark' ? moonIcon : sunIcon;
    
    // Update button with ID
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = icon;
    }
    
    // Update all navbar theme toggle buttons
    document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
        btn.innerHTML = icon;
    });
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Theme toggle button event listener
document.addEventListener('DOMContentLoaded', () => {
    // Ensure theme is set (default to dark)
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
    setTheme(savedTheme);
    
    // Find theme toggle button in active screen or home screen
    const activeScreen = document.querySelector('.screen.active') || document.getElementById('home-screen');
    const themeToggleBtn = activeScreen ? activeScreen.querySelector('.btn-theme-toggle') || document.getElementById('theme-toggle-btn') : document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Also add listeners to all theme toggle buttons for consistency
    document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
        if (!btn.hasAttribute('data-listener-added')) {
            btn.setAttribute('data-listener-added', 'true');
            btn.addEventListener('click', toggleTheme);
        }
    });
});

// Edit Client functionality
document.getElementById('edit-client-btn').addEventListener('click', async () => {
    closeAllMenuDropdowns();
    
    if (!currentClientId) {
        alert('Client not found');
        return;
    }
    
    const clients = await getClients();
    if (!Array.isArray(clients)) {
        alert('Error loading clients');
        return;
    }
    
    const client = clients.find(c => c.id === currentClientId);
    
    if (!client) {
        alert('Client not found');
        return;
    }
    
    // Pre-fill edit form
    document.getElementById('edit-client-name').value = client.name;
    document.getElementById('edit-client-phone').value = client.phone || '';
    document.getElementById('edit-client-sex').value = client.sex || '';
    
    showScreen('edit-client-screen');
});

// Delete Client functionality
document.getElementById('delete-client-btn').addEventListener('click', async () => {
    closeAllMenuDropdowns();
    
    if (!currentClientId) {
        alert('Client not found');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated measurements.')) {
        return;
    }
    
    deleteClient(currentClientId);
    
    // Return to Clients Screen
    showScreen('clients-screen');
    await renderClientsList();
});

// Edit Client Form Submission
document.getElementById('edit-client-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentClientId) {
        alert('Client not found');
        return;
    }
    
    const name = document.getElementById('edit-client-name').value.trim();
    const phone = document.getElementById('edit-client-phone').value.trim();
    const sex = document.getElementById('edit-client-sex').value;
    
    if (!name) {
        alert('Client name is required');
        return;
    }
    
    if (!sex) {
        alert('Sex is required');
        return;
    }
    
    await updateClient(currentClientId, name, phone, sex);
    
    // Return to Client Detail View
    await showClientDetails(currentClientId, previousScreen);
});

// Back button from Edit Client screen
document.getElementById('back-from-edit-client-btn').addEventListener('click', async () => {
    if (currentClientId) {
        await showClientDetails(currentClientId, previousScreen);
    } else {
        showScreen('home-screen');
    }
});

// Business Setup Form Submission
document.getElementById('business-setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('business-name').value.trim();
    const email = document.getElementById('business-email').value.trim();
    const phone = document.getElementById('business-phone').value.trim();
    
    if (!name) {
        alert('Business name is required');
        return;
    }
    
    if (!email) {
        alert('Business email is required');
        return;
    }
    
    if (!phone) {
        alert('Business phone is required');
        return;
    }
    
    // Clear any existing business session before starting registration
    // This ensures old businesses don't override new registrations
    localStorage.removeItem(CURRENT_BUSINESS_ID_KEY);
    localStorage.removeItem(LOGOUT_STATE_KEY);
    
    // First, check if a business with these credentials already exists
    const existingBusiness = await findBusinessByCredentials(name, email, phone);
    
    if (existingBusiness) {
        // Business exists - ID is already stored in findBusinessByCredentials
        // Log them in
        loginBusiness();
        
        // Update header and show home screen
        await updateBusinessHeader();
        await updateNavbarBusinessName();
        showScreen('home-screen');
        await renderRecentMeasurements();
    } else {
        // Business doesn't exist - create new business
        // Business ID will be stored in createBusiness function
        const business = await createBusiness(name, email, phone);
        if (!business) {
            alert('Error creating business. Please check the browser console (F12) for details.');
            return;
        }
        
        // Log the user in after creating business (clears logout state)
        loginBusiness();
        
        // Update header and show home screen
        await updateBusinessHeader();
        await updateNavbarBusinessName();
        showScreen('home-screen');
        await renderRecentMeasurements();
    }
});

// Settings button click
// Settings button handler - works with both ID and class
async function handleSettingsClick() {
    // Display business info
    const business = await getBusiness();
    const infoContainer = document.getElementById('business-info-display');
    
    if (business) {
        infoContainer.innerHTML = `
            <div class="business-info-item">
                <span class="business-info-label">Name:</span>
                <span>${escapeHtml(business.name)}</span>
            </div>
            <div class="business-info-item">
                <span class="business-info-label">Email:</span>
                <span>${escapeHtml(business.email)}</span>
            </div>
            <div class="business-info-item">
                <span class="business-info-label">Phone:</span>
                <span>${escapeHtml(business.phone)}</span>
            </div>
        `;
    }
    
    showScreen('settings-screen');
}

// Add settings button listener to ID-based button
const settingsBtn = document.getElementById('settings-btn');
if (settingsBtn) {
    settingsBtn.addEventListener('click', handleSettingsClick);
}

// Add settings button listeners to all navbar settings buttons
document.querySelectorAll('.btn-settings').forEach(btn => {
    if (!btn.hasAttribute('data-listener-added')) {
        btn.setAttribute('data-listener-added', 'true');
        btn.addEventListener('click', handleSettingsClick);
    }
});

// Back from Settings
document.getElementById('back-from-settings-btn').addEventListener('click', () => {
    showScreen('home-screen');
    renderRecentMeasurements();
});

// Edit Business button click
document.getElementById('edit-business-btn').addEventListener('click', async () => {
    const business = await getBusiness();
    if (business) {
        document.getElementById('edit-business-name').value = business.name || '';
        document.getElementById('edit-business-email').value = business.email || '';
        document.getElementById('edit-business-phone').value = business.phone || '';
    }
    showScreen('edit-business-screen');
});

// Back from Edit Business
document.getElementById('back-from-edit-business-btn').addEventListener('click', () => {
    showScreen('settings-screen');
});

// Edit Business Form Submission
document.getElementById('edit-business-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('edit-business-name').value.trim();
    const email = document.getElementById('edit-business-email').value.trim();
    const phone = document.getElementById('edit-business-phone').value.trim();
    
    if (!name) {
        alert('Business name is required');
        return;
    }
    
    if (!email) {
        alert('Business email is required');
        return;
    }
    
    if (!phone) {
        alert('Business phone is required');
        return;
    }
    
    await updateBusiness(name, email, phone);
    
    // Update header
    await updateBusinessHeader();
    
    // Update the display in settings
    const infoContainer = document.getElementById('business-info-display');
    infoContainer.innerHTML = `
        <div class="business-info-item">
            <span class="business-info-label">Name:</span>
            <span>${escapeHtml(name)}</span>
        </div>
        <div class="business-info-item">
            <span class="business-info-label">Email:</span>
            <span>${escapeHtml(email)}</span>
        </div>
        <div class="business-info-item">
            <span class="business-info-label">Phone:</span>
            <span>${escapeHtml(phone)}</span>
        </div>
    `;
    
    showScreen('settings-screen');
});

// Logout button click (no data deletion)
document.getElementById('logout-btn').addEventListener('click', () => {
    if (!confirm('Are you sure you want to logout? Your data will be preserved.')) {
        return;
    }
    
    // Clear all business session data
    logoutBusiness();
    
    // Show business setup screen (registration screen) after logout
    showScreen('business-setup-screen');
});

// Business Login Form Submission
document.getElementById('business-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('login-business-name').value.trim();
    const email = document.getElementById('login-business-email').value.trim();
    const phone = document.getElementById('login-business-phone').value.trim();
    
    if (!name || !email || !phone) {
        alert('Please enter all business details');
        return;
    }
    
    // Check if credentials match
    if (await matchBusiness(name, email, phone)) {
        loginBusiness();
        await updateBusinessHeader();
        showScreen('home-screen');
        await renderRecentMeasurements();
    } else {
        alert('Business details do not match. Please check your information and try again.');
    }
});

// Reset Business button click (permanent deletion)
document.getElementById('reset-business-btn').addEventListener('click', () => {
    if (!confirm('Are you sure you want to RESET? This will permanently DELETE ALL your data including business info, clients, and measurements. This action cannot be undone.')) {
        return;
    }
    
    // Double confirmation for safety
    if (!confirm('This is your last chance! All data will be permanently deleted. Continue?')) {
        return;
    }
    
    // Reset everything
    resetBusiness();
    
    // Clear the setup form
    document.getElementById('business-setup-form').reset();
    
    // Show business setup screen
    showScreen('business-setup-screen');
});

// Add Custom Field button click - show modal
document.getElementById('add-custom-field-btn').addEventListener('click', () => {
    showAddFieldModal();
});

// Show the Add Field Modal
function showAddFieldModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'add-field-modal';
    modal.id = 'add-field-modal';
    modal.innerHTML = `
        <div class="add-field-modal-content">
            <h4>Add Measurement Field</h4>
            <div class="form-group">
                <label for="new-field-name">Field Name</label>
                <input type="text" id="new-field-name" placeholder="e.g., Ankle, Thigh, Tie" autocomplete="off">
            </div>
            <div class="form-group">
                <label for="new-field-value">Value</label>
                <input type="number" id="new-field-value" step="0.1" min="0" placeholder="Enter measurement" autocomplete="off">
            </div>
            <div class="add-field-modal-actions">
                <button type="button" class="btn btn-cancel" id="cancel-add-field-btn">Cancel</button>
                <button type="button" class="btn btn-primary" id="confirm-add-field-btn">Add</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on the name input
    setTimeout(() => {
        document.getElementById('new-field-name').focus();
    }, 100);
    
    // Cancel button
    document.getElementById('cancel-add-field-btn').addEventListener('click', () => {
        closeAddFieldModal();
    });
    
    // Add button
    document.getElementById('confirm-add-field-btn').addEventListener('click', () => {
        const fieldName = document.getElementById('new-field-name').value.trim();
        const fieldValue = document.getElementById('new-field-value').value;
        
        if (!fieldName) {
            alert('Please enter a field name');
            return;
        }
        
        addCustomFieldInline(fieldName, fieldValue);
        closeAddFieldModal();
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAddFieldModal();
        }
    });
    
    // Close on Enter key in value field
    document.getElementById('new-field-value').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('confirm-add-field-btn').click();
        }
    });
}

// Close the Add Field Modal
function closeAddFieldModal() {
    const modal = document.getElementById('add-field-modal');
    if (modal) {
        modal.remove();
    }
}

// Add a custom field inline with predefined fields (looks like native field)
function addCustomFieldInline(fieldName, fieldValue = '') {
    const container = document.getElementById('custom-fields-container');
    const fieldId = 'custom-' + Date.now().toString();
    
    // Create a form group that looks exactly like predefined fields
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group custom-field-group';
    formGroup.setAttribute('data-field-id', fieldId);
    
    // Capitalize the field name for display
    const displayName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    
    formGroup.innerHTML = `
        <label>
            <span>${escapeHtml(displayName)}</span>
            <button type="button" class="btn-remove-field" data-field-id="${fieldId}">Remove</button>
        </label>
        <input type="number" 
               class="custom-field-input" 
               data-field-name="${escapeHtml(fieldName.toLowerCase())}"
               step="0.1" 
               min="0" 
               value="${fieldValue}"
               autocomplete="off">
    `;
    
    container.appendChild(formGroup);
    
    // Add animation class for fade-in effect
    formGroup.classList.add('field-new');
    setTimeout(() => {
        formGroup.classList.remove('field-new');
    }, 150);
    
    // Add remove button listener
    formGroup.querySelector('.btn-remove-field').addEventListener('click', () => {
        formGroup.remove();
    });
    
    // Focus on the value input
    formGroup.querySelector('input').focus();
}

// Legacy function for editing measurements with existing custom fields
function addCustomFieldRow(fieldName = '', fieldValue = '') {
    if (fieldName) {
        addCustomFieldInline(fieldName, fieldValue);
    }
}

// Initialize app
function initializeApp() {
    // Hide all measurement fields on page load
    const allFields = ['shoulder', 'chest', 'waist', 'sleeve', 'length', 'neck', 'hip', 'inseam', 'thigh', 'seat'];
    allFields.forEach(field => {
        const fieldElement = document.getElementById(field);
        if (fieldElement) {
            const formGroup = fieldElement.closest('.form-group');
            if (formGroup) {
                formGroup.style.display = 'none';
            }
        }
    });
    
    // Wait for Supabase to be initialized, then initialize storage
    (async function() {
        // Wait for Supabase client to be ready (max 5 seconds)
        let attempts = 0;
        while (!window.supabaseClient && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient) {
            console.error('Supabase client failed to initialize after 5 seconds');
            alert('Error: Unable to connect to Supabase. Please check your internet connection and environment variables.');
            return;
        }
        
        // Initialize storage and show appropriate screen
        const appInitialized = await initStorage();
        if (appInitialized) {
            await updateBusinessHeader();
            await updateNavbarBusinessName();
            showScreen('home-screen');
            await renderRecentMeasurements();
            
            // Reset measurement form if business exists
            resetMeasurementForm();
        }
    })();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}


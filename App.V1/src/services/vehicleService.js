import { supabase } from '../config/supabase';

/**
 * Fetch all vehicles for a user.
 */
export async function fetchVehicles(userId) {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
    if (error) throw error;
    return data;
}

/**
 * Add a new vehicle.
 */
export async function addVehicle(vehicleData) {
    // If this is marked as default, unset other defaults first
    if (vehicleData.is_default) {
        await supabase
            .from('vehicles')
            .update({ is_default: false })
            .eq('user_id', vehicleData.user_id);
    }

    const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/**
 * Update a vehicle.
 */
export async function updateVehicle(vehicleId, userId, updates) {
    if (updates.is_default) {
        await supabase
            .from('vehicles')
            .update({ is_default: false })
            .eq('user_id', userId);
    }

    const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', vehicleId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/**
 * Delete a vehicle owned by the user.
 */
export async function deleteVehicle(vehicleId, userId) {
    if (!vehicleId || !userId) {
        throw new Error('Vehicle ID and user ID are required.');
    }

    const { error, data } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();

    if (error) throw error;
    if (!data?.id) {
        throw new Error('Vehicle not found or already deleted.');
    }
}

/**
 * Get user's default vehicle.
 */
export async function getDefaultVehicle(userId) {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
}

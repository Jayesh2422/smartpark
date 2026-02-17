import { supabase } from '../config/supabase';

/**
 * Fetch all parkings from Supabase.
 */
export async function fetchAllParkings() {
    const { data, error } = await supabase
        .from('parkings')
        .select('*')
        .order('name');
    if (error) throw error;
    return data;
}

/**
 * Fetch a single parking by ID.
 */
export async function fetchParkingById(parkingId) {
    const { data, error } = await supabase
        .from('parkings')
        .select('*')
        .eq('id', parkingId)
        .single();
    if (error) throw error;
    return data;
}

/**
 * Fetch all slots for a given parking.
 */
export async function fetchSlots(parkingId) {
    const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('parking_id', parkingId)
        .order('slot_number');
    if (error) throw error;
    return data;
}

/**
 * Update a slot's status.
 */
export async function updateSlotStatus(slotId, status) {
    const { data, error } = await supabase
        .from('slots')
        .update({ status })
        .eq('id', slotId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/**
 * Update a parking's occupied_slots count.
 */
export async function updateOccupiedSlots(parkingId, occupiedSlots) {
    const { data, error } = await supabase
        .from('parkings')
        .update({ occupied_slots: occupiedSlots })
        .eq('id', parkingId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

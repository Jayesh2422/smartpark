import { supabase } from '../config/supabase';

/**
 * Fetch all active holidays.
 */
export async function fetchAllHolidays() {
    const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('is_active', true)
        .order('date');
    if (error) throw error;
    return data;
}

/**
 * Check if a specific date is a holiday.
 */
export async function checkHoliday(dateStr) {
    const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('date', dateStr)
        .eq('is_active', true)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

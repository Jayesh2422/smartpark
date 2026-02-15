import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================
// CUSTOM PHONE AUTH - Simple & Direct
// No Twilio, No Email Confirmation, No RPC
// Test OTP code: 123456
// =============================================
const TEST_OTP = '123456';
const USER_KEY = 'smartpark_user';

function phoneToEmail(phone) {
    const digits = phone.replace(/\D/g, '');
    return `${digits}@gmail.com`;
}

/**
 * Send OTP - Fixed OTP for dev mode
 */
export async function sendOtp(phone) {
    console.log(`[DEV] OTP for ${phone}: ${TEST_OTP}`);
    return { phone };
}

/**
 * Verify OTP - Creates/finds user directly in profiles table
 */
export async function verifyOtp(phone, token) {
    if (token !== TEST_OTP) {
        throw new Error('Invalid OTP. Please enter 123456.');
    }

    const email = phoneToEmail(phone);

    // Check if user already exists
    const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (existing) {
        // User exists - sign them in
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(existing));
        return { user: existing, profile: existing };
    }

    // New user - create profile directly
    const newId = generateUUID();
    const newProfile = {
        id: newId,
        email: email,
        full_name: 'User',
        phone: phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

    if (insertError) throw insertError;

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(created));
    return { user: created, profile: created };
}

/**
 * Generate UUID fallback for React Native
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Sign out
 */
export async function signOut() {
    await AsyncStorage.removeItem(USER_KEY);
}

/**
 * Get saved user from local storage
 */
export async function getSavedUser() {
    const saved = await AsyncStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
}

/**
 * Get profile from database
 */
export async function getProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
}

/**
 * Update profile
 */
export async function updateProfile(userId, updates) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;

    // Update local storage
    const saved = await getSavedUser();
    if (saved) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify({ ...saved, ...updates }));
    }
    return data;
}

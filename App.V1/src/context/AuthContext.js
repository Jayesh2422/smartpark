import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for saved user session on startup
        checkSavedUser();
    }, []);

    const checkSavedUser = async () => {
        try {
            const savedUser = await authService.getSavedUser();
            if (savedUser) {
                setUser(savedUser);
                await loadProfile(savedUser.id);
            }
        } catch (err) {
            console.log('No saved session found');
        } finally {
            setLoading(false);
        }
    };

    const loadProfile = async (userId) => {
        try {
            const data = await authService.getProfile(userId);
            setProfile(data);
        } catch (err) {
            console.log('Profile not found yet');
        }
    };

    const sendOtp = async (phone) => {
        const data = await authService.sendOtp(phone);
        return data;
    };

    const verifyOtp = async (phone, token) => {
        const { user: authUser, profile: authProfile } = await authService.verifyOtp(phone, token);
        setUser(authUser);
        setProfile(authProfile);
        return authUser;
    };

    const signOut = async () => {
        // Clear auth state first so UI always returns to login immediately.
        setUser(null);
        setProfile(null);

        try {
            await authService.signOut();
        } catch (err) {
            console.log('Sign out cleanup error:', err?.message || err);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session: user ? { user } : null,
                loading,
                sendOtp,
                verifyOtp,
                signOut,
                loadProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

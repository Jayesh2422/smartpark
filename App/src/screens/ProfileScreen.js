import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const COLORS = {
    brown: '#6F4E37', white: '#FFFFFF', offWhite: '#F8F6F3',
    lightGray: '#E8E4E0', darkText: '#2D2016', grayText: '#8B7E74', red: '#E53935',
};

export default function ProfileScreen() {
    const { user, profile, signOut } = useAuth();

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    const items = [
        { icon: 'call-outline', label: 'Phone', value: user?.phone || '-' },
        { icon: 'person-outline', label: 'Name', value: profile?.full_name || '-' },
        { icon: 'calendar-outline', label: 'Joined', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '-' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            {/* Avatar */}
            <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(profile?.full_name || user?.phone || 'U')[0].toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.phone}</Text>
            </View>

            {/* Info Items */}
            <View style={styles.infoCard}>
                {items.map((item, idx) => (
                    <View key={idx} style={[styles.infoRow, idx < items.length - 1 && styles.infoRowBorder]}>
                        <View style={styles.infoLeft}>
                            <Ionicons name={item.icon} size={18} color={COLORS.brown} />
                            <Text style={styles.infoLabel}>{item.label}</Text>
                        </View>
                        <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                ))}
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
                <Text style={styles.appName}>SmartPark v1.0</Text>
                <Text style={styles.appDesc}>Intelligent Parking Solutions</Text>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white, padding: 20, paddingTop: 56 },
    header: { marginBottom: 24 },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.darkText },
    avatarSection: { alignItems: 'center', marginBottom: 28 },
    avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.brown, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: COLORS.brown, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.white },
    userName: { fontSize: 20, fontWeight: '700', color: COLORS.darkText },
    userEmail: { fontSize: 13, color: COLORS.grayText, marginTop: 4 },
    infoCard: { backgroundColor: COLORS.offWhite, borderRadius: 16, padding: 4, marginBottom: 24 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
    infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoLabel: { fontSize: 14, color: COLORS.darkText, fontWeight: '500' },
    infoValue: { fontSize: 13, color: COLORS.grayText, fontWeight: '500', maxWidth: '50%', textAlign: 'right' },
    appInfo: { alignItems: 'center', marginBottom: 24 },
    appName: { fontSize: 14, fontWeight: '700', color: COLORS.brown },
    appDesc: { fontSize: 12, color: COLORS.grayText, marginTop: 2 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, backgroundColor: '#FFEBEE' },
    logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.red },
});

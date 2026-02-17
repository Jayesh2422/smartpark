import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
    Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const COLORS = {
    brown: '#6F4E37', lightBrown: '#A67B5B', white: '#FFFFFF',
    offWhite: '#F8F6F3', lightGray: '#E8E4E0', darkText: '#2D2016',
    grayText: '#8B7E74',
};

export default function LoginScreen({ navigation }) {
    const { sendOtp } = useAuth();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const formatPhone = (text) => {
        // Remove non-digits
        const digits = text.replace(/\D/g, '');
        setPhone(digits);
    };

    const getFullPhone = () => {
        // Add India country code if not present
        if (phone.startsWith('91') && phone.length === 12) return '+' + phone;
        if (phone.length === 10) return '+91' + phone;
        return '+' + phone;
    };

    const handleSendOtp = async () => {
        if (phone.length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
            return;
        }
        setLoading(true);
        try {
            await sendOtp(getFullPhone());
            navigation.navigate('OtpVerify', { phone: getFullPhone() });
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={styles.logoBox}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="car-sport" size={36} color={COLORS.white} />
                    </View>
                    <Text style={styles.brandName}>SmartPark</Text>
                    <Text style={styles.tagline}>Intelligent Parking Solutions</Text>
                </View>

                {/* Welcome */}
                <View style={styles.form}>
                    <Text style={styles.heading}>Welcome</Text>
                    <Text style={styles.subheading}>Enter your phone number to continue</Text>

                    {/* Phone Input */}
                    <View style={styles.phoneRow}>
                        <View style={styles.countryCode}>
                            <Text style={styles.flag}>🇮🇳</Text>
                            <Text style={styles.codeText}>+91</Text>
                        </View>
                        <TextInput
                            style={styles.phoneInput}
                            placeholder="Enter phone number"
                            placeholderTextColor={COLORS.grayText}
                            value={phone}
                            onChangeText={formatPhone}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>

                    {/* Send OTP Button */}
                    <TouchableOpacity
                        style={[styles.btn, phone.length < 10 && styles.btnDisabled]}
                        onPress={handleSendOtp}
                        disabled={loading || phone.length < 10}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.btnText}>Send OTP</Text>
                        )}
                    </TouchableOpacity>

                    {/* Info */}
                    <View style={styles.infoRow}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.grayText} />
                        <Text style={styles.infoText}>We'll send a 6-digit code to verify your number</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    logoBox: { alignItems: 'center', marginBottom: 40 },
    logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.brown, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: COLORS.brown, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    brandName: { fontSize: 26, fontWeight: '800', color: COLORS.darkText },
    tagline: { fontSize: 13, color: COLORS.grayText, marginTop: 4 },
    form: { width: '100%' },
    heading: { fontSize: 22, fontWeight: '800', color: COLORS.darkText },
    subheading: { fontSize: 14, color: COLORS.grayText, marginTop: 6, marginBottom: 24 },
    phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    countryCode: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.offWhite, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.lightGray },
    flag: { fontSize: 18 },
    codeText: { fontSize: 15, fontWeight: '600', color: COLORS.darkText },
    phoneInput: { flex: 1, backgroundColor: COLORS.offWhite, borderRadius: 14, padding: 16, fontSize: 16, color: COLORS.darkText, borderWidth: 1, borderColor: COLORS.lightGray, letterSpacing: 1 },
    btn: { backgroundColor: COLORS.brown, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: COLORS.brown, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
    infoText: { fontSize: 12, color: COLORS.grayText },
});

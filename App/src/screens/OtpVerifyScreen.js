import React, { useState, useRef } from 'react';
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
    grayText: '#8B7E74', green: '#4CAF50',
};

const OTP_LENGTH = 6;

export default function OtpVerifyScreen({ route, navigation }) {
    const { phone } = route.params;
    const { verifyOtp, sendOtp } = useAuth();
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);

    const handleChange = (text, index) => {
        const digit = text.replace(/\D/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < OTP_LENGTH) {
            Alert.alert('Invalid OTP', 'Please enter the full 6-digit code.');
            return;
        }
        setLoading(true);
        try {
            await verifyOtp(phone, code);
            // Auth state change in AuthContext will handle navigation
        } catch (err) {
            Alert.alert('Verification Failed', err.message || 'Invalid OTP. Please try again.');
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await sendOtp(phone);
            Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to resend OTP.');
        } finally {
            setResending(false);
        }
    };

    const maskedPhone = phone.slice(0, -4).replace(/./g, '•') + phone.slice(-4);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Back Button */}
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="chatbubble-ellipses" size={32} color={COLORS.white} />
                    </View>
                    <Text style={styles.heading}>Verify OTP</Text>
                    <Text style={styles.subheading}>Enter the 6-digit code sent to</Text>
                    <Text style={styles.phoneText}>{maskedPhone}</Text>
                </View>

                {/* OTP Input */}
                <View style={styles.otpRow}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                            value={digit}
                            onChangeText={(text) => handleChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                    style={[styles.btn, otp.join('').length < OTP_LENGTH && styles.btnDisabled]}
                    onPress={handleVerify}
                    disabled={loading || otp.join('').length < OTP_LENGTH}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.btnText}>Verify & Continue</Text>
                    )}
                </TouchableOpacity>

                {/* Resend */}
                <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={resending}>
                    {resending ? (
                        <ActivityIndicator size="small" color={COLORS.brown} />
                    ) : (
                        <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendLink}>Resend OTP</Text></Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    scroll: { flexGrow: 1, padding: 24, paddingTop: 56 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.offWhite, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    header: { alignItems: 'center', marginBottom: 36 },
    iconCircle: { width: 64, height: 64, borderRadius: 18, backgroundColor: COLORS.brown, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heading: { fontSize: 22, fontWeight: '800', color: COLORS.darkText },
    subheading: { fontSize: 14, color: COLORS.grayText, marginTop: 8 },
    phoneText: { fontSize: 15, fontWeight: '600', color: COLORS.darkText, marginTop: 4, letterSpacing: 1 },
    otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 },
    otpBox: { width: 48, height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.lightGray, backgroundColor: COLORS.offWhite, textAlign: 'center', fontSize: 22, fontWeight: '700', color: COLORS.darkText },
    otpBoxFilled: { borderColor: COLORS.brown, backgroundColor: COLORS.white },
    btn: { backgroundColor: COLORS.brown, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: COLORS.brown, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    resendBtn: { alignItems: 'center', marginTop: 20 },
    resendText: { fontSize: 13, color: COLORS.grayText },
    resendLink: { color: COLORS.brown, fontWeight: '700' },
});

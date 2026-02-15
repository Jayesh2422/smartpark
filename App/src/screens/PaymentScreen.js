import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { completeBooking } from '../services/bookingService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

export default function PaymentScreen({ route, navigation }) {
    const { booking, amount } = route.params || {};
    const [processing, setProcessing] = useState(false);

    const paymentMethods = [
        { id: 'upi', name: 'UPI', icon: 'qr-code', description: 'PhonePe, GPay, Paytm' },
        { id: 'card', name: 'Card', icon: 'card', description: 'Credit/Debit Card' },
        { id: 'wallet', name: 'Wallet', icon: 'wallet', description: 'Digital Wallets' },
        { id: 'netbanking', name: 'Net Banking', icon: 'business', description: 'All Banks' },
    ];

    const handlePayment = async (method) => {
        if (!booking) {
            Alert.alert('Error', 'No booking found.');
            return;
        }

        setProcessing(true);
        try {
            const { markAsPaid, completeBooking } = require('../services/bookingService');

            if (booking.multiple && booking.bookings) {
                // If multiple bookings were paid at once
                const activeIds = booking.bookings.filter(b => !b.isFreed).map(b => b.id);
                const historyIds = booking.bookings.filter(b => b.isFreed).map(b => b.id);

                // Complete non-freed bookings
                for (const id of activeIds) {
                    await completeBooking(id);
                }

                // Mark freed bookings as paid in history
                await markAsPaid(historyIds);
            } else {
                // Single booking
                if (booking.isFreed) {
                    await markAsPaid([booking.id]);
                } else {
                    await completeBooking(booking.id);
                }
            }

            Alert.alert(
                'Payment Successful! 🎉',
                `Paid ₹${amount} via ${method.name}.\n\nYour ${booking.multiple ? 'parking sessions have' : 'parking session has'} been completed.`,
                [{ text: 'Done', onPress: () => navigation.popToTop() }]
            );
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Error', error.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Amount Card */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Amount to Pay</Text>
                    <Text style={styles.amountValue}>₹{amount || 0}</Text>
                    {booking && (
                        <View style={styles.bookingInfo}>
                            <Text style={styles.amountDetails}>
                                {booking.parkingName} • Slot {booking.slotNumber}
                            </Text>
                            {booking.vehicleName && (
                                <Text style={styles.amountDetails}>
                                    {booking.vehicleName} ({booking.vehicleNumber})
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Payment Methods */}
                <Text style={styles.sectionTitle}>Select Payment Method</Text>

                {paymentMethods.map((method) => (
                    <TouchableOpacity
                        key={method.id}
                        style={styles.methodCard}
                        onPress={() => handlePayment(method)}
                        disabled={processing}
                    >
                        <View style={styles.methodIcon}>
                            <Ionicons name={method.icon} size={24} color={COLORS.accent} />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={styles.methodName}>{method.name}</Text>
                            <Text style={styles.methodDescription}>{method.description}</Text>
                        </View>
                        {processing ? (
                            <ActivityIndicator size="small" color={COLORS.accent} />
                        ) : (
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        )}
                    </TouchableOpacity>
                ))}

                {/* Info */}
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                    <Text style={styles.infoText}>
                        Your payment is secure and encrypted. Slot will be freed after payment.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: 56,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        fontWeight: '700',
        color: COLORS.text,
    },
    content: {
        padding: SPACING.lg,
    },
    amountCard: {
        backgroundColor: COLORS.accent,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    amountLabel: {
        ...TYPOGRAPHY.body,
        color: COLORS.primary,
        opacity: 0.9,
        marginBottom: SPACING.xs,
    },
    amountValue: {
        fontSize: 40,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: SPACING.xs,
    },
    bookingInfo: {
        alignItems: 'center',
        gap: 4,
    },
    amountDetails: {
        ...TYPOGRAPHY.caption,
        color: COLORS.primary,
        opacity: 0.8,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h4,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        ...TYPOGRAPHY.title,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    methodDescription: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginTop: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoText: {
        flex: 1,
        ...TYPOGRAPHY.caption,
        color: COLORS.text,
        lineHeight: 18,
    },
});

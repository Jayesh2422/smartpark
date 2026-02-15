import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

/**
 * Animated Price Breakdown Component
 * Shows base price, multipliers, and total with counting animation
 */
export default function PriceBreakdown({ breakdown, finalPrice }) {
    const animatedPrice = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animatedPrice, {
            toValue: finalPrice,
            tension: 40,
            friction: 7,
            useNativeDriver: false,
        }).start();
    }, [finalPrice]);

    const renderBreakdownItem = (label, value, icon, isPositive = true) => {
        if (!value || value === 1) return null;

        return (
            <View style={styles.breakdownItem}>
                <View style={styles.breakdownLeft}>
                    {icon && <Ionicons name={icon} size={14} color={COLORS.textSecondary} />}
                    <Text style={styles.breakdownLabel}>{label}</Text>
                </View>
                <Text style={[
                    styles.breakdownValue,
                    !isPositive && { color: COLORS.success }
                ]}>
                    {value > 1 ? `×${value.toFixed(2)}` : value.toFixed(2)}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="receipt-outline" size={20} color={COLORS.accent} />
                <Text style={styles.title}>Price Breakdown</Text>
            </View>

            {/* Base Price */}
            <View style={styles.breakdownItem}>
                <View style={styles.breakdownLeft}>
                    <Ionicons name="pricetag-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.breakdownLabel}>Base Price</Text>
                </View>
                <Text style={styles.breakdownValue}>
                    ₹{breakdown?.basePrice?.toFixed(2) || '0.00'}
                </Text>
            </View>

            {/* Multipliers */}
            {breakdown?.holidayMultiplier && renderBreakdownItem(
                'Holiday Surge',
                breakdown.holidayMultiplier,
                'calendar',
                true
            )}
            {breakdown?.weekendMultiplier && renderBreakdownItem(
                'Weekend Surge',
                breakdown.weekendMultiplier,
                'sunny',
                true
            )}
            {breakdown?.occupancyMultiplier && renderBreakdownItem(
                'High Demand',
                breakdown.occupancyMultiplier,
                'trending-up',
                true
            )}
            {breakdown?.distanceDiscount && renderBreakdownItem(
                'Distance Discount',
                breakdown.distanceDiscount,
                'location',
                false
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Total */}
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Price</Text>
                <View style={styles.totalPriceContainer}>
                    <Text style={styles.totalPrice}>
                        ₹{Math.round(finalPrice)}
                    </Text>
                    <Text style={styles.totalUnit}>/hr</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginVertical: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    title: {
        ...TYPOGRAPHY.title,
        fontWeight: '700',
        color: COLORS.text,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    breakdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    breakdownLabel: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    },
    breakdownValue: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.sm,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.sm,
    },
    totalLabel: {
        ...TYPOGRAPHY.h4,
        fontWeight: '700',
        color: COLORS.text,
    },
    totalPriceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    totalPrice: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.accent,
    },
    totalUnit: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
});

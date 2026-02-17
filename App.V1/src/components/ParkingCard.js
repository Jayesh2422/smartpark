import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export default function ParkingCard({ parking, onPress }) {
    const available = Math.max(0, (parking.total_slots || 0) - (parking.occupied_slots || 0));
    const occupancyPercent = parking.total_slots > 0
        ? Math.round((parking.occupied_slots / parking.total_slots) * 100)
        : 0;

    const getAvailabilityColor = () => {
        if (available === 0) return '#E53935';
        if (occupancyPercent > 80) return '#F9A825';
        return '#4CAF50';
    };

    const getBadgeStyle = (tag) => {
        switch (tag) {
            case 'Best Overall':
                return { bg: COLORS.accent, text: COLORS.primary, icon: '⭐' };
            case 'Cheapest':
                return { bg: '#E8F5E9', text: '#2E7D32', icon: '💰' };
            case 'Closest':
                return { bg: '#FFF3E0', text: '#E65100', icon: '🚶' };
            case 'Holiday Surge':
                return { bg: '#FCE4EC', text: '#C2185B', icon: '⚠️' };
            default:
                return { bg: COLORS.background, text: COLORS.text, icon: '' };
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            {/* Badges */}
            {parking.tags && parking.tags.length > 0 && (
                <View style={styles.badgesRow}>
                    {parking.tags.map((tag, idx) => {
                        const badgeStyle = getBadgeStyle(tag);
                        return (
                            <View
                                key={idx}
                                style={[styles.badge, { backgroundColor: badgeStyle.bg }]}
                            >
                                <Text style={styles.badgeIcon}>{badgeStyle.icon}</Text>
                                <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
                                    {tag}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="car" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.name} numberOfLines={1}>{parking.name}</Text>
                    {parking.address && (
                        <Text style={styles.address} numberOfLines={1}>{parking.address}</Text>
                    )}
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                {/* Distance */}
                {parking.distance !== undefined && (
                    <View style={styles.stat}>
                        <Ionicons name="navigate-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.statText}>{parking.distance.toFixed(1)} km</Text>
                    </View>
                )}

                {/* Available Slots */}
                <View style={styles.stat}>
                    <View style={[styles.availDot, { backgroundColor: getAvailabilityColor() }]} />
                    <Text style={[styles.statText, { color: getAvailabilityColor(), fontWeight: '600' }]}>
                        {available} slots
                    </Text>
                </View>

                {/* Spacer */}
                <View style={{ flex: 1 }} />

                {/* Dynamic Price */}
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>
                        ₹{parking.dynamicPrice ? Math.round(parking.dynamicPrice) : parking.base_price}
                    </Text>
                    <Text style={styles.priceUnit}>/hr</Text>
                </View>
            </View>

            {/* Occupancy Bar */}
            <View style={styles.occupancyBar}>
                <View style={[styles.occupancyFill, {
                    width: `${occupancyPercent}%`,
                    backgroundColor: getAvailabilityColor(),
                }]} />
            </View>
            <Text style={styles.occupancyText}>{occupancyPercent}% occupied</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: SPACING.sm,
        gap: SPACING.xs,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.full,
        gap: 4,
    },
    badgeIcon: {
        fontSize: 10,
    },
    badgeText: {
        ...TYPOGRAPHY.small,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    headerInfo: {
        flex: 1,
    },
    name: {
        ...TYPOGRAPHY.title,
        fontWeight: '700',
        color: COLORS.text,
    },
    address: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        gap: SPACING.md,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceText: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.accent,
    },
    priceUnit: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginLeft: 2,
    },
    availDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    occupancyBar: {
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: RADIUS.sm,
        overflow: 'hidden',
    },
    occupancyFill: {
        height: '100%',
        borderRadius: RADIUS.sm,
    },
    occupancyText: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'right',
    },
});

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

/**
 * Modern Filter Chip (Pill Toggle)
 * Used for filters like "EV Charging", "Cheapest", "Closest", "Covered"
 */
export default function FilterChip({ label, selected, onPress, icon }) {
    return (
        <TouchableOpacity
            style={[
                styles.chip,
                selected && styles.chipSelected,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={[
                styles.label,
                selected && styles.labelSelected,
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        marginRight: SPACING.sm,
        gap: 6,
    },
    chipSelected: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
        ...SHADOWS.sm,
    },
    icon: {
        fontSize: 14,
    },
    label: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        color: COLORS.text,
    },
    labelSelected: {
        color: COLORS.primary,
        fontWeight: '700',
    },
});

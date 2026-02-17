import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

/**
 * Modern Segmented Toggle Control
 * Used for radius selector (1km, 3km, 5km)
 */
export default function ToggleSegment({ options, selected, onSelect }) {
    return (
        <View style={styles.container}>
            {options.map((option, index) => {
                const isSelected = selected === option.value;
                const isFirst = index === 0;
                const isLast = index === options.length - 1;

                return (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.option,
                            isSelected && styles.optionSelected,
                            isFirst && styles.optionFirst,
                            isLast && styles.optionLast,
                        ]}
                        onPress={() => onSelect(option.value)}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    option: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.md,
    },
    optionSelected: {
        backgroundColor: COLORS.accent,
        ...SHADOWS.sm,
    },
    optionFirst: {
        marginRight: 2,
    },
    optionLast: {
        marginLeft: 2,
    },
    optionText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text,
        fontWeight: '600',
    },
    optionTextSelected: {
        color: COLORS.primary,
        fontWeight: '700',
    },
});

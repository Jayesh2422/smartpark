import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    brown: '#6F4E37',
    white: '#FFFFFF',
    green: '#4CAF50',
    darkText: '#2D2016',
    grayText: '#8B7E74',
};

export default function AlternativeSuggestion({ alternative, onPress }) {
    if (!alternative) return null;

    const available = Math.max(0, (alternative.total_slots || 0) - (alternative.occupied_slots || 0));

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <Ionicons name="bulb-outline" size={18} color={COLORS.brown} />
                <Text style={styles.title}>Better Alternative Found</Text>
            </View>
            <Text style={styles.name}>{alternative.name}</Text>
            <Text style={styles.explanation}>{alternative.explanation}</Text>
            <View style={styles.statsRow}>
                <Text style={styles.stat}>
                    📍 {alternative.distance?.toFixed(1)} km
                </Text>
                <Text style={styles.stat}>
                    💰 ₹{Math.round(alternative.dynamicPrice || alternative.base_price)}/hr
                </Text>
                <Text style={styles.stat}>
                    🅿️ {available} slots
                </Text>
            </View>
            <View style={styles.ctaRow}>
                <Text style={styles.ctaText}>View Details</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.brown} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F1EDE8',
        borderRadius: 14,
        padding: 14,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#D7CFC6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.brown,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.darkText,
        marginBottom: 4,
    },
    explanation: {
        fontSize: 13,
        color: COLORS.grayText,
        lineHeight: 18,
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    stat: {
        fontSize: 12,
        color: COLORS.darkText,
        fontWeight: '500',
    },
    ctaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-end',
    },
    ctaText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.brown,
    },
});

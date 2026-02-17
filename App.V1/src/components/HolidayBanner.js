import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HolidayBanner({ holidayName, multiplier }) {
    if (!holidayName) return null;

    return (
        <View style={styles.banner}>
            <View style={styles.iconRow}>
                <Ionicons name="alert-circle" size={20} color="#F57F17" />
                <Text style={styles.title}>Holiday Alert</Text>
            </View>
            <Text style={styles.message}>
                {holidayName} — Due to high demand, prices may be {Math.round((multiplier - 1) * 100)}% higher than usual.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: '#FFF8E1',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FFE082',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F57F17',
    },
    message: {
        fontSize: 12,
        color: '#795548',
        lineHeight: 18,
    },
});

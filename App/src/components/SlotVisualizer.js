import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    brown: '#6F4E37',
    lightBrown: '#A67B5B',
    white: '#FFFFFF',
    offWhite: '#F8F6F3',
    darkText: '#2D2016',
    grayText: '#8B7E74',
    green: '#4CAF50',
};

export default function SlotVisualizer({ slot }) {
    if (!slot) return null;

    const getSizeIcon = (size) => {
        switch (size) {
            case 'bike': return 'bicycle';
            case 'suv': return 'bus';
            default: return 'car-sport';
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Assigned Slot</Text>
            <View style={styles.slotCard}>
                <View style={styles.slotIcon}>
                    <Ionicons name={getSizeIcon(slot.size)} size={28} color={COLORS.white} />
                </View>
                <View style={styles.slotDetails}>
                    <Text style={styles.slotNumber}>{slot.slot_number}</Text>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Ionicons name="layers-outline" size={14} color={COLORS.grayText} />
                            <Text style={styles.detailText}>
                                Floor {slot.floor === 0 ? 'G' : slot.floor}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="walk-outline" size={14} color={COLORS.grayText} />
                            <Text style={styles.detailText}>
                                {slot.distance_from_entrance}m from entrance
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="resize-outline" size={14} color={COLORS.grayText} />
                            <Text style={styles.detailText}>
                                {slot.size.charAt(0).toUpperCase() + slot.size.slice(1)} slot
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
            {slot.score !== undefined && (
                <Text style={styles.matchText}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />{' '}
                    Best match for your vehicle (score: {slot.score})
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.darkText,
        marginBottom: 10,
    },
    slotCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.offWhite,
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderColor: '#E0D9D1',
    },
    slotIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: COLORS.brown,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slotDetails: {
        flex: 1,
    },
    slotNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.darkText,
        marginBottom: 6,
    },
    detailsGrid: {
        gap: 4,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        color: COLORS.grayText,
    },
    matchText: {
        fontSize: 12,
        color: COLORS.green,
        marginTop: 8,
        fontWeight: '500',
    },
});

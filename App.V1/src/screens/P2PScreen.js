import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function P2PScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Peer-to-Peer Parking</Text>
                <Text style={styles.subtitle}>Rent from local owners or list your own parking spot.</Text>

                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => navigation.navigate('RentParking')}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconWrap}>
                        <Ionicons name="car-outline" size={26} color={COLORS.accent} />
                    </View>
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Rent Parking</Text>
                        <Text style={styles.optionText}>
                            Browse available P2P listings, choose duration, and confirm instantly.
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => navigation.navigate('AddParking')}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconWrap}>
                        <Ionicons name="add-circle-outline" size={26} color={COLORS.accent} />
                    </View>
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Add Parking for Rent</Text>
                        <Text style={styles.optionText}>
                            Create a listing with location, pricing, and compatible vehicle size.
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => navigation.navigate('MyListings')}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconWrap}>
                        <Ionicons name="document-text-outline" size={26} color={COLORS.accent} />
                    </View>
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>My Listings</Text>
                        <Text style={styles.optionText}>
                            Check your listed spots and edit details any time.
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => navigation.navigate('MyP2PBookings')}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconWrap}>
                        <Ionicons name="receipt-outline" size={26} color={COLORS.accent} />
                    </View>
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Current Bookings</Text>
                        <Text style={styles.optionText}>
                            Manage your active P2P rentals, free slots, and complete payment.
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: 56,
        paddingBottom: 88,
    },
    title: {
        ...TYPOGRAPHY.h2,
        fontWeight: '800',
        color: COLORS.text,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        marginTop: 6,
        marginBottom: 22,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        gap: 12,
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0E8E2',
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        ...TYPOGRAPHY.title,
        color: COLORS.text,
        fontWeight: '700',
        marginBottom: 4,
    },
    optionText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        lineHeight: 17,
    },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchSlots, fetchParkingById } from '../services/parkingService';
import { fetchAllHolidays } from '../services/holidayService';
import {
    getUserBookingsForEstimation,
    getParkingBookingsForEstimation,
} from '../services/bookingService';
import { calculateDynamicPrice, isWeekendDay } from '../utils/calculateDynamicPrice';
import { getHolidayMultiplier } from '../utils/getHolidayMultiplier';
import { getBestAlternative } from '../utils/calculateParkingScore';
import { estimateUserDuration } from '../utils/estimateUserDuration';
import PriceBreakdown from '../components/PriceBreakdown';
import HolidayBanner from '../components/HolidayBanner';
import AlternativeSuggestion from '../components/AlternativeSuggestion';
import { COLORS } from '../constants/theme';

export default function ParkingDetailScreen({ route, navigation }) {
    const { parking: initialParking, holidays: routeHolidays } = route.params;
    const { user } = useAuth();

    const [parking, setParking] = useState(initialParking);
    const [slots, setSlots] = useState([]);
    const [holidays, setHolidays] = useState(routeHolidays || []);
    const [durationEstimate, setDurationEstimate] = useState(null);
    const [loading, setLoading] = useState(true);

    const available = Math.max(0, parking.total_slots - parking.occupied_slots);
    const occupancyPercent = parking.total_slots > 0
        ? Math.round((parking.occupied_slots / parking.total_slots) * 100) : 0;

    // Holiday check
    const today = new Date();
    const { isHoliday, holidayName, multiplier: holidayMult } = getHolidayMultiplier(today, holidays);
    const weekend = isWeekendDay(today);

    // Dynamic pricing for 1 hour
    const pricing = calculateDynamicPrice({
        basePrice: parking.base_price,
        durationHours: 1,
        holidayMultiplier: holidayMult,
        isWeekend: weekend,
        occupiedSlots: parking.occupied_slots,
        totalSlots: parking.total_slots,
    });

    // Refresh data every time screen comes into focus
    useFocusEffect(useCallback(() => {
        loadDetails();
    }, [parking.id]));

    const loadDetails = async () => {
        try {
            const [freshParking, slotData, userBookings, parkingBookings] = await Promise.all([
                fetchParkingById(parking.id),
                fetchSlots(parking.id),
                user?.id ? getUserBookingsForEstimation(user.id) : [],
                getParkingBookingsForEstimation(parking.id),
            ]);

            if (freshParking) setParking(freshParking);
            setSlots(slotData || []);

            // Duration estimation
            const estimate = estimateUserDuration(userBookings, parkingBookings, parking.id);
            setDurationEstimate(estimate);

            if (!routeHolidays) {
                const h = await fetchAllHolidays();
                setHolidays(h || []);
            }
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const slotCounts = {
        bike: slots.filter((s) => s.size === 'bike' && s.status === 'available').length,
        car: slots.filter((s) => s.size === 'car' && s.status === 'available').length,
        suv: slots.filter((s) => s.size === 'suv' && s.status === 'available').length,
    };

    // Calculate actual availability from slots array (more accurate than parking.occupied_slots)
    const actualAvailable = slots.filter(s => s.status === 'available').length;
    const actualOccupied = slots.filter(s => s.status === 'occupied').length;
    const totalSlots = slots.length || parking.total_slots;
    const actualOccupancyPercent = totalSlots > 0 ? Math.round((actualOccupied / totalSlots) * 100) : 0;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color={COLORS.darkText} />
            </TouchableOpacity>

            {/* Parking Name */}
            <View style={styles.headerSection}>
                <View style={styles.nameRow}>
                    <View style={styles.iconBox}>
                        <Ionicons name="car" size={24} color={COLORS.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.parkingName}>{parking.name}</Text>
                        {parking.address && (
                            <Text style={styles.address}>{parking.address}</Text>
                        )}
                    </View>
                </View>

                {/* Distance + Tags */}
                <View style={styles.metaRow}>
                    {parking.distance !== undefined && (
                        <View style={styles.metaChip}>
                            <Ionicons name="navigate" size={12} color={COLORS.brown} />
                            <Text style={styles.metaText}>{parking.distance.toFixed(1)} km away</Text>
                        </View>
                    )}
                    {parking.tags?.map((tag, i) => (
                        <View key={i} style={[styles.metaChip, styles.tagChip]}>
                            <Text style={styles.tagChipText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Holiday Banner */}
            {isHoliday && (
                <HolidayBanner holidayName={holidayName} multiplier={holidayMult} />
            )}

            {/* Smart Duration Estimate */}
            {durationEstimate && (
                <View style={styles.durationCard}>
                    <Ionicons name="bulb" size={18} color={COLORS.brown} />
                    <Text style={styles.durationText}>{durationEstimate.message}</Text>
                </View>
            )}

            {/* Availability Stats */}
            <View style={styles.statsCard}>
                <Text style={styles.cardTitle}>Availability</Text>
                <View style={styles.occupancyBar}>
                    <View
                        style={[
                            styles.occupancyFill,
                            {
                                width: `${actualOccupancyPercent}%`,
                                backgroundColor:
                                    actualOccupancyPercent > 80 ? COLORS.red :
                                        actualOccupancyPercent > 50 ? '#FFA726' : COLORS.green,
                            },
                        ]}
                    />
                </View>
                <Text style={styles.occupancyLabel}>
                    {actualAvailable} of {totalSlots} slots available ({actualOccupancyPercent}% occupied)
                </Text>

                {/* Slot type breakdown */}
                {!loading && (
                    <View style={styles.slotTypesRow}>
                        <View style={styles.slotType}>
                            <Ionicons name="bicycle" size={18} color={COLORS.brown} />
                            <Text style={styles.slotTypeCount}>{slotCounts.bike}</Text>
                            <Text style={styles.slotTypeLabel}>Bike</Text>
                        </View>
                        <View style={styles.slotType}>
                            <Ionicons name="car-sport" size={18} color={COLORS.brown} />
                            <Text style={styles.slotTypeCount}>{slotCounts.car}</Text>
                            <Text style={styles.slotTypeLabel}>Car</Text>
                        </View>
                        <View style={styles.slotType}>
                            <Ionicons name="bus" size={18} color={COLORS.brown} />
                            <Text style={styles.slotTypeCount}>{slotCounts.suv}</Text>
                            <Text style={styles.slotTypeLabel}>SUV</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Price Breakdown */}
            <PriceBreakdown breakdown={pricing.breakdown} finalPrice={pricing.finalPrice} />

            {/* Book Button */}
            <TouchableOpacity
                style={[styles.bookButton, available === 0 && styles.bookButtonDisabled]}
                onPress={() => {
                    if (available > 0) {
                        navigation.navigate('Booking', {
                            parking,
                            slots,
                            holidays,
                            durationEstimate,
                        });
                    }
                }}
                disabled={available === 0}
            >
                <Ionicons name="flash" size={20} color={COLORS.white} />
                <Text style={styles.bookButtonText}>
                    {available > 0 ? 'Book Now' : 'No Slots Available'}
                </Text>
            </TouchableOpacity>

            {loading && <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.brown} />}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    content: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 56,
        paddingBottom: 80,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.offWhite,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    headerSection: {
        marginBottom: 16,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 12,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: COLORS.brown,
        alignItems: 'center',
        justifyContent: 'center',
    },
    parkingName: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.darkText,
        letterSpacing: -0.3,
    },
    address: {
        fontSize: 13,
        color: COLORS.grayText,
        marginTop: 2,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.offWhite,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.darkText,
        fontWeight: '500',
    },
    tagChip: {
        backgroundColor: COLORS.brown,
    },
    tagChipText: {
        fontSize: 11,
        color: COLORS.white,
        fontWeight: '600',
    },
    durationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F5F0EB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    durationText: {
        fontSize: 13,
        color: COLORS.darkText,
        fontWeight: '500',
        flex: 1,
    },
    statsCard: {
        backgroundColor: COLORS.offWhite,
        borderRadius: 14,
        padding: 16,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.darkText,
        marginBottom: 10,
    },
    occupancyBar: {
        height: 8,
        backgroundColor: COLORS.lightGray,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    occupancyFill: {
        height: '100%',
        borderRadius: 4,
    },
    occupancyLabel: {
        fontSize: 12,
        color: COLORS.grayText,
        marginBottom: 12,
    },
    slotTypesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    slotType: {
        alignItems: 'center',
        gap: 4,
    },
    slotTypeCount: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.darkText,
    },
    slotTypeLabel: {
        fontSize: 11,
        color: COLORS.grayText,
    },
    bookButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.brown,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        shadowColor: COLORS.brown,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    bookButtonDisabled: {
        backgroundColor: COLORS.lightGray,
        shadowOpacity: 0,
        elevation: 0,
    },
    bookButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});

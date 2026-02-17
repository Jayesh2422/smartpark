import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { fetchAllHolidays } from '../services/holidayService';
import { getActiveBookings, getUserAverageBookingDuration } from '../services/bookingService';
import { calculateDynamicPrice, isWeekendDay } from '../utils/calculateDynamicPrice';
import { getHolidayMultiplier } from '../utils/getHolidayMultiplier';
import ParkingCard from '../components/ParkingCard';
import HolidayBanner from '../components/HolidayBanner';
import { COLORS } from '../constants/theme';

// Mock Parking11 data for showcase
const MOCK_PARKING = {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Parking11',
    address: 'Connaught Place, New Delhi, Delhi 110001',
    lat: 28.6315,
    lng: 77.2167,
    base_price: 30,
    total_slots: 25,
    occupied_slots: 0,
    distance: 2.3,
    image_url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800',
};



export default function HomeScreen({ navigation }) {
    const { user, profile } = useAuth();
    const [holidays, setHolidays] = useState([]);
    const [activeBookings, setActiveBookings] = useState([]);
    const [todayHoliday, setTodayHoliday] = useState(null);
    const [averageDuration, setAverageDuration] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const holidayData = await fetchAllHolidays();
            setHolidays(holidayData || []);

            // Check today for holiday
            const today = new Date();
            const { isHoliday, holidayName, multiplier } = getHolidayMultiplier(today, holidayData);
            if (isHoliday) {
                setTodayHoliday({ name: holidayName, multiplier });
            }

            // Load active bookings and analytics
            if (user?.id) {
                try {
                    const [bookings, avg] = await Promise.all([
                        getActiveBookings(user.id),
                        getUserAverageBookingDuration(user.id)
                    ]);
                    setActiveBookings(bookings || []);
                    setAverageDuration(avg || 0);
                } catch (err) {
                    console.log('Home data load error:', err);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    // Calculate dynamic price for Parking11
    const today = new Date();
    const { multiplier: holidayMult } = getHolidayMultiplier(today, holidays);
    const weekend = isWeekendDay(today);

    const pricing = calculateDynamicPrice({
        basePrice: MOCK_PARKING.base_price,
        durationHours: 1,
        holidayMultiplier: holidayMult,
        isWeekend: weekend,
        occupiedSlots: MOCK_PARKING.occupied_slots,
        totalSlots: MOCK_PARKING.total_slots,
    });

    const parkingWithPricing = {
        ...MOCK_PARKING,
        dynamicPrice: pricing.pricePerHour,
        pricing,
        tags: ['Best Overall', 'Closest'],
    };

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting */}
                <View style={styles.greetingRow}>
                    <View>
                        <Text style={styles.greeting}>{greeting()}</Text>
                        <Text style={styles.userName}>
                            {profile?.full_name || user?.email?.split('@')[0] || 'Driver'}
                        </Text>
                    </View>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Active Booking Banner */}
                {activeBookings.length > 0 && (
                    <View style={styles.activeBookingBanner}>
                        <Ionicons name="time" size={18} color={COLORS.primary} />
                        <Text style={styles.activeBannerText}>
                            Active: {activeBookings[0].parkings?.name || 'Parking'}
                        </Text>
                    </View>
                )}

                {/* Holiday Banner */}
                {todayHoliday && (
                    <HolidayBanner
                        holidayName={todayHoliday.name}
                        multiplier={todayHoliday.multiplier}
                    />
                )}

                {/* Featured Parking Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Featured Parking</Text>
                    <Text style={styles.sectionSubtitle}>Showcase all features</Text>
                </View>

                {/* Parking11 Card with Analytics */}
                <ParkingCard
                    parking={parkingWithPricing}
                    onPress={() => navigation.navigate('ParkingDetail', {
                        parking: parkingWithPricing,
                        holidays
                    })}
                />

                {averageDuration > 0 && (
                    <View style={styles.analyticsCard}>
                        <View style={styles.analyticsIcon}>
                            <Ionicons name="analytics" size={20} color={COLORS.accent} />
                        </View>
                        <View>
                            <Text style={styles.analyticsLabel}>Your Average Parking Time</Text>
                            <Text style={styles.analyticsValue}>
                                {averageDuration >= 60
                                    ? `${Math.floor(averageDuration / 60)}h ${averageDuration % 60}m`
                                    : `${averageDuration} mins`
                                }
                            </Text>
                        </View>
                    </View>
                )}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color={COLORS.accent} />
                    <Text style={styles.infoText}>
                        This is a demo parking to showcase all features. Use the Search tab to find nearby parkings.
                    </Text>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('SearchTab')}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="search" size={24} color={COLORS.accent} />
                        </View>
                        <Text style={styles.actionLabel}>Search Nearby</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('HistoryTab')}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="receipt" size={24} color={COLORS.accent} />
                        </View>
                        <Text style={styles.actionLabel}>My Bookings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Vehicles')}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="car-sport" size={24} color={COLORS.accent} />
                        </View>
                        <Text style={styles.actionLabel}>My Vehicles</Text>
                    </TouchableOpacity>
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
    content: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 56,
        paddingBottom: 80,
    },
    greetingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.3,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
    },
    activeBookingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accent,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        gap: 8,
    },
    activeBannerText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    sectionHeader: {
        marginTop: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.background,
        padding: 14,
        borderRadius: 12,
        marginTop: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 18,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    analyticsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    analyticsIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    analyticsLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    analyticsValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 2,
    },
});

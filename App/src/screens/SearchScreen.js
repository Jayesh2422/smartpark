import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet,
    ActivityIndicator, RefreshControl, StatusBar, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { fetchAllParkings } from '../services/parkingService';
import { fetchAllHolidays } from '../services/holidayService';
import { getActiveBookings } from '../services/bookingService';
import { filterByRadius } from '../utils/calculateDistance';
import { calculateDynamicPrice, isWeekendDay } from '../utils/calculateDynamicPrice';
import { getHolidayMultiplier } from '../utils/getHolidayMultiplier';
import { calculateParkingScores } from '../utils/calculateParkingScore';
import ParkingCard from '../components/ParkingCard';
import SearchBar from '../components/SearchBar';
import RadiusSelector from '../components/RadiusSelector';
import HolidayBanner from '../components/HolidayBanner';
import { COLORS } from '../constants/theme';

export default function SearchScreen({ navigation }) {
    const { user, profile } = useAuth();
    const { location, loading: locationLoading } = useLocation();

    const [parkings, setParkings] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [activeBookings, setActiveBookings] = useState([]);
    const [radius, setRadius] = useState(5);
    const [searchLocation, setSearchLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [todayHoliday, setTodayHoliday] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    const currentLocation = searchLocation || location;

    const loadData = async () => {
        try {
            const [parkingData, holidayData] = await Promise.all([
                fetchAllParkings(),
                fetchAllHolidays(),
            ]);
            setParkings(parkingData || []);
            setHolidays(holidayData || []);

            // Check today for holiday
            const today = new Date();
            const { isHoliday, holidayName, multiplier } = getHolidayMultiplier(today, holidayData);
            if (isHoliday) {
                setTodayHoliday({ name: holidayName, multiplier });
            }

            // Load active bookings
            if (user?.id) {
                try {
                    const bookings = await getActiveBookings(user.id);
                    setActiveBookings(bookings || []);
                } catch (err) {
                    console.log('Bookings load error:', err);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    // Process parkings with distance and dynamic pricing
    const processedParkings = React.useMemo(() => {
        if (!currentLocation || parkings.length === 0) return [];

        // Filter by radius
        const nearby = filterByRadius(
            parkings,
            currentLocation.latitude,
            currentLocation.longitude,
            radius
        );

        // Calculate dynamic price for each
        const today = new Date();
        const { multiplier: holidayMult } = getHolidayMultiplier(today, holidays);
        const weekend = isWeekendDay(today);

        const withPrices = nearby.map((p) => {
            const pricing = calculateDynamicPrice({
                basePrice: p.base_price,
                durationHours: 1,
                holidayMultiplier: holidayMult,
                isWeekend: weekend,
                occupiedSlots: p.occupied_slots,
                totalSlots: p.total_slots,
            });
            return {
                ...p,
                dynamicPrice: pricing.pricePerHour,
                pricing,
            };
        });

        // Score and tag
        const scored = calculateParkingScores(withPrices);
        return scored;
    }, [parkings, currentLocation, radius, holidays]);

    const handleLocationSelect = (loc) => {
        setSearchLocation({
            latitude: loc.latitude,
            longitude: loc.longitude,
        });
    };

    if (loading || locationLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Finding nearby parkings...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

            <FlatList
                data={processedParkings}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.accent]}
                        tintColor={COLORS.accent}
                    />
                }
                ListHeaderComponent={
                    <View>
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>Search Nearby</Text>
                                <Text style={styles.headerSubtitle}>Find parking around you</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowSearch(!showSearch)}
                                style={styles.searchIconBtn}
                            >
                                <Ionicons name="search" size={24} color={COLORS.accent} />
                            </TouchableOpacity>
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

                        {/* Search Bar (Collapsible) */}
                        {showSearch && <SearchBar onLocationSelect={handleLocationSelect} />}

                        {/* Radius + Count */}
                        <View style={styles.filterRow}>
                            <RadiusSelector selected={radius} onSelect={setRadius} />
                            <Text style={styles.resultCount}>
                                {processedParkings.length} found
                            </Text>
                        </View>

                        {/* Section Title */}
                        <Text style={styles.sectionTitle}>Nearby Parkings</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <ParkingCard
                        parking={item}
                        onPress={() => navigation.navigate('ParkingDetail', { parking: item, holidays })}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="location-outline" size={48} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>No Parkings Found</Text>
                        <Text style={styles.emptyText}>
                            Try increasing the search radius or searching a different location.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    listContent: {
        padding: 20,
        paddingTop: 56,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    searchIconBtn: {
        padding: 8,
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
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 6,
    },
    resultCount: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 12,
    },
    emptyText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
});

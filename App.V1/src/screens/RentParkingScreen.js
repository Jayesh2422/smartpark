import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
    StatusBar,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchAvailableP2PListings, rentP2PListing } from '../services/p2pService';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

const VEHICLE_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'bike', label: 'Bike' },
    { value: 'car', label: 'Car' },
    { value: 'suv', label: 'SUV' },
];

const DURATION_MODES = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'range', label: 'Custom Range' },
    { value: 'monthly', label: '1-12 Months' },
];

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function addMonths(date, months) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

function formatDate(date) {
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function RentParkingScreen({ navigation }) {
    const { user, profile } = useAuth();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [renting, setRenting] = useState(false);

    const [vehicleFilter, setVehicleFilter] = useState('all');
    const [selectedListingId, setSelectedListingId] = useState(null);

    const [durationMode, setDurationMode] = useState('hourly');
    const [durationValue, setDurationValue] = useState(1);

    const [rangeStart, setRangeStart] = useState(new Date());
    const [rangeEnd, setRangeEnd] = useState(addDays(new Date(), 1));
    const [activeDatePicker, setActiveDatePicker] = useState(null);

    const selectedListing = useMemo(
        () => listings.find((listing) => listing.id === selectedListingId) || null,
        [listings, selectedListingId]
    );

    const loadListings = useCallback(async () => {
        try {
            const data = await fetchAvailableP2PListings({ vehicleType: vehicleFilter });
            setListings(data || []);

            setSelectedListingId((current) =>
                current && !data?.some((item) => item.id === current) ? null : current
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to load P2P listings.');
        } finally {
            setLoading(false);
        }
    }, [vehicleFilter]);

    useFocusEffect(
        useCallback(() => {
            loadListings();
        }, [loadListings])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadListings();
        setRefreshing(false);
    };

    const updateDurationValue = (nextValue) => {
        const maxValue = durationMode === 'hourly' ? 24 : durationMode === 'daily' ? 60 : 12;
        const value = Math.min(Math.max(nextValue, 1), maxValue);
        setDurationValue(value);
    };

    const rentalWindow = useMemo(() => {
        const start = durationMode === 'range' ? new Date(rangeStart) : new Date();
        let end = new Date(start);
        let totalUnits = durationValue;

        if (durationMode === 'hourly') {
            end = new Date(start.getTime() + durationValue * 60 * 60 * 1000);
        }
        if (durationMode === 'daily') {
            end = addDays(start, durationValue);
        }
        if (durationMode === 'monthly') {
            end = addMonths(start, durationValue);
        }
        if (durationMode === 'range') {
            end = new Date(rangeEnd);
            const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            totalUnits = Math.max(1, dayDiff);
        }

        return { start, end, totalUnits };
    }, [durationMode, durationValue, rangeStart, rangeEnd]);

    const totalPrice = useMemo(() => {
        if (!selectedListing) return 0;

        if (durationMode === 'hourly') {
            return Number(selectedListing.hourly_price || 0) * rentalWindow.totalUnits;
        }
        if (durationMode === 'monthly') {
            return Number(selectedListing.monthly_price || 0) * rentalWindow.totalUnits;
        }
        return Number(selectedListing.daily_price || 0) * rentalWindow.totalUnits;
    }, [selectedListing, durationMode, rentalWindow.totalUnits]);

    const handleConfirmRental = async () => {
        if (!user?.id) {
            Alert.alert('Session Expired', 'Please sign in again.');
            return;
        }
        if (!selectedListing) {
            Alert.alert('Select Listing', 'Please choose a listing first.');
            return;
        }
        if (renting) return;
        if (rentalWindow.end.getTime() <= rentalWindow.start.getTime()) {
            Alert.alert('Invalid Duration', 'End time must be after start time.');
            return;
        }

        setRenting(true);
        try {
            await rentP2PListing({
                listingId: selectedListing.id,
                renterUserId: user.id,
                renterPhoneNumber: profile?.phone,
                rentalStartTime: rentalWindow.start.toISOString(),
                rentalEndTime: rentalWindow.end.toISOString(),
                rentalDurationMode: durationMode,
                rentalUnits: rentalWindow.totalUnits,
                rentalTotalPrice: totalPrice,
            });

            Alert.alert(
                'Rental Confirmed',
                `Booked for INR ${Math.round(totalPrice)} from ${formatDate(rentalWindow.start)} to ${formatDate(rentalWindow.end)}.`
            );

            setSelectedListingId(null);
            await loadListings();
        } catch (error) {
            Alert.alert('Booking Failed', error.message || 'Unable to rent this parking spot.');
        } finally {
            setRenting(false);
        }
    };

    const renderListing = ({ item }) => {
        const isSelected = item.id === selectedListingId;

        return (
            <View style={[styles.listingCard, isSelected && styles.listingCardSelected]}>
                <View style={styles.listingHeader}>
                    <View>
                        <Text style={styles.listingTitle}>P2P Spot</Text>
                        <Text style={styles.listingSubtitle}>
                            {item.vehicle_size_allowed?.toUpperCase()} compatible
                        </Text>
                    </View>
                    <View style={styles.priceColumn}>
                        <Text style={styles.priceMain}>INR {Math.round(Number(item.hourly_price || 0))}/hr</Text>
                        <Text style={styles.priceSub}>Day {Math.round(Number(item.daily_price || 0))}</Text>
                        <Text style={styles.priceSub}>Month {Math.round(Number(item.monthly_price || 0))}</Text>
                    </View>
                </View>

                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.locationText}>
                    Availability: {item.availability_duration || '-'}
                </Text>
                <Text style={styles.locationText}>
                    Lat {Number(item.location_lat).toFixed(4)} | Lng {Number(item.location_lng).toFixed(4)}
                </Text>

                <TouchableOpacity
                    style={[styles.selectBtn, isSelected && styles.selectBtnSelected]}
                    onPress={() => setSelectedListingId(item.id)}
                >
                    <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextSelected]}>
                        {isSelected ? 'Selected' : 'Select Listing'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Rent Parking</Text>
                    <Text style={styles.subtitle}>Choose compatible spots and confirm rental duration.</Text>
                </View>
            </View>

            <FlatList
                data={listings}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
                        <Text style={styles.sectionLabel}>Vehicle Compatibility</Text>
                        <View style={styles.pillsRow}>
                            {VEHICLE_FILTERS.map((filterItem) => {
                                const active = vehicleFilter === filterItem.value;
                                return (
                                    <TouchableOpacity
                                        key={filterItem.value}
                                        style={[styles.pill, active && styles.pillActive]}
                                        onPress={() => setVehicleFilter(filterItem.value)}
                                    >
                                        <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                            {filterItem.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.sectionLabel}>Duration</Text>
                        <View style={styles.segmentWrap}>
                            {DURATION_MODES.map((modeItem) => {
                                const active = durationMode === modeItem.value;
                                return (
                                    <TouchableOpacity
                                        key={modeItem.value}
                                        style={[styles.segment, active && styles.segmentActive]}
                                        onPress={() => {
                                            setDurationMode(modeItem.value);
                                            setDurationValue(1);
                                        }}
                                    >
                                        <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                                            {modeItem.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {durationMode === 'range' ? (
                            <View style={styles.rangeControls}>
                                <TouchableOpacity
                                    style={styles.rangeBtn}
                                    onPress={() => setActiveDatePicker('start')}
                                >
                                    <Text style={styles.rangeLabel}>Start Date</Text>
                                    <Text style={styles.rangeValue}>{formatDate(rangeStart)}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.rangeBtn}
                                    onPress={() => setActiveDatePicker('end')}
                                >
                                    <Text style={styles.rangeLabel}>End Date</Text>
                                    <Text style={styles.rangeValue}>{formatDate(rangeEnd)}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.stepperWrap}>
                                <Text style={styles.stepperLabel}>
                                    {durationMode === 'hourly'
                                        ? 'Hours'
                                        : durationMode === 'daily'
                                            ? 'Days'
                                            : 'Months'}
                                </Text>
                                <View style={styles.stepper}>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() => updateDurationValue(durationValue - 1)}
                                    >
                                        <Ionicons name="remove" size={18} color={COLORS.accent} />
                                    </TouchableOpacity>
                                    <Text style={styles.stepperValue}>{durationValue}</Text>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() => updateDurationValue(durationValue + 1)}
                                    >
                                        <Ionicons name="add" size={18} color={COLORS.accent} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {selectedListing && (
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Booking Summary</Text>
                                <Text style={styles.summaryLine}>
                                    {`Start: ${formatDate(rentalWindow.start)}`}
                                </Text>
                                <Text style={styles.summaryLine}>
                                    {`End: ${formatDate(rentalWindow.end)}`}
                                </Text>
                                <Text style={styles.summaryTotal}>
                                    Total: INR {Math.round(totalPrice)}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.confirmBtn, renting && styles.confirmBtnDisabled]}
                                    onPress={handleConfirmRental}
                                    disabled={renting}
                                >
                                    {renting ? (
                                        <ActivityIndicator color={COLORS.primary} />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                                            <Text style={styles.confirmBtnText}>Confirm Rental</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={styles.sectionLabel}>Available Listings ({listings.length})</Text>
                    </View>
                }
                renderItem={renderListing}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="car-outline" size={44} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>No Available Listings</Text>
                        <Text style={styles.emptyText}>Try a different compatibility filter.</Text>
                    </View>
                }
            />

            {activeDatePicker && (
                <DateTimePicker
                    value={activeDatePicker === 'start' ? rangeStart : rangeEnd}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={activeDatePicker === 'end' ? rangeStart : new Date()}
                    onChange={(event, date) => {
                        if (Platform.OS === 'android') {
                            setActiveDatePicker(null);
                        }
                        if (!date) return;

                        if (activeDatePicker === 'start') {
                            setRangeStart(date);
                            if (rangeEnd.getTime() <= date.getTime()) {
                                setRangeEnd(addDays(date, 1));
                            }
                        } else if (date.getTime() > rangeStart.getTime()) {
                            setRangeEnd(date);
                        }
                    }}
                />
            )}
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
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: SPACING.lg,
        paddingTop: 56,
        gap: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        ...TYPOGRAPHY.h3,
        fontWeight: '800',
        color: COLORS.text,
    },
    subtitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginTop: 3,
    },
    listContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: 90,
    },
    sectionLabel: {
        ...TYPOGRAPHY.title,
        color: COLORS.text,
        fontWeight: '700',
        marginBottom: 10,
        marginTop: 8,
    },
    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    pillActive: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accent,
    },
    pillText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text,
        fontWeight: '600',
    },
    pillTextActive: {
        color: COLORS.primary,
    },
    segmentWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    segment: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    segmentActive: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accent,
    },
    segmentText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: COLORS.primary,
    },
    stepperWrap: {
        marginBottom: 14,
    },
    stepperLabel: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    stepBtn: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: {
        width: 44,
        textAlign: 'center',
        ...TYPOGRAPHY.title,
        color: COLORS.text,
        fontWeight: '700',
    },
    rangeControls: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    rangeBtn: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
    },
    rangeLabel: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
    },
    rangeValue: {
        ...TYPOGRAPHY.body,
        color: COLORS.text,
        marginTop: 3,
        fontWeight: '600',
    },
    summaryCard: {
        backgroundColor: '#F2ECE7',
        borderWidth: 1,
        borderColor: '#E3D8D0',
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: 10,
    },
    summaryTitle: {
        ...TYPOGRAPHY.title,
        color: COLORS.text,
        fontWeight: '700',
        marginBottom: 8,
    },
    summaryLine: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginBottom: 3,
    },
    summaryTotal: {
        ...TYPOGRAPHY.body,
        color: COLORS.accent,
        fontWeight: '800',
        marginTop: 6,
        marginBottom: 12,
    },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.accent,
        borderRadius: RADIUS.md,
        paddingVertical: 13,
    },
    confirmBtnDisabled: {
        opacity: 0.65,
    },
    confirmBtnText: {
        ...TYPOGRAPHY.body,
        color: COLORS.primary,
        fontWeight: '700',
    },
    listingCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    listingCardSelected: {
        borderColor: COLORS.accent,
    },
    listingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    listingTitle: {
        ...TYPOGRAPHY.title,
        color: COLORS.text,
        fontWeight: '700',
    },
    listingSubtitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    priceColumn: {
        alignItems: 'flex-end',
    },
    priceMain: {
        ...TYPOGRAPHY.caption,
        color: COLORS.accent,
        fontWeight: '700',
    },
    priceSub: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
    },
    description: {
        ...TYPOGRAPHY.body,
        color: COLORS.text,
        marginTop: 10,
        marginBottom: 8,
    },
    locationText: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
    },
    selectBtn: {
        marginTop: 12,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        paddingVertical: 10,
        alignItems: 'center',
    },
    selectBtnSelected: {
        borderColor: COLORS.accent,
        backgroundColor: '#EFE4DC',
    },
    selectBtnText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text,
        fontWeight: '600',
    },
    selectBtnTextSelected: {
        color: COLORS.accent,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyTitle: {
        ...TYPOGRAPHY.title,
        color: COLORS.text,
        marginTop: 8,
    },
    emptyText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
});

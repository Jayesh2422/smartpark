import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { fetchVehicles } from '../services/vehicleService';
import { createBooking } from '../services/bookingService';
import { updateSlotStatus, updateOccupiedSlots } from '../services/parkingService';
import { calculateDynamicPrice, isWeekendDay } from '../utils/calculateDynamicPrice';
import { getHolidayMultiplier } from '../utils/getHolidayMultiplier';
import { allocateBestSlot } from '../utils/allocateBestSlot';
import PriceBreakdown from '../components/PriceBreakdown';
import SlotVisualizer from '../components/SlotVisualizer';
import HolidayBanner from '../components/HolidayBanner';
import { COLORS } from '../constants/theme';

const DURATION_OPTIONS = [0.5, 1, 2, 3, 4, 6, 8];

export default function BookingScreen({ route, navigation }) {
    const { parking, slots, holidays = [], durationEstimate } = route.params;
    const { user } = useAuth();

    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [duration, setDuration] = useState(
        durationEstimate?.estimatedHours ? Math.round(durationEstimate.estimatedHours) : 1
    );
    const [allocatedSlot, setAllocatedSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBooked, setIsBooked] = useState(false);
    const [bookingDate, setBookingDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { isHoliday, holidayName, multiplier: holidayMult } = getHolidayMultiplier(bookingDate, holidays);
    const weekend = isWeekendDay(bookingDate);

    const pricing = calculateDynamicPrice({
        basePrice: parking.base_price,
        durationHours: duration,
        holidayMultiplier: holidayMult,
        isWeekend: weekend,
        occupiedSlots: parking.occupied_slots,
        totalSlots: parking.total_slots,
    });

    useEffect(() => {
        loadVehicles();
    }, []);

    useEffect(() => {
        if (selectedVehicle && slots.length > 0) {
            setAllocatedSlot(allocateBestSlot(slots, selectedVehicle.vehicle_type, duration));
        }
    }, [selectedVehicle, duration, slots]);

    const loadVehicles = async () => {
        if (!user?.id) {
            setVehicles([]);
            setLoading(false);
            return;
        }

        try {
            const data = await fetchVehicles(user.id);
            setVehicles(data || []);
            const defaultVehicle = data?.find((vehicle) => vehicle.is_default);
            if (defaultVehicle) {
                setSelectedVehicle(defaultVehicle);
            } else if (data?.length > 0) {
                setSelectedVehicle(data[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (isSubmitting || isBooked) return;

        if (!user?.id) {
            Alert.alert('Session Expired', 'Please sign in again.');
            return;
        }
        if (!selectedVehicle) {
            Alert.alert('Select Vehicle', 'Please select or add a vehicle first.');
            return;
        }
        if (!allocatedSlot) {
            Alert.alert('No Slot', 'No compatible slot available.');
            return;
        }

        setIsSubmitting(true);
        try {
            const startTime = bookingDate.toISOString();
            const endTime = new Date(bookingDate.getTime() + duration * 3600000).toISOString();

            await createBooking({
                user_id: user.id,
                parking_id: parking.id,
                slot_id: allocatedSlot.id,
                vehicle_id: selectedVehicle.id,
                start_time: startTime,
                end_time: endTime,
                duration_minutes: duration * 60,
                final_price: pricing.finalPrice,
                base_price: parking.base_price,
                applied_multipliers: pricing.breakdown,
                status: 'active',
            });

            await updateSlotStatus(allocatedSlot.id, 'occupied');
            await updateOccupiedSlots(parking.id, parking.occupied_slots + 1);

            setIsBooked(true);

            const dateStr = bookingDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });

            Alert.alert(
                'Booking Confirmed',
                `${dateStr} | Slot ${allocatedSlot.slot_number} | ${duration}h | INR ${Math.round(pricing.finalPrice)}`,
                [
                    {
                        text: 'View My Bookings',
                        onPress: () => navigation.navigate('MainTabs', { screen: 'HistoryTab' }),
                    },
                    { text: 'Close', style: 'cancel' },
                ]
            );
        } catch (error) {
            Alert.alert('Booking Failed', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    const confirmDisabled = !allocatedSlot || isSubmitting || isBooked;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.pageTitle}>Book Parking</Text>
            <Text style={styles.parkingName}>{parking.name}</Text>

            <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => !isBooked && setShowDatePicker(true)}
                disabled={isBooked}
            >
                <Ionicons name="calendar" size={20} color={COLORS.accent} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.dateLabel}>Booking Date</Text>
                    <Text style={styles.dateValue}>
                        {bookingDate.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={bookingDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') {
                            setShowDatePicker(false);
                        }
                        if (selectedDate && !isBooked) {
                            setBookingDate(selectedDate);
                        }
                    }}
                />
            )}

            {isHoliday && <HolidayBanner holidayName={holidayName} multiplier={holidayMult} />}

            {durationEstimate && (
                <View style={styles.hint}>
                    <Ionicons name="bulb" size={16} color={COLORS.accent} />
                    <Text style={styles.hintText}>{durationEstimate.message}</Text>
                </View>
            )}

            <Text style={styles.sectionTitle}>Select Vehicle</Text>
            {vehicles.length === 0 ? (
                <TouchableOpacity
                    style={styles.addVehicleBtn}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
                >
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.accent} />
                    <Text style={styles.addVehicleText}>Add a vehicle from Home</Text>
                </TouchableOpacity>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                    {vehicles.map((vehicle) => (
                        <TouchableOpacity
                            key={vehicle.id}
                            style={[
                                styles.vehicleCard,
                                selectedVehicle?.id === vehicle.id && styles.vehicleCardActive,
                            ]}
                            onPress={() => !isBooked && setSelectedVehicle(vehicle)}
                            disabled={isBooked}
                        >
                            <Ionicons
                                name={
                                    vehicle.vehicle_type === 'bike'
                                        ? 'bicycle'
                                        : vehicle.vehicle_type === 'suv'
                                            ? 'bus'
                                            : 'car-sport'
                                }
                                size={22}
                                color={selectedVehicle?.id === vehicle.id ? COLORS.primary : COLORS.accent}
                            />
                            <Text
                                style={[
                                    styles.vehicleName,
                                    selectedVehicle?.id === vehicle.id && styles.vehicleNameActive,
                                ]}
                            >
                                {vehicle.vehicle_name}
                            </Text>
                            <Text
                                style={[
                                    styles.vehicleNumber,
                                    selectedVehicle?.id === vehicle.id && styles.vehicleNumberActive,
                                ]}
                            >
                                {vehicle.vehicle_number}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            <Text style={styles.sectionTitle}>Duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                {DURATION_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[styles.durationPill, duration === option && styles.durationPillActive]}
                        onPress={() => !isBooked && setDuration(option)}
                        disabled={isBooked}
                    >
                        <Text style={[styles.durationText, duration === option && styles.durationTextActive]}>
                            {option < 1 ? `${option * 60}m` : `${option}h`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {allocatedSlot && <SlotVisualizer slot={allocatedSlot} />}
            {!allocatedSlot && selectedVehicle && (
                <View style={styles.noSlot}>
                    <Ionicons name="warning-outline" size={20} color="#E65100" />
                    <Text style={styles.noSlotText}>No compatible {selectedVehicle.vehicle_type} slot.</Text>
                </View>
            )}

            <PriceBreakdown breakdown={pricing.breakdown} finalPrice={pricing.finalPrice} />

            <TouchableOpacity
                style={[
                    styles.confirmBtn,
                    confirmDisabled && styles.confirmBtnDisabled,
                    isBooked && styles.confirmBtnBooked,
                ]}
                onPress={handleBooking}
                disabled={confirmDisabled}
            >
                {isSubmitting ? (
                    <ActivityIndicator color={COLORS.primary} />
                ) : (
                    <>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                        <Text style={styles.confirmBtnText}>
                            {isBooked ? 'Parking Booked' : `Confirm | INR ${Math.round(pricing.finalPrice)}`}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
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
    loadContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
    },
    parkingName: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    datePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: COLORS.background,
        borderRadius: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dateLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    dateValue: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '700',
        marginTop: 2,
    },
    hint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F5F0EB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    hintText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '500',
        flex: 1,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 10,
        marginTop: 8,
    },
    addVehicleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 14,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        marginBottom: 12,
    },
    addVehicleText: {
        fontSize: 14,
        color: COLORS.accent,
        fontWeight: '600',
    },
    horizontalList: {
        marginBottom: 16,
    },
    vehicleCard: {
        padding: 14,
        borderRadius: 14,
        backgroundColor: COLORS.background,
        marginRight: 10,
        alignItems: 'center',
        minWidth: 100,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    vehicleCardActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    vehicleName: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 6,
    },
    vehicleNameActive: {
        color: COLORS.primary,
    },
    vehicleNumber: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    vehicleNumberActive: {
        color: 'rgba(255,255,255,0.75)',
    },
    durationPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    durationPillActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    durationText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    durationTextActive: {
        color: COLORS.primary,
    },
    noSlot: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#FFF3E0',
        borderRadius: 12,
        marginVertical: 8,
    },
    noSlotText: {
        fontSize: 13,
        color: '#E65100',
        fontWeight: '500',
    },
    confirmBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.accent,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    confirmBtnDisabled: {
        backgroundColor: '#B7ABA2',
        shadowOpacity: 0,
        elevation: 0,
    },
    confirmBtnBooked: {
        backgroundColor: '#9E8B7D',
    },
    confirmBtnText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '700',
    },
});

import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, Alert, ActivityIndicator, Platform,
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
    const [duration, setDuration] = useState(durationEstimate?.estimatedHours ? Math.round(durationEstimate.estimatedHours) : 1);
    const [allocatedSlot, setAllocatedSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [bookingDate, setBookingDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);


    const { isHoliday, holidayName, multiplier: holidayMult } = getHolidayMultiplier(bookingDate, holidays);
    const weekend = isWeekendDay(bookingDate);
    const pricing = calculateDynamicPrice({
        basePrice: parking.base_price, durationHours: duration, holidayMultiplier: holidayMult,
        isWeekend: weekend, occupiedSlots: parking.occupied_slots, totalSlots: parking.total_slots,
    });

    useEffect(() => { loadVehicles(); }, []);
    useEffect(() => {
        if (selectedVehicle && slots.length > 0) {
            setAllocatedSlot(allocateBestSlot(slots, selectedVehicle.vehicle_type, duration));
        }
    }, [selectedVehicle, duration, slots]);

    const loadVehicles = async () => {
        try {
            const data = await fetchVehicles(user.id);
            setVehicles(data || []);
            const def = data?.find((v) => v.is_default);
            if (def) setSelectedVehicle(def);
            else if (data?.length > 0) setSelectedVehicle(data[0]);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleBooking = async () => {
        if (!selectedVehicle) { Alert.alert('Select Vehicle', 'Please select or add a vehicle first.'); return; }
        if (!allocatedSlot) { Alert.alert('No Slot', 'No compatible slot available.'); return; }
        setBooking(true);
        try {
            const startTime = bookingDate.toISOString();
            const endTime = new Date(bookingDate.getTime() + duration * 3600000).toISOString();
            await createBooking({
                user_id: user.id, parking_id: parking.id, slot_id: allocatedSlot.id,
                vehicle_id: selectedVehicle.id, start_time: startTime, end_time: endTime,
                duration_minutes: duration * 60, final_price: pricing.finalPrice,
                base_price: parking.base_price, applied_multipliers: pricing.breakdown, status: 'active',
            });
            await updateSlotStatus(allocatedSlot.id, 'occupied');
            await updateOccupiedSlots(parking.id, parking.occupied_slots + 1);

            const dateStr = bookingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            Alert.alert('Booking Confirmed! 🎉', `${dateStr} • Slot ${allocatedSlot.slot_number} • ${duration}h • ₹${Math.round(pricing.finalPrice)}`,
                [{ text: 'OK', onPress: () => navigation.popToTop() }]);
        } catch (error) { Alert.alert('Booking Failed', error.message); } finally { setBooking(false); }
    };

    if (loading) return <View style={styles.loadC}><ActivityIndicator size="large" color={COLORS.brown} /></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color={COLORS.darkText} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Book Parking</Text>
            <Text style={styles.parkingName}>{parking.name}</Text>

            {/* Date Picker for Advance Booking */}
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar" size={20} color={COLORS.brown} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.dateLabel}>Booking Date</Text>
                    <Text style={styles.dateValue}>
                        {bookingDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.grayText} />
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={bookingDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                        // Close picker on Android after selection
                        if (Platform.OS === 'android') {
                            setShowDatePicker(false);
                        }
                        if (selectedDate) {
                            setBookingDate(selectedDate);
                        }
                    }}
                />
            )}

            {isHoliday && <HolidayBanner holidayName={holidayName} multiplier={holidayMult} />}
            {durationEstimate && (
                <View style={styles.hint}><Ionicons name="bulb" size={16} color={COLORS.brown} /><Text style={styles.hintT}>{durationEstimate.message}</Text></View>
            )}
            <Text style={styles.secTitle}>Select Vehicle</Text>
            {vehicles.length === 0 ? (
                <TouchableOpacity style={styles.addVBtn} onPress={() => navigation.navigate('VehiclesTab')}>
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.brown} /><Text style={styles.addVT}>Add a vehicle first</Text>
                </TouchableOpacity>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {vehicles.map((v) => (
                        <TouchableOpacity key={v.id} style={[styles.vCard, selectedVehicle?.id === v.id && styles.vCardA]} onPress={() => setSelectedVehicle(v)}>
                            <Ionicons name={v.vehicle_type === 'bike' ? 'bicycle' : v.vehicle_type === 'suv' ? 'bus' : 'car-sport'} size={22} color={selectedVehicle?.id === v.id ? COLORS.white : COLORS.brown} />
                            <Text style={[styles.vName, selectedVehicle?.id === v.id && { color: COLORS.white }]}>{v.vehicle_name}</Text>
                            <Text style={[styles.vNum, selectedVehicle?.id === v.id && { color: 'rgba(255,255,255,0.7)' }]}>{v.vehicle_number}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
            <Text style={styles.secTitle}>Duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {DURATION_OPTIONS.map((d) => (
                    <TouchableOpacity key={d} style={[styles.dPill, duration === d && styles.dPillA]} onPress={() => setDuration(d)}>
                        <Text style={[styles.dText, duration === d && { color: COLORS.white }]}>{d < 1 ? `${d * 60}m` : `${d}h`}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            {allocatedSlot && <SlotVisualizer slot={allocatedSlot} />}
            {!allocatedSlot && selectedVehicle && (
                <View style={styles.noSlot}><Ionicons name="warning-outline" size={20} color="#E65100" /><Text style={styles.noSlotT}>No compatible {selectedVehicle.vehicle_type} slot.</Text></View>
            )}
            <PriceBreakdown breakdown={pricing.breakdown} finalPrice={pricing.finalPrice} />
            <TouchableOpacity style={[styles.confirmBtn, (!allocatedSlot || booking) && styles.confirmBtnD]} onPress={handleBooking} disabled={!allocatedSlot || booking}>
                {booking ? <ActivityIndicator color={COLORS.white} /> : (
                    <><Ionicons name="checkmark-circle" size={20} color={COLORS.white} /><Text style={styles.confirmBtnT}>Confirm • ₹{Math.round(pricing.finalPrice)}</Text></>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
    loadC: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.offWhite, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.darkText },
    parkingName: { fontSize: 14, color: COLORS.grayText, marginBottom: 12 },
    datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: COLORS.offWhite, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.lightGray },
    dateLabel: { fontSize: 11, color: COLORS.grayText, fontWeight: '500' },
    dateValue: { fontSize: 14, color: COLORS.darkText, fontWeight: '700', marginTop: 2 },
    hint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F0EB', padding: 12, borderRadius: 12, marginBottom: 16 },
    hintT: { fontSize: 13, color: COLORS.darkText, fontWeight: '500', flex: 1 },
    secTitle: { fontSize: 15, fontWeight: '700', color: COLORS.darkText, marginBottom: 10, marginTop: 8 },
    addVBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: COLORS.offWhite, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray, borderStyle: 'dashed', marginBottom: 12 },
    addVT: { fontSize: 14, color: COLORS.brown, fontWeight: '600' },
    vCard: { padding: 14, borderRadius: 14, backgroundColor: COLORS.offWhite, marginRight: 10, alignItems: 'center', minWidth: 100, borderWidth: 1, borderColor: COLORS.lightGray },
    vCardA: { backgroundColor: COLORS.brown, borderColor: COLORS.brown },
    vName: { fontSize: 12, fontWeight: '700', color: COLORS.darkText, marginTop: 6 },
    vNum: { fontSize: 10, color: COLORS.grayText, marginTop: 2 },
    dPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.offWhite, marginRight: 8, borderWidth: 1, borderColor: COLORS.lightGray },
    dPillA: { backgroundColor: COLORS.brown, borderColor: COLORS.brown },
    dText: { fontSize: 14, fontWeight: '600', color: COLORS.darkText },
    noSlot: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#FFF3E0', borderRadius: 12, marginVertical: 8 },
    noSlotT: { fontSize: 13, color: '#E65100', fontWeight: '500' },
    confirmBtn: { flexDirection: 'row', backgroundColor: COLORS.brown, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, shadowColor: COLORS.brown, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    confirmBtnD: { backgroundColor: COLORS.lightGray, shadowOpacity: 0, elevation: 0 },
    confirmBtnT: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet,
    ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getActiveBookings, getBookingHistory, freeSlot, getPendingPaymentBookings } from '../services/bookingService';

const COLORS = {
    brown: '#6F4E37', white: '#FFFFFF', offWhite: '#F8F6F3',
    lightGray: '#E8E4E0', darkText: '#2D2016', grayText: '#8B7E74',
    green: '#4CAF50', red: '#E53935', orange: '#FF9800',
};

export default function BookingHistoryScreen({ navigation }) {
    const { user } = useAuth();
    const [activeBookings, setActiveBookings] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [freeing, setFreeing] = useState(null);
    const [showPastBookings, setShowPastBookings] = useState(false); // toggle between current and past

    const loadData = async () => {
        if (!user?.id) {
            setActiveBookings([]);
            setHistory([]);
            setLoading(false);
            return;
        }

        try {
            const [active, pending, hist] = await Promise.all([
                getActiveBookings(user.id),
                getPendingPaymentBookings(user.id),
                getBookingHistory(user.id),
            ]);

            // Combine active and pending into one list
            const current = [
                ...(active || []),
                ...(pending || []).map(p => ({ ...p, isFreed: true }))
            ];

            setActiveBookings(current);
            setHistory(hist || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { loadData(); }, [user?.id]));

    const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };


    const handleFreeSlot = async (booking) => {
        if (!booking?.id) {
            Alert.alert('Error', 'Invalid booking. Please refresh and try again.');
            return;
        }

        const parkingName = booking.parkings?.name || 'Parking';
        const slotNumber = booking.slots?.slot_number || '';

        setFreeing(booking.id);
        try {
            await freeSlot(booking.id);
            await loadData();
            Alert.alert('Success', `Slot ${slotNumber} at ${parkingName} has been freed.`);
        } catch (error) {
            console.error('Error freeing slot:', error);
            Alert.alert('Error', error.message || 'Failed to free slot.');
        } finally {
            setFreeing(null);
        }
    };

    const calculateTotalAmount = () => {
        return activeBookings.reduce((total, booking) => {
            if (booking.isFreed) {
                return total + (Math.round(booking.final_price) || 0);
            }
            const startTime = new Date(booking.start_time);
            const now = new Date();
            const durationHours = (now - startTime) / (1000 * 60 * 60);
            const amount = Math.round(booking.base_price * durationHours);
            return total + amount;
        }, 0);
    };

    const handlePayNow = () => {
        if (activeBookings.length === 0) {
            Alert.alert('No Active Bookings', 'You have no active bookings to pay for.');
            return;
        }

        const totalAmount = calculateTotalAmount();

        navigation.dispatch(
            CommonActions.navigate({
                name: 'Payment',
                params: {
                    amount: totalAmount,
                    booking: {
                        id: activeBookings[0].id,
                        parkingName: `${activeBookings.length} Parking${activeBookings.length > 1 ? 's' : ''}`,
                        slotNumber: activeBookings.map(b => b.slots?.slot_number).join(', '),
                        multiple: activeBookings.length > 1,
                        bookings: activeBookings,
                    },
                },
            })
        );
    };

    const formatDate = (d) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (d) => {
        if (!d) return '';
        return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const getElapsedTime = (startTime) => {
        if (!startTime) return '';
        const diff = Date.now() - new Date(startTime).getTime();
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    if (loading) return <View style={styles.loadC}><ActivityIndicator size="large" color={COLORS.brown} /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>My Bookings</Text>
                    <Text style={styles.count}>
                        {activeBookings.length} active • {history.length} past
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.toggleBtn}
                    onPress={() => setShowPastBookings(!showPastBookings)}
                >
                    <Text style={styles.toggleText}>
                        {showPastBookings ? 'Current' : 'Past Bookings'}
                    </Text>
                    <Ionicons
                        name={showPastBookings ? 'time' : 'time-outline'}
                        size={18}
                        color={COLORS.brown}
                    />
                </TouchableOpacity>
            </View>
            <FlatList
                data={
                    showPastBookings
                        ? history.map(b => ({ type: 'history', ...b }))
                        : activeBookings.map(b => ({ type: 'active', ...b }))
                }
                keyExtractor={(item, index) => item.id || `section-${index}`}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.brown]} />}
                renderItem={({ item }) => {

                    if (item.type === 'active') {
                        const isFreed = item.isFreed;
                        return (
                            <View style={[styles.activeCard, isFreed && styles.freedCard]}>
                                {isFreed ? (
                                    <View style={styles.freedBadge}>
                                        <Ionicons name="checkmark-circle" size={12} color={COLORS.green} />
                                        <Text style={styles.freedBadgeText}>Slot Freed</Text>
                                    </View>
                                ) : (
                                    <View style={styles.activePulse} />
                                )}
                                <View style={styles.cardHeader}>
                                    <View style={[styles.activeIconBox, isFreed && { backgroundColor: COLORS.green }]}>
                                        <Ionicons name="car" size={20} color={COLORS.white} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.parkName}>{item.parkings?.name || 'Parking'}</Text>
                                        <Text style={styles.dateText}>
                                            Slot {item.slots?.slot_number} • {item.vehicles?.vehicle_number}
                                        </Text>
                                    </View>
                                    <View style={[styles.activeBadge, isFreed && { backgroundColor: '#E8F5E9' }]}>
                                        {!isFreed && <View style={styles.pulseDot} />}
                                        <Text style={[styles.activeStatusText, isFreed && { color: COLORS.green }]}>
                                            {isFreed ? 'Pending Payment' : 'Active'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Timer and details */}
                                <View style={styles.activeDetails}>
                                    <View style={[styles.timerBox, isFreed && { backgroundColor: '#E8F5E9' }]}>
                                        <Ionicons
                                            name={isFreed ? "time" : "timer"}
                                            size={16}
                                            color={isFreed ? COLORS.green : COLORS.orange}
                                        />
                                        <Text style={[styles.timerText, isFreed && { color: COLORS.green }]}>
                                            {isFreed
                                                ? (item.duration_minutes >= 60
                                                    ? `${Math.floor(item.duration_minutes / 60)}h ${item.duration_minutes % 60}m`
                                                    : `${item.duration_minutes}m`)
                                                : getElapsedTime(item.start_time)
                                            }
                                        </Text>
                                        <Text style={[styles.timerLabel, isFreed && { color: COLORS.green }]}>
                                            {isFreed ? 'duration' : 'elapsed'}
                                        </Text>
                                    </View>
                                    <View style={styles.detail}>
                                        <Ionicons name="time-outline" size={14} color={COLORS.grayText} />
                                        <Text style={styles.detailText}>
                                            Since {formatTime(item.start_time)}
                                        </Text>
                                    </View>
                                    <View style={styles.detail}>
                                        <Ionicons name="cash-outline" size={14} color={COLORS.grayText} />
                                        <Text style={styles.detailText}>₹{Math.round(item.final_price || 0)}</Text>
                                    </View>
                                </View>

                                {/* Free Slot Button - Only show if not already freed */}
                                {!isFreed && (
                                    <TouchableOpacity
                                        style={[styles.freeSlotBtn, freeing === item.id && styles.freeSlotBtnDisabled]}
                                        onPress={() => handleFreeSlot(item)}
                                        disabled={freeing === item.id}
                                    >
                                        {freeing === item.id ? (
                                            <ActivityIndicator size="small" color={COLORS.white} />
                                        ) : (
                                            <>
                                                <Ionicons name="log-out" size={18} color={COLORS.white} />
                                                <Text style={styles.freeSlotText}>Free Slot</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    }

                    // History item
                    return (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconBox}>
                                    <Ionicons
                                        name={item.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                                        size={20}
                                        color={COLORS.white}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.parkName}>{item.parkings?.name || 'Parking'}</Text>
                                    <Text style={styles.dateText}>{formatDate(item.start_time)}</Text>
                                </View>
                                <View style={[styles.statusBadge, item.status === 'completed' ? styles.badgeGreen : styles.badgeRed]}>
                                    <Text style={styles.statusText}>{item.status}</Text>
                                </View>
                            </View>
                            <View style={styles.detailsRow}>
                                <View style={styles.detail}>
                                    <Ionicons name="time-outline" size={14} color={COLORS.grayText} />
                                    <Text style={styles.detailText}>
                                        {item.duration_minutes ? `${Math.round(item.duration_minutes / 60 * 10) / 10}h` : '-'}
                                    </Text>
                                </View>
                                <View style={styles.detail}>
                                    <Ionicons name="cash-outline" size={14} color={COLORS.grayText} />
                                    <Text style={styles.detailText}>₹{Math.round(item.final_price || 0)}</Text>
                                </View>
                                {item.vehicles && (
                                    <View style={styles.detail}>
                                        <Ionicons name="car-outline" size={14} color={COLORS.grayText} />
                                        <Text style={styles.detailText}>{item.vehicles.vehicle_number}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="receipt-outline" size={48} color={COLORS.lightGray} />
                        <Text style={styles.emptyTitle}>No Bookings Yet</Text>
                        <Text style={styles.emptyText}>Your bookings will appear here.</Text>
                    </View>
                }
            />

            {/* Pay Section - Only show if there are active bookings */}
            {activeBookings.length > 0 && (
                <View style={styles.paySection}>
                    <View style={styles.payAmountBox}>
                        <Text style={styles.payLabel}>Total Amount to Pay</Text>
                        <Text style={styles.payAmount}>₹{calculateTotalAmount()}</Text>
                        <Text style={styles.paySubtext}>
                            {activeBookings.length} active booking{activeBookings.length > 1 ? 's' : ''}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.payNowBtn}
                        onPress={handlePayNow}
                    >
                        <Ionicons name="card" size={20} color={COLORS.white} />
                        <Text style={styles.payNowText}>Pay Now</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    loadC: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.darkText },
    count: { fontSize: 13, color: COLORS.grayText, marginTop: 4 },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.offWhite,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.brown,
    },
    list: { padding: 20, paddingTop: 0, paddingBottom: 40 },
    sectionTitle: {
        fontSize: 15, fontWeight: '700', color: COLORS.grayText,
        textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10,
    },

    // Active booking card
    activeCard: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
        marginBottom: 12, borderWidth: 2, borderColor: COLORS.brown,
        shadowColor: COLORS.brown, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    },
    freedCard: {
        borderColor: COLORS.green,
        shadowColor: COLORS.green,
    },
    freedBadge: {
        position: 'absolute', top: 12, right: 12,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        backgroundColor: '#E8F5E9',
    },
    freedBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.green },
    activeIconBox: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center',
    },
    activeBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        backgroundColor: '#FFF3E0',
    },
    pulseDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.orange,
    },
    activeStatusText: { fontSize: 11, fontWeight: '700', color: COLORS.orange },
    activeDetails: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.lightGray,
    },
    timerBox: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 8,
    },
    timerText: { fontSize: 14, fontWeight: '800', color: COLORS.orange },
    timerLabel: { fontSize: 11, color: COLORS.orange, marginLeft: 2 },
    freeSlotBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 14, paddingVertical: 14, borderRadius: 12,
        backgroundColor: COLORS.brown,
    },
    freeSlotBtnDisabled: {
        opacity: 0.6,
    },
    freeSlotText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

    // History card
    card: {
        backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: COLORS.lightGray,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    iconBox: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: COLORS.brown, alignItems: 'center', justifyContent: 'center',
    },
    parkName: { fontSize: 15, fontWeight: '700', color: COLORS.darkText },
    dateText: { fontSize: 12, color: COLORS.grayText, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeGreen: { backgroundColor: '#E8F5E9' },
    badgeRed: { backgroundColor: '#FFEBEE' },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    detailsRow: { flexDirection: 'row', gap: 16 },
    detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailText: { fontSize: 12, color: COLORS.grayText },
    empty: { alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkText, marginTop: 12 },
    emptyText: { fontSize: 13, color: COLORS.grayText, marginTop: 6 },

    // Pay Section
    paySection: {
        backgroundColor: COLORS.white,
        borderTopWidth: 2,
        borderTopColor: COLORS.lightGray,
        padding: 20,
        paddingBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    payAmountBox: {
        alignItems: 'center',
        marginBottom: 16,
    },
    payLabel: {
        fontSize: 13,
        color: COLORS.grayText,
        fontWeight: '600',
        marginBottom: 6,
    },
    payAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.brown,
        marginBottom: 4,
    },
    paySubtext: {
        fontSize: 12,
        color: COLORS.grayText,
    },
    payNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: COLORS.brown,
        paddingVertical: 16,
        borderRadius: 14,
        shadowColor: COLORS.brown,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    payNowText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
});

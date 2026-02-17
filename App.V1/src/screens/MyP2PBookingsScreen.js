import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
    fetchMyActiveP2PRentals,
    fetchMyPendingP2PPayments,
    freeP2PRentalSlot,
    payAndFreeP2PRentalSlot,
    payPendingP2PRental,
} from '../services/p2pService';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    return `${date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
    })} ${date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
}

function formatAmount(value) {
    return `INR ${Math.round(Number(value || 0))}`;
}

function getEstimatedAmount(item) {
    const stored = Number(item?.rental_total_price || 0);
    if (stored > 0) return stored;

    const units = Math.max(1, Number(item?.rental_units || 1));
    const mode = item?.rental_duration_mode;
    if (mode === 'hourly') return Number(item?.hourly_price || 0) * units;
    if (mode === 'monthly') return Number(item?.monthly_price || 0) * units;
    return Number(item?.daily_price || 0) * units;
}

export default function MyP2PBookingsScreen({ navigation }) {
    const { user } = useAuth();
    const [activeRentals, setActiveRentals] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingKey, setProcessingKey] = useState(null);

    const loadData = useCallback(async () => {
        if (!user?.id) {
            setActiveRentals([]);
            setPendingPayments([]);
            setLoading(false);
            return;
        }

        try {
            const [activeData, pendingData] = await Promise.all([
                fetchMyActiveP2PRentals(user.id),
                fetchMyPendingP2PPayments(user.id),
            ]);
            setActiveRentals(activeData || []);
            setPendingPayments(pendingData || []);
        } catch (error) {
            Alert.alert('Load Failed', error.message || 'Unable to fetch current P2P bookings.');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleFreeSlot = (listing) => {
        Alert.alert(
            'Free Slot',
            'This will release the listing back to available parkings and keep payment pending.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Free Slot',
                    onPress: async () => {
                        const actionKey = `free-${listing.id}`;
                        setProcessingKey(actionKey);
                        try {
                            const result = await freeP2PRentalSlot(listing.id, user.id);
                            Alert.alert(
                                'Slot Freed',
                                `Listing is available again. Pending payment: ${formatAmount(result.amount)}.`
                            );
                            await loadData();
                        } catch (error) {
                            Alert.alert('Action Failed', error.message || 'Unable to free this slot.');
                        } finally {
                            setProcessingKey(null);
                        }
                    },
                },
            ]
        );
    };

    const handlePayAndFree = (listing) => {
        Alert.alert(
            'Pay And Free',
            'This will mark payment complete and release the listing to available parkings.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pay & Free',
                    onPress: async () => {
                        const actionKey = `payfree-${listing.id}`;
                        setProcessingKey(actionKey);
                        try {
                            const result = await payAndFreeP2PRentalSlot(listing.id, user.id);
                            Alert.alert(
                                'Payment Successful',
                                `Paid ${formatAmount(result.amount)}. Listing is available again.`
                            );
                            await loadData();
                        } catch (error) {
                            Alert.alert('Action Failed', error.message || 'Unable to pay and free this slot.');
                        } finally {
                            setProcessingKey(null);
                        }
                    },
                },
            ]
        );
    };

    const handlePayPending = async (paymentRecord) => {
        const actionKey = `pending-${paymentRecord.id}`;
        setProcessingKey(actionKey);
        try {
            await payPendingP2PRental(paymentRecord.id, user.id);
            Alert.alert('Paid', 'Pending payment completed.');
            await loadData();
        } catch (error) {
            Alert.alert('Payment Failed', error.message || 'Unable to complete pending payment.');
        } finally {
            setProcessingKey(null);
        }
    };

    const renderActiveCard = ({ item }) => {
        const estimatedAmount = getEstimatedAmount(item);
        const isFreeing = processingKey === `free-${item.id}`;
        const isPayingAndFreeing = processingKey === `payfree-${item.id}`;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Current Rental</Text>
                    <View style={styles.activeChip}>
                        <Text style={styles.activeChipText}>Active</Text>
                    </View>
                </View>
                <Text style={styles.cardBody}>{item.description}</Text>
                <Text style={styles.metaText}>Start: {formatDateTime(item.rental_start_time)}</Text>
                <Text style={styles.metaText}>End: {formatDateTime(item.rental_end_time)}</Text>
                <Text style={styles.metaText}>Vehicle: {item.vehicle_size_allowed?.toUpperCase()}</Text>
                <Text style={styles.amountText}>Amount: {formatAmount(estimatedAmount)}</Text>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.secondaryAction, isFreeing && styles.disabledBtn]}
                        onPress={() => handleFreeSlot(item)}
                        disabled={isFreeing || isPayingAndFreeing}
                    >
                        {isFreeing ? (
                            <ActivityIndicator size="small" color={COLORS.accent} />
                        ) : (
                            <>
                                <Ionicons name="log-out-outline" size={16} color={COLORS.accent} />
                                <Text style={styles.secondaryActionText}>Free Slot</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryAction, styles.flexAction, isPayingAndFreeing && styles.disabledBtn]}
                        onPress={() => handlePayAndFree(item)}
                        disabled={isFreeing || isPayingAndFreeing}
                    >
                        {isPayingAndFreeing ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <>
                                <Ionicons name="card-outline" size={16} color={COLORS.primary} />
                                <Text style={styles.primaryActionText}>Pay & Free</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderPendingCard = ({ item }) => {
        const isPaying = processingKey === `pending-${item.id}`;

        return (
            <View style={styles.pendingCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Pending Payment</Text>
                    <View style={styles.pendingChip}>
                        <Text style={styles.pendingChipText}>Pending</Text>
                    </View>
                </View>
                <Text style={styles.cardBody}>{item.description}</Text>
                <Text style={styles.metaText}>Freed: {formatDateTime(item.created_at)}</Text>
                <Text style={styles.amountText}>Amount: {formatAmount(item.amount)}</Text>

                <TouchableOpacity
                    style={[styles.primaryAction, isPaying && styles.disabledBtn]}
                    onPress={() => handlePayPending(item)}
                    disabled={isPaying}
                >
                    {isPaying ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <>
                            <Ionicons name="card-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.primaryActionText}>Pay Now</Text>
                        </>
                    )}
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
                    <Text style={styles.title}>Current P2P Bookings</Text>
                    <Text style={styles.subtitle}>
                        Free slot or pay from here. Freed slots become available immediately.
                    </Text>
                </View>
            </View>

            <FlatList
                data={activeRentals}
                keyExtractor={(item) => item.id}
                renderItem={renderActiveCard}
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
                    <>
                        <Text style={styles.sectionTitle}>Active Rentals ({activeRentals.length})</Text>
                        {activeRentals.length === 0 && (
                            <View style={styles.emptyWrap}>
                                <Ionicons name="car-outline" size={42} color={COLORS.border} />
                                <Text style={styles.emptyTitle}>No Active P2P Rentals</Text>
                            </View>
                        )}
                        <Text style={styles.sectionTitle}>Pending Payments ({pendingPayments.length})</Text>
                    </>
                }
                ListFooterComponent={
                    <View style={styles.pendingContainer}>
                        {pendingPayments.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Ionicons name="checkmark-circle-outline" size={42} color={COLORS.border} />
                                <Text style={styles.emptyTitle}>No Pending Payments</Text>
                            </View>
                        ) : (
                            pendingPayments.map((item) => (
                                <View key={item.id}>{renderPendingCard({ item })}</View>
                            ))
                        )}
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
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: SPACING.lg,
        paddingTop: 56,
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
        color: COLORS.text,
        fontWeight: '800',
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
    sectionTitle: {
        ...TYPOGRAPHY.title,
        color: COLORS.text,
        fontWeight: '700',
        marginTop: 6,
        marginBottom: 10,
    },
    card: {
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    pendingCard: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        ...TYPOGRAPHY.title,
        color: COLORS.text,
        fontWeight: '700',
    },
    activeChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#E8F5E9',
    },
    activeChipText: {
        ...TYPOGRAPHY.small,
        color: '#2E7D32',
        fontWeight: '700',
    },
    pendingChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#FFF3E0',
    },
    pendingChipText: {
        ...TYPOGRAPHY.small,
        color: '#E65100',
        fontWeight: '700',
    },
    cardBody: {
        ...TYPOGRAPHY.body,
        color: COLORS.text,
        marginBottom: 8,
    },
    metaText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    amountText: {
        ...TYPOGRAPHY.body,
        color: COLORS.accent,
        fontWeight: '800',
        marginTop: 4,
        marginBottom: 10,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    secondaryAction: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.accent,
        borderRadius: RADIUS.md,
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        backgroundColor: COLORS.background,
    },
    secondaryActionText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.accent,
        fontWeight: '700',
    },
    primaryAction: {
        borderRadius: RADIUS.md,
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        backgroundColor: COLORS.accent,
    },
    flexAction: {
        flex: 1,
    },
    primaryActionText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.primary,
        fontWeight: '700',
    },
    disabledBtn: {
        opacity: 0.65,
    },
    pendingContainer: {
        marginTop: 2,
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    emptyTitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginTop: 6,
    },
});

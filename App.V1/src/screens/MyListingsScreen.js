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
    Modal,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchMyP2PListings, updateP2PListing } from '../services/p2pService';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

const SIZE_OPTIONS = ['bike', 'car', 'suv'];

function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function MyListingsScreen({ navigation }) {
    const { user } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingListing, setEditingListing] = useState(null);
    const [editValues, setEditValues] = useState({
        owner_email: '',
        location_lat: '',
        location_lng: '',
        description: '',
        availability_duration: '',
        vehicle_size_allowed: 'car',
        hourly_price: '',
        daily_price: '',
        monthly_price: '',
    });

    const loadListings = useCallback(async () => {
        if (!user?.id) {
            setListings([]);
            setLoading(false);
            return;
        }

        try {
            const data = await fetchMyP2PListings(user.id);
            setListings(data || []);
        } catch (error) {
            Alert.alert('Load Failed', error.message || 'Unable to load your listings.');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

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

    const openEditModal = (listing) => {
        setEditingListing(listing);
        setEditValues({
            owner_email: listing.owner_email || '',
            location_lat: String(listing.location_lat ?? ''),
            location_lng: String(listing.location_lng ?? ''),
            description: listing.description || '',
            availability_duration: listing.availability_duration || '',
            vehicle_size_allowed: listing.vehicle_size_allowed || 'car',
            hourly_price: String(listing.hourly_price ?? ''),
            daily_price: String(listing.daily_price ?? ''),
            monthly_price: String(listing.monthly_price ?? ''),
        });
    };

    const closeEditModal = () => {
        setEditingListing(null);
        setEditValues({
            owner_email: '',
            location_lat: '',
            location_lng: '',
            description: '',
            availability_duration: '',
            vehicle_size_allowed: 'car',
            hourly_price: '',
            daily_price: '',
            monthly_price: '',
        });
    };

    const handleSaveChanges = async () => {
        if (!user?.id || !editingListing?.id) {
            Alert.alert('Error', 'Listing context missing.');
            return;
        }

        if (!editValues.owner_email.trim()) {
            Alert.alert('Missing Email', 'Owner email is required.');
            return;
        }

        if (
            !editValues.location_lat ||
            !editValues.location_lng ||
            !editValues.description.trim() ||
            !editValues.availability_duration.trim()
        ) {
            Alert.alert('Missing Fields', 'Please complete all required listing fields.');
            return;
        }

        setSaving(true);
        try {
            const updated = await updateP2PListing(editingListing.id, user.id, {
                owner_email: editValues.owner_email.trim(),
                location_lat: Number(editValues.location_lat),
                location_lng: Number(editValues.location_lng),
                description: editValues.description.trim(),
                availability_duration: editValues.availability_duration.trim(),
                vehicle_size_allowed: editValues.vehicle_size_allowed,
                hourly_price: Number(editValues.hourly_price),
                daily_price: Number(editValues.daily_price),
                monthly_price: Number(editValues.monthly_price),
            });

            setListings((current) =>
                current.map((item) => (item.id === updated.id ? updated : item))
            );
            Alert.alert('Updated', 'Listing changes saved successfully.');
            closeEditModal();
        } catch (error) {
            Alert.alert('Update Failed', error.message || 'Unable to update listing.');
        } finally {
            setSaving(false);
        }
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
                    <Text style={styles.title}>My Listings</Text>
                    <Text style={styles.subtitle}>Review and edit your parking listings.</Text>
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
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.cardTitle}>P2P Listing</Text>
                                <Text style={styles.cardSubtitle}>
                                    {item.vehicle_size_allowed?.toUpperCase()} compatible
                                </Text>
                            </View>
                            <View style={[styles.statusChip, item.is_rented ? styles.statusRented : styles.statusAvailable]}>
                                <Text style={[styles.statusText, item.is_rented ? styles.statusTextRented : styles.statusTextAvailable]}>
                                    {item.is_rented ? 'Rented' : 'Available'}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.description}>{item.description}</Text>
                        <Text style={styles.metaText}>Availability: {item.availability_duration || '-'}</Text>
                        <Text style={styles.metaText}>
                            Location: {Number(item.location_lat).toFixed(4)}, {Number(item.location_lng).toFixed(4)}
                        </Text>
                        <Text style={styles.metaText}>
                            Pricing: INR {Math.round(Number(item.hourly_price || 0))}/hr | INR {Math.round(Number(item.daily_price || 0))}/day | INR {Math.round(Number(item.monthly_price || 0))}/month
                        </Text>
                        {item.is_rented && (
                            <Text style={styles.metaText}>
                                Rental: {formatDate(item.rental_start_time)} - {formatDate(item.rental_end_time)}
                            </Text>
                        )}

                        <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.editBtnText}>Edit Listing</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Ionicons name="document-text-outline" size={46} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>No Listings Yet</Text>
                        <Text style={styles.emptyText}>Create your first listing from Add Parking for Rent.</Text>
                    </View>
                }
            />

            <Modal visible={!!editingListing} transparent animationType="slide">
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalCard}>
                        <ScrollView
                            contentContainerStyle={styles.modalContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.modalTitle}>Edit Listing</Text>

                            <Text style={styles.fieldLabel}>Owner Email</Text>
                            <TextInput
                                style={styles.input}
                                value={editValues.owner_email}
                                onChangeText={(value) => setEditValues((prev) => ({ ...prev, owner_email: value }))}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={styles.fieldLabel}>Location Latitude</Text>
                            <TextInput
                                style={styles.input}
                                value={editValues.location_lat}
                                onChangeText={(value) => setEditValues((prev) => ({ ...prev, location_lat: value }))}
                                keyboardType="decimal-pad"
                            />

                            <Text style={styles.fieldLabel}>Location Longitude</Text>
                            <TextInput
                                style={styles.input}
                                value={editValues.location_lng}
                                onChangeText={(value) => setEditValues((prev) => ({ ...prev, location_lng: value }))}
                                keyboardType="decimal-pad"
                            />

                            <Text style={styles.fieldLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editValues.description}
                                onChangeText={(value) => setEditValues((prev) => ({ ...prev, description: value }))}
                                multiline
                            />

                            <Text style={styles.fieldLabel}>Availability Duration</Text>
                            <TextInput
                                style={styles.input}
                                value={editValues.availability_duration}
                                onChangeText={(value) => setEditValues((prev) => ({ ...prev, availability_duration: value }))}
                            />

                            <Text style={styles.fieldLabel}>Vehicle Size Allowed</Text>
                            <View style={styles.pillsRow}>
                                {SIZE_OPTIONS.map((size) => {
                                    const active = editValues.vehicle_size_allowed === size;
                                    return (
                                        <TouchableOpacity
                                            key={size}
                                            style={[styles.pill, active && styles.pillActive]}
                                            onPress={() =>
                                                setEditValues((prev) => ({ ...prev, vehicle_size_allowed: size }))
                                            }
                                        >
                                            <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                                {size.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={styles.fieldLabel}>Hourly Price</Text>
                            <TextInput
                                style={styles.input}
                                value={editValues.hourly_price}
                                onChangeText={(value) => setEditValues((prev) => ({ ...prev, hourly_price: value }))}
                                keyboardType="numeric"
                            />

                            <Text style={styles.fieldLabel}>Daily Price</Text>
                            <TextInput
                                style={styles.input}
                                value={editValues.daily_price}
                                onChangeText={(value) => setEditValues((prev) => ({ ...prev, daily_price: value }))}
                                keyboardType="numeric"
                            />

                            <Text style={styles.fieldLabel}>Monthly Price</Text>
                            <TextInput
                                style={styles.input}
                                value={editValues.monthly_price}
                                onChangeText={(value) => setEditValues((prev) => ({ ...prev, monthly_price: value }))}
                                keyboardType="numeric"
                            />

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                                onPress={handleSaveChanges}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color={COLORS.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={18} color={COLORS.primary} />
                                        <Text style={styles.saveBtnText}>Save Changes</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelBtn} onPress={closeEditModal}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        fontWeight: '800',
        color: COLORS.text,
    },
    subtitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    listContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: 88,
    },
    card: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
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
    cardSubtitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    statusChip: {
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusAvailable: {
        backgroundColor: '#E8F5E9',
    },
    statusRented: {
        backgroundColor: '#FFF3E0',
    },
    statusText: {
        ...TYPOGRAPHY.small,
        fontWeight: '700',
    },
    statusTextAvailable: {
        color: '#2E7D32',
    },
    statusTextRented: {
        color: '#E65100',
    },
    description: {
        ...TYPOGRAPHY.body,
        color: COLORS.text,
        marginBottom: 6,
    },
    metaText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    editBtn: {
        marginTop: 10,
        backgroundColor: COLORS.accent,
        borderRadius: RADIUS.md,
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    editBtnText: {
        ...TYPOGRAPHY.body,
        color: COLORS.primary,
        fontWeight: '700',
    },
    emptyWrap: {
        alignItems: 'center',
        paddingTop: 48,
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
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: COLORS.primary,
        maxHeight: '88%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalContent: {
        padding: SPACING.lg,
        paddingBottom: 44,
    },
    modalTitle: {
        ...TYPOGRAPHY.h4,
        color: COLORS.text,
        fontWeight: '800',
        marginBottom: 14,
    },
    fieldLabel: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.background,
        paddingHorizontal: 12,
        paddingVertical: 11,
        color: COLORS.text,
        marginBottom: 10,
    },
    textArea: {
        minHeight: 88,
        textAlignVertical: 'top',
    },
    pillsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    pillActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    pillText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text,
        fontWeight: '600',
    },
    pillTextActive: {
        color: COLORS.primary,
    },
    saveBtn: {
        marginTop: 12,
        backgroundColor: COLORS.accent,
        borderRadius: RADIUS.md,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    saveBtnDisabled: {
        opacity: 0.7,
    },
    saveBtnText: {
        ...TYPOGRAPHY.body,
        color: COLORS.primary,
        fontWeight: '700',
    },
    cancelBtn: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    cancelBtnText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        fontWeight: '700',
    },
});

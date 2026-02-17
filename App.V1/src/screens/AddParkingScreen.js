import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { createP2PListing } from '../services/p2pService';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

const SIZE_OPTIONS = ['bike', 'car', 'suv'];

export default function AddParkingScreen({ navigation }) {
    const { user, profile } = useAuth();

    const [locationLat, setLocationLat] = useState('');
    const [locationLng, setLocationLng] = useState('');
    const [description, setDescription] = useState('');
    const [vehicleSizeAllowed, setVehicleSizeAllowed] = useState('car');
    const [hourlyPrice, setHourlyPrice] = useState('');
    const [dailyPrice, setDailyPrice] = useState('');
    const [monthlyPrice, setMonthlyPrice] = useState('');
    const [availabilityDuration, setAvailabilityDuration] = useState('');
    const [ownerEmail, setOwnerEmail] = useState(profile?.email || user?.email || '');
    const [submitting, setSubmitting] = useState(false);
    const [created, setCreated] = useState(false);
    const [lastCreatedListing, setLastCreatedListing] = useState(null);

    const clearForm = () => {
        setLocationLat('');
        setLocationLng('');
        setDescription('');
        setVehicleSizeAllowed('car');
        setHourlyPrice('');
        setDailyPrice('');
        setMonthlyPrice('');
        setAvailabilityDuration('');
        setOwnerEmail(profile?.email || user?.email || '');
        setCreated(false);
        setLastCreatedListing(null);
    };

    const handleSubmit = async () => {
        if (!user?.id) {
            Alert.alert('Session Expired', 'Please sign in again.');
            return;
        }
        if (!ownerEmail.trim()) {
            Alert.alert('Missing Email', 'Owner email is mandatory.');
            return;
        }
        if (!locationLat || !locationLng || !description || !availabilityDuration) {
            Alert.alert('Missing Fields', 'Please fill all required fields.');
            return;
        }
        if (!hourlyPrice || !dailyPrice || !monthlyPrice) {
            Alert.alert('Missing Price', 'Please provide hourly, daily, and monthly prices.');
            return;
        }

        const lat = Number(locationLat);
        const lng = Number(locationLng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            Alert.alert('Invalid Location', 'Latitude and longitude must be valid numbers.');
            return;
        }

        setSubmitting(true);
        try {
            const listing = await createP2PListing({
                ownerUserId: user.id,
                ownerEmail: ownerEmail.trim(),
                locationLat: lat,
                locationLng: lng,
                description: description.trim(),
                availabilityDuration: availabilityDuration.trim(),
                vehicleSizeAllowed,
                hourlyPrice: Number(hourlyPrice),
                dailyPrice: Number(dailyPrice),
                monthlyPrice: Number(monthlyPrice),
            });

            setLastCreatedListing(listing);
            setCreated(true);
            Alert.alert(
                'Listing Added',
                'Your parking spot has been created and is now available in Rent Parking.',
                [
                    {
                        text: 'View in Rent Parking',
                        onPress: () => navigation.navigate('RentParking'),
                    },
                    {
                        text: 'My Listings',
                        onPress: () => navigation.navigate('MyListings'),
                    },
                    { text: 'Stay Here', style: 'cancel' },
                ]
            );
        } catch (error) {
            Alert.alert('Create Failed', error.message || 'Unable to create listing.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Add Parking for Rent</Text>
                    <Text style={styles.subtitle}>Publish your spot with fixed pricing and compatibility.</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.formCard}>
                        <Text style={styles.fieldLabel}>Owner Email *</Text>
                        <TextInput
                            style={styles.input}
                            value={ownerEmail}
                            onChangeText={setOwnerEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="name@example.com"
                            placeholderTextColor={COLORS.textSecondary}
                            editable={!created}
                        />

                        <Text style={styles.fieldLabel}>Location Latitude *</Text>
                        <TextInput
                            style={styles.input}
                            value={locationLat}
                            onChangeText={setLocationLat}
                            keyboardType="decimal-pad"
                            placeholder="28.6315"
                            placeholderTextColor={COLORS.textSecondary}
                            editable={!created}
                        />

                        <Text style={styles.fieldLabel}>Location Longitude *</Text>
                        <TextInput
                            style={styles.input}
                            value={locationLng}
                            onChangeText={setLocationLng}
                            keyboardType="decimal-pad"
                            placeholder="77.2167"
                            placeholderTextColor={COLORS.textSecondary}
                            editable={!created}
                        />

                        <Text style={styles.fieldLabel}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            placeholder="Covered parking near gate no. 2"
                            placeholderTextColor={COLORS.textSecondary}
                            editable={!created}
                        />

                        <Text style={styles.fieldLabel}>Vehicle Size Allowed *</Text>
                        <View style={styles.pillsRow}>
                            {SIZE_OPTIONS.map((size) => {
                                const isActive = vehicleSizeAllowed === size;
                                return (
                                    <TouchableOpacity
                                        key={size}
                                        style={[styles.pill, isActive && styles.pillActive]}
                                        onPress={() => setVehicleSizeAllowed(size)}
                                        disabled={created}
                                    >
                                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                                            {size.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.fieldLabel}>Hourly Price (INR) *</Text>
                        <TextInput
                            style={styles.input}
                            value={hourlyPrice}
                            onChangeText={setHourlyPrice}
                            keyboardType="numeric"
                            placeholder="40"
                            placeholderTextColor={COLORS.textSecondary}
                            editable={!created}
                        />

                        <Text style={styles.fieldLabel}>Daily Price (INR) *</Text>
                        <TextInput
                            style={styles.input}
                            value={dailyPrice}
                            onChangeText={setDailyPrice}
                            keyboardType="numeric"
                            placeholder="300"
                            placeholderTextColor={COLORS.textSecondary}
                            editable={!created}
                        />

                        <Text style={styles.fieldLabel}>Monthly Price (INR) *</Text>
                        <TextInput
                            style={styles.input}
                            value={monthlyPrice}
                            onChangeText={setMonthlyPrice}
                            keyboardType="numeric"
                            placeholder="5500"
                            placeholderTextColor={COLORS.textSecondary}
                            editable={!created}
                        />

                        <Text style={styles.fieldLabel}>Availability Duration *</Text>
                        <TextInput
                            style={styles.input}
                            value={availabilityDuration}
                            onChangeText={setAvailabilityDuration}
                            placeholder="Example: 3 months, weekdays only"
                            placeholderTextColor={COLORS.textSecondary}
                            editable={!created}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            (submitting || created) && styles.submitBtnDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting || created}
                    >
                        {submitting ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                                <Text style={styles.submitBtnText}>
                                    {created ? 'Listing Added' : 'Create Listing'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {created && (
                        <>
                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={() => navigation.navigate('RentParking')}
                            >
                                <Text style={styles.secondaryBtnText}>Go to Rent Parking</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={() => navigation.navigate('MyListings')}
                            >
                                <Text style={styles.secondaryBtnText}>Check My Listings</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={clearForm}>
                                <Text style={styles.secondaryBtnText}>Add Another Listing</Text>
                            </TouchableOpacity>
                            {!!lastCreatedListing?.id && (
                                <Text style={styles.createdHint}>
                                    Listing ID: {lastCreatedListing.id}
                                </Text>
                            )}
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        flex: 1,
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
        marginTop: 4,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: 88,
    },
    formCard: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
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
        backgroundColor: COLORS.cardBg,
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginBottom: 10,
        color: COLORS.text,
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
        backgroundColor: COLORS.cardBg,
    },
    pillActive: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accent,
    },
    pillText: {
        ...TYPOGRAPHY.caption,
        fontWeight: '600',
        color: COLORS.text,
    },
    pillTextActive: {
        color: COLORS.primary,
    },
    submitBtn: {
        marginTop: 14,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    submitBtnDisabled: {
        backgroundColor: '#9E8B7D',
    },
    submitBtnText: {
        ...TYPOGRAPHY.body,
        color: COLORS.primary,
        fontWeight: '700',
    },
    secondaryBtn: {
        marginTop: 10,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    secondaryBtnText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        fontWeight: '700',
    },
    createdHint: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
});

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchVehicles, addVehicle, deleteVehicle, updateVehicle } from '../services/vehicleService';
import { COLORS, RADIUS, TYPOGRAPHY } from '../constants/theme';

const TYPES = ['bike', 'car', 'suv'];

export default function VehiclesScreen({ navigation }) {
    const { user } = useAuth();

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [type, setType] = useState('car');
    const [isDefault, setIsDefault] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const load = async () => {
        if (!user?.id) {
            setVehicles([]);
            setLoading(false);
            return;
        }

        try {
            const data = await fetchVehicles(user.id);
            setVehicles(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, [user?.id])
    );

    const handleAdd = async () => {
        if (!user?.id) {
            Alert.alert('Session Expired', 'Please sign in again.');
            return;
        }
        if (!name || !number) {
            Alert.alert('Missing Fields', 'Please fill all required fields.');
            return;
        }

        setSaving(true);
        try {
            await addVehicle({
                user_id: user.id,
                vehicle_name: name.trim(),
                vehicle_number: number.toUpperCase().trim(),
                vehicle_type: type,
                is_default: isDefault,
            });
            setModalVisible(false);
            setName('');
            setNumber('');
            setType('car');
            setIsDefault(false);
            await load();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (vehicleId, vehicleName) => {
        Alert.alert('Delete Vehicle', `Remove ${vehicleName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (!user?.id) {
                        Alert.alert('Session Expired', 'Please sign in again.');
                        return;
                    }

                    const previousVehicles = vehicles;
                    setDeletingId(vehicleId);
                    setVehicles((current) => current.filter((item) => item.id !== vehicleId));

                    try {
                        await deleteVehicle(vehicleId, user.id);
                        await load();
                    } catch (error) {
                        setVehicles(previousVehicles);
                        Alert.alert('Error', error.message || 'Failed to delete vehicle.');
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
    };

    const handleSetDefault = async (vehicleId) => {
        if (!user?.id) {
            Alert.alert('Session Expired', 'Please sign in again.');
            return;
        }

        try {
            await updateVehicle(vehicleId, user.id, { is_default: true });
            await load();
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const getIcon = (vehicleType) =>
        vehicleType === 'bike' ? 'bicycle' : vehicleType === 'suv' ? 'bus' : 'car-sport';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {navigation.canGoBack() && (
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.title}>My Vehicles</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={vehicles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={[styles.iconBox, item.is_default && styles.iconBoxActive]}>
                                <Ionicons name={getIcon(item.vehicle_type)} size={22} color={COLORS.primary} />
                            </View>
                            <View style={styles.vehicleInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.vehicleName}>{item.vehicle_name}</Text>
                                    {item.is_default && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultText}>Default</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.vehicleNumber}>{item.vehicle_number}</Text>
                                <Text style={styles.vehicleType}>{item.vehicle_type.toUpperCase()}</Text>
                            </View>
                            <View style={styles.actions}>
                                {!item.is_default && (
                                    <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
                                        <Ionicons name="star-outline" size={20} color={COLORS.accent} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => handleDelete(item.id, item.vehicle_name)}
                                    disabled={deletingId === item.id}
                                >
                                    {deletingId === item.id ? (
                                        <ActivityIndicator size="small" color={COLORS.error} />
                                    ) : (
                                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="car-outline" size={48} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>No Vehicles</Text>
                        <Text style={styles.emptyText}>Add your vehicle to start booking.</Text>
                    </View>
                }
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    style={styles.modalBg}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modal}>
                        <ScrollView
                            contentContainerStyle={styles.modalContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.modalTitle}>Add Vehicle</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Vehicle Name (e.g. My Honda)"
                                placeholderTextColor={COLORS.textSecondary}
                                value={name}
                                onChangeText={setName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Vehicle Number (e.g. MH12AB1234)"
                                placeholderTextColor={COLORS.textSecondary}
                                value={number}
                                onChangeText={setNumber}
                                autoCapitalize="characters"
                            />

                            <Text style={styles.fieldLabel}>Type</Text>
                            <View style={styles.typeRow}>
                                {TYPES.map((itemType) => (
                                    <TouchableOpacity
                                        key={itemType}
                                        style={[styles.typePill, type === itemType && styles.typePillActive]}
                                        onPress={() => setType(itemType)}
                                    >
                                        <Ionicons
                                            name={getIcon(itemType)}
                                            size={16}
                                            color={type === itemType ? COLORS.primary : COLORS.accent}
                                        />
                                        <Text
                                            style={[
                                                styles.typeText,
                                                type === itemType && styles.typeTextActive,
                                            ]}
                                        >
                                            {itemType.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.defaultToggle} onPress={() => setIsDefault(!isDefault)}>
                                <Ionicons
                                    name={isDefault ? 'checkbox' : 'square-outline'}
                                    size={22}
                                    color={COLORS.accent}
                                />
                                <Text style={styles.defaultToggleText}>Set as default vehicle</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator color={COLORS.primary} />
                                ) : (
                                    <Text style={styles.saveBtnText}>Add Vehicle</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
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
    title: {
        ...TYPOGRAPHY.h2,
        fontWeight: '800',
        color: COLORS.text,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 0,
        paddingBottom: 36,
    },
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: RADIUS.lg,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBoxActive: {
        backgroundColor: COLORS.accent,
    },
    vehicleInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    vehicleName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    vehicleNumber: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    vehicleType: {
        fontSize: 11,
        color: COLORS.accent,
        fontWeight: '600',
        marginTop: 2,
    },
    defaultBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    defaultText: {
        fontSize: 10,
        color: '#4CAF50',
        fontWeight: '600',
    },
    actions: {
        gap: 12,
        alignItems: 'center',
    },
    empty: {
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
        marginTop: 6,
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modal: {
        maxHeight: '88%',
        backgroundColor: COLORS.primary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalContent: {
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 20,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: COLORS.text,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    typePillActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
    },
    typeTextActive: {
        color: COLORS.primary,
    },
    defaultToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    defaultToggleText: {
        fontSize: 14,
        color: COLORS.text,
    },
    saveBtn: {
        backgroundColor: COLORS.accent,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveBtnText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    cancelBtn: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelBtnText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
});

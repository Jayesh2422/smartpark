import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet,
    TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchVehicles, addVehicle, deleteVehicle, updateVehicle } from '../services/vehicleService';

const COLORS = {
    brown: '#6F4E37', white: '#FFFFFF', offWhite: '#F8F6F3',
    lightGray: '#E8E4E0', darkText: '#2D2016', grayText: '#8B7E74',
};
const TYPES = ['bike', 'car', 'suv'];

export default function VehiclesScreen() {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [type, setType] = useState('car');
    const [isDefault, setIsDefault] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try { const d = await fetchVehicles(user.id); setVehicles(d || []); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { load(); }, [user?.id]));

    const handleAdd = async () => {
        if (!name || !number) { Alert.alert('Error', 'Fill all fields'); return; }
        setSaving(true);
        try {
            await addVehicle({ user_id: user.id, vehicle_name: name, vehicle_number: number.toUpperCase(), vehicle_type: type, is_default: isDefault });
            setModalVisible(false); setName(''); setNumber(''); setType('car'); setIsDefault(false);
            await load();
        } catch (e) { Alert.alert('Error', e.message); } finally { setSaving(false); }
    };

    const handleDelete = (id, vName) => {
        Alert.alert('Delete Vehicle', `Remove ${vName}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteVehicle(id); await load(); } catch (e) { Alert.alert('Error', e.message); } } },
        ]);
    };

    const handleSetDefault = async (id) => {
        try { await updateVehicle(id, user.id, { is_default: true }); await load(); }
        catch (e) { Alert.alert('Error', e.message); }
    };

    const getIcon = (t) => t === 'bike' ? 'bicycle' : t === 'suv' ? 'bus' : 'car-sport';

    if (loading) return <View style={styles.loadC}><ActivityIndicator size="large" color={COLORS.brown} /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Vehicles</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={22} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={vehicles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={[styles.iconBox, item.is_default && styles.iconBoxActive]}>
                                <Ionicons name={getIcon(item.vehicle_type)} size={22} color={COLORS.white} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.vName}>{item.vehicle_name}</Text>
                                    {item.is_default && <View style={styles.defBadge}><Text style={styles.defText}>Default</Text></View>}
                                </View>
                                <Text style={styles.vNum}>{item.vehicle_number}</Text>
                                <Text style={styles.vType}>{item.vehicle_type.toUpperCase()}</Text>
                            </View>
                            <View style={styles.actions}>
                                {!item.is_default && (
                                    <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
                                        <Ionicons name="star-outline" size={20} color={COLORS.brown} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => handleDelete(item.id, item.vehicle_name)}>
                                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="car-outline" size={48} color={COLORS.lightGray} />
                        <Text style={styles.emptyTitle}>No Vehicles</Text>
                        <Text style={styles.emptyText}>Add your vehicle to start booking.</Text>
                    </View>
                }
            />

            {/* Add Vehicle Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Add Vehicle</Text>
                        <TextInput style={styles.input} placeholder="Vehicle Name (e.g. My Honda)" placeholderTextColor={COLORS.grayText} value={name} onChangeText={setName} />
                        <TextInput style={styles.input} placeholder="Vehicle Number (e.g. MH12AB1234)" placeholderTextColor={COLORS.grayText} value={number} onChangeText={setNumber} autoCapitalize="characters" />
                        <Text style={styles.fieldLabel}>Type</Text>
                        <View style={styles.typeRow}>
                            {TYPES.map((t) => (
                                <TouchableOpacity key={t} style={[styles.typePill, type === t && styles.typePillA]} onPress={() => setType(t)}>
                                    <Ionicons name={getIcon(t)} size={16} color={type === t ? COLORS.white : COLORS.brown} />
                                    <Text style={[styles.typeText, type === t && { color: COLORS.white }]}>{t.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.defToggle} onPress={() => setIsDefault(!isDefault)}>
                            <Ionicons name={isDefault ? 'checkbox' : 'square-outline'} size={22} color={COLORS.brown} />
                            <Text style={styles.defToggleText}>Set as default vehicle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnT}>Add Vehicle</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelBtnT}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    loadC: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.darkText },
    addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.brown, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 20, paddingTop: 0 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.lightGray },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.grayText, alignItems: 'center', justifyContent: 'center' },
    iconBoxActive: { backgroundColor: COLORS.brown },
    vName: { fontSize: 15, fontWeight: '700', color: COLORS.darkText },
    vNum: { fontSize: 13, color: COLORS.grayText, marginTop: 2 },
    vType: { fontSize: 11, color: COLORS.brown, fontWeight: '600', marginTop: 2 },
    defBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    defText: { fontSize: 10, color: '#4CAF50', fontWeight: '600' },
    actions: { gap: 12 },
    empty: { alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkText, marginTop: 12 },
    emptyText: { fontSize: 13, color: COLORS.grayText, marginTop: 6 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modal: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.darkText, marginBottom: 20 },
    input: { backgroundColor: COLORS.offWhite, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.darkText, marginBottom: 12, borderWidth: 1, borderColor: COLORS.lightGray },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.darkText, marginBottom: 8 },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.offWhite, borderWidth: 1, borderColor: COLORS.lightGray },
    typePillA: { backgroundColor: COLORS.brown, borderColor: COLORS.brown },
    typeText: { fontSize: 12, fontWeight: '600', color: COLORS.darkText },
    defToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    defToggleText: { fontSize: 14, color: COLORS.darkText },
    saveBtn: { backgroundColor: COLORS.brown, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    saveBtnT: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    cancelBtnT: { fontSize: 14, color: COLORS.grayText, fontWeight: '600' },
});

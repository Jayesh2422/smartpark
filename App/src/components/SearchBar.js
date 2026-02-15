import React, { useState, useCallback } from 'react';
import {
    View, TextInput, FlatList, Text, TouchableOpacity,
    StyleSheet, ActivityIndicator, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    brown: '#6F4E37',
    lightBrown: '#A67B5B',
    white: '#FFFFFF',
    offWhite: '#F8F6F3',
    lightGray: '#E8E4E0',
    darkText: '#2D2016',
    grayText: '#8B7E74',
};

/**
 * Subtle search bar with OpenStreetMap (Nominatim) autocomplete.
 */
export default function SearchBar({ onLocationSelect, placeholder = 'Search location...' }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const searchLocation = useCallback(async (text) => {
        setQuery(text);
        if (text.length < 3) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&countrycodes=in`,
                {
                    headers: { 'User-Agent': 'SmartParkingApp/1.0' },
                }
            );
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSelect = (item) => {
        setQuery(item.display_name.split(',')[0]);
        setResults([]);
        setExpanded(false);
        Keyboard.dismiss();
        onLocationSelect({
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            name: item.display_name,
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={18} color={COLORS.grayText} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.grayText}
                    value={query}
                    onChangeText={searchLocation}
                    onFocus={() => setExpanded(true)}
                />
                {loading && <ActivityIndicator size="small" color={COLORS.brown} />}
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                        <Ionicons name="close-circle" size={18} color={COLORS.grayText} />
                    </TouchableOpacity>
                )}
            </View>

            {expanded && results.length > 0 && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.place_id?.toString()}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.resultItem}
                                onPress={() => handleSelect(item)}
                            >
                                <Ionicons name="location-outline" size={16} color={COLORS.brown} />
                                <Text style={styles.resultText} numberOfLines={2}>
                                    {item.display_name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.offWhite,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: COLORS.darkText,
        padding: 0,
    },
    dropdown: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
        maxHeight: 220,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.offWhite,
    },
    resultText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.darkText,
        lineHeight: 18,
    },
});

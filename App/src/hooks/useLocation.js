import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

/**
 * Custom hook for getting the user's current location.
 */
export function useLocation() {
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    setLoading(false);
                    // Default to Pune, India
                    setLocation({ latitude: 18.5204, longitude: 73.8567 });
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                setLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });
            } catch (error) {
                setErrorMsg('Could not fetch location');
                // Default to Pune, India
                setLocation({ latitude: 18.5204, longitude: 73.8567 });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return { location, errorMsg, loading };
}

/**
 * Calculate distance between two coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Filter parkings within a given radius from a point.
 * @param {Array} parkings - Array of parking objects with lat/lng
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in km
 * @returns {Array} Filtered parkings with distance added
 */
export function filterByRadius(parkings, lat, lng, radiusKm) {
    return parkings
        .map((parking) => ({
            ...parking,
            distance: calculateDistance(lat, lng, parking.lat, parking.lng),
        }))
        .filter((parking) => parking.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
}

/**
 * Allocate the best available slot based on vehicle type, distance, and duration.
 * Formula: slotScore = (sizeCompatibility × 0.5) + (distanceFactor × 0.3) + (durationSuitability × 0.2)
 *
 * @param {Array} slots - Array of slot objects from the database
 * @param {string} vehicleType - 'bike', 'car', or 'suv'
 * @param {number} durationHours - Expected parking duration in hours
 * @returns {Object|null} Best slot or null if none available
 */
export function allocateBestSlot(slots, vehicleType = 'car', durationHours = 1) {
    // Filter only available slots
    const availableSlots = slots.filter((slot) => slot.status === 'available');
    if (availableSlots.length === 0) return null;

    // Find max distance for normalization
    const maxDistance = Math.max(...availableSlots.map((s) => s.distance_from_entrance || 0), 1);

    const scored = availableSlots.map((slot) => {
        // 1. Size Compatibility (0.5 weight)
        const sizeCompatibility = getSizeCompatibility(slot.size, vehicleType);

        // 2. Distance Factor (0.3 weight) - closer to entrance is better (lower score = better)
        const distanceFactor = (slot.distance_from_entrance || 0) / maxDistance;

        // 3. Duration Suitability (0.2 weight)
        // Short stays (<1h) → prefer close slots (ground floor)
        // Long stays (>3h) → farther slots acceptable
        const durationSuitability = getDurationSuitability(slot, durationHours);

        const score =
            sizeCompatibility * 0.5 +
            distanceFactor * 0.3 +
            durationSuitability * 0.2;

        return {
            ...slot,
            score: Math.round(score * 1000) / 1000,
            scoreBreakdown: {
                sizeCompatibility,
                distanceFactor,
                durationSuitability,
            },
        };
    });

    // Sort by score (lowest = best)
    scored.sort((a, b) => a.score - b.score);

    // Return the best slot
    return scored[0] || null;
}

/**
 * Calculate size compatibility between slot and vehicle.
 * Perfect match = 0, compatible = 0.3, incompatible = 1.0
 */
function getSizeCompatibility(slotSize, vehicleType) {
    const sizeOrder = { bike: 1, car: 2, suv: 3 };
    const slotRank = sizeOrder[slotSize] || 2;
    const vehicleRank = sizeOrder[vehicleType] || 2;

    if (slotRank === vehicleRank) return 0; // Perfect match
    if (slotRank > vehicleRank) return 0.3; // Slot bigger than needed (ok but not ideal)
    return 1.0; // Slot too small - penalize heavily
}

/**
 * Calculate duration suitability for a slot.
 * Short stays prefer ground floor, close slots.
 * Long stays are ok with farther, upper floor slots.
 */
function getDurationSuitability(slot, durationHours) {
    const floor = slot.floor || 0;

    if (durationHours <= 1) {
        // Short stay: prefer ground floor, close to entrance
        return floor * 0.5; // Higher floors penalized more
    } else if (durationHours <= 3) {
        // Medium stay: slight preference for lower floors
        return floor * 0.3;
    } else {
        // Long stay: any floor is fine
        return floor * 0.1;
    }
}

/**
 * Get available slots of a specific size from a list.
 * @param {Array} slots - All slots
 * @param {string} vehicleType - Vehicle type filter
 * @returns {Array} Compatible available slots
 */
export function getCompatibleSlots(slots, vehicleType) {
    const sizeOrder = { bike: 1, car: 2, suv: 3 };
    const vehicleRank = sizeOrder[vehicleType] || 2;

    return slots.filter((slot) => {
        if (slot.status !== 'available') return false;
        const slotRank = sizeOrder[slot.size] || 2;
        return slotRank >= vehicleRank; // Slot must be same size or bigger
    });
}

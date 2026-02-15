/**
 * Calculate a smart score for each parking to rank alternatives.
 * Lower score = better parking.
 * Formula: score = (normalizedDistance × 0.4) + (normalizedPrice × 0.3) - (normalizedAvailability × 0.3)
 *
 * @param {Array} parkings - Array of parking objects with distance, dynamicPrice, and available slots
 * @param {Object} selectedParking - The currently selected parking (for comparison)
 * @returns {Array} Scored and sorted parkings with explanation strings
 */
export function calculateParkingScores(parkings, selectedParking = null) {
    if (!parkings || parkings.length === 0) return [];

    // Find max values for normalization
    const maxDistance = Math.max(...parkings.map((p) => p.distance || 0), 1);
    const maxPrice = Math.max(...parkings.map((p) => p.dynamicPrice || 0), 1);
    const maxSlots = Math.max(...parkings.map((p) => getAvailableSlots(p) || 0), 1);

    const scored = parkings.map((parking) => {
        const available = getAvailableSlots(parking);
        const normalizedDistance = (parking.distance || 0) / maxDistance;
        const normalizedPrice = (parking.dynamicPrice || 0) / maxPrice;
        const normalizedAvailability = available / maxSlots;

        const score =
            normalizedDistance * 0.4 +
            normalizedPrice * 0.3 -
            normalizedAvailability * 0.3;

        return {
            ...parking,
            score: Math.round(score * 1000) / 1000,
            availableSlots: available,
        };
    });

    // Sort by score (lowest = best)
    scored.sort((a, b) => a.score - b.score);

    // Add tags
    if (scored.length > 0) {
        scored[0].tags = [...(scored[0].tags || []), 'Best Overall'];
    }

    const cheapest = [...scored].sort((a, b) => (a.dynamicPrice || 0) - (b.dynamicPrice || 0))[0];
    if (cheapest) {
        cheapest.tags = [...(cheapest.tags || []), 'Cheapest'];
    }

    const closest = [...scored].sort((a, b) => (a.distance || 0) - (b.distance || 0))[0];
    if (closest) {
        closest.tags = [...(closest.tags || []), 'Closest'];
    }

    // Generate explanations for alternatives
    if (selectedParking) {
        scored.forEach((parking) => {
            if (parking.id !== selectedParking.id) {
                parking.explanation = generateExplanation(parking, selectedParking);
            }
        });
    }

    return scored;
}

/**
 * Get the best alternative parking suggestion.
 * @param {Array} parkings - Scored parkings
 * @param {string} excludeId - ID of the parking to exclude (current selection)
 * @returns {Object|null} Best alternative parking with explanation
 */
export function getBestAlternative(parkings, excludeId) {
    const alternatives = parkings.filter((p) => p.id !== excludeId && getAvailableSlots(p) > 0);
    if (alternatives.length === 0) return null;
    return alternatives[0]; // Already sorted by score
}

function getAvailableSlots(parking) {
    return Math.max(0, (parking.total_slots || 0) - (parking.occupied_slots || 0));
}

function generateExplanation(alternative, selected) {
    const parts = [];
    const priceDiff = (selected.dynamicPrice || 0) - (alternative.dynamicPrice || 0);
    const distDiff = (selected.distance || 0) - (alternative.distance || 0);

    if (priceDiff > 0) {
        parts.push(`₹${Math.round(priceDiff)} cheaper`);
    }
    if (distDiff > 0) {
        parts.push(`${Math.abs(distDiff).toFixed(1)}km closer`);
    }
    if (alternative.availableSlots > getAvailableSlots(selected)) {
        parts.push(`${alternative.availableSlots} slots available`);
    }

    if (parts.length === 0) return 'A good alternative nearby.';
    return `${alternative.name} is ${parts.join(' and ')}.`;
}

/**
 * Calculate dynamic price based on multiple factors.
 * Formula: finalPrice = basePrice × holidayFactor × weekendFactor × occupancyFactor × durationDiscount
 *
 * @param {Object} params
 * @param {number} params.basePrice - Base price per hour (default ₹20)
 * @param {number} params.durationHours - Duration in hours
 * @param {number} params.holidayMultiplier - Holiday multiplier (1.0 if not holiday)
 * @param {boolean} params.isWeekend - Whether the booking date is Saturday/Sunday
 * @param {number} params.occupiedSlots - Number of occupied slots
 * @param {number} params.totalSlots - Total number of slots
 * @returns {Object} { finalPrice, pricePerHour, breakdown }
 */
export function calculateDynamicPrice({
    basePrice = 20,
    durationHours = 1,
    holidayMultiplier = 1.0,
    isWeekend = false,
    occupiedSlots = 0,
    totalSlots = 1,
}) {
    // 1. Holiday Factor
    const holidayFactor = holidayMultiplier;

    // 2. Weekend Factor (1.2x on Saturday/Sunday)
    const weekendFactor = isWeekend ? 1.2 : 1.0;

    // 3. Occupancy Factor
    const occupancyRate = totalSlots > 0 ? occupiedSlots / totalSlots : 0;
    let occupancyFactor = 1.0;
    if (occupancyRate > 0.8) {
        occupancyFactor = 1.2; // High demand
    } else if (occupancyRate < 0.3) {
        occupancyFactor = 0.9; // Low demand discount
    }

    // 4. Duration Discount (>3 hours → 0.95x)
    const durationDiscount = durationHours > 3 ? 0.95 : 1.0;

    // Calculate final price
    const pricePerHour = basePrice * holidayFactor * weekendFactor * occupancyFactor * durationDiscount;
    const finalPrice = Math.round(pricePerHour * durationHours * 100) / 100;

    return {
        finalPrice,
        pricePerHour: Math.round(pricePerHour * 100) / 100,
        breakdown: {
            basePrice,
            holidayFactor,
            weekendFactor,
            occupancyFactor,
            occupancyRate: Math.round(occupancyRate * 100),
            durationDiscount,
            durationHours,
        },
    };
}

/**
 * Check if a given date is a weekend (Saturday or Sunday).
 * @param {Date} date
 * @returns {boolean}
 */
export function isWeekendDay(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

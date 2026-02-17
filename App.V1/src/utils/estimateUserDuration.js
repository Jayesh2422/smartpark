/**
 * Estimate parking duration based on user's past bookings.
 * Uses a weighted average of user-level and parking-level history.
 *
 * @param {Array} userBookings - User's past bookings
 * @param {Array} parkingBookings - All bookings at the selected parking
 * @param {string} parkingId - ID of the selected parking (optional filter)
 * @returns {Object} { estimatedMinutes, formattedDuration, confidence, message }
 */
export function estimateUserDuration(userBookings = [], parkingBookings = [], parkingId = null) {
    // Filter user bookings for this specific parking
    const userAtParking = parkingId
        ? userBookings.filter((b) => b.parking_id === parkingId)
        : [];

    // Calculate average for each dataset
    const userAvg = getAverageDuration(userBookings);
    const userAtParkingAvg = getAverageDuration(userAtParking);
    const parkingAvg = getAverageDuration(parkingBookings);

    let estimatedMinutes;
    let confidence;
    let message;

    if (userAtParkingAvg > 0) {
        // Best case: user has history at this specific parking
        estimatedMinutes = Math.round(userAtParkingAvg * 0.6 + userAvg * 0.3 + parkingAvg * 0.1);
        confidence = 'high';
        message = `You usually park for ${formatDuration(estimatedMinutes)} here.`;
    } else if (userAvg > 0) {
        // User has general parking history
        estimatedMinutes = Math.round(userAvg * 0.7 + parkingAvg * 0.3);
        confidence = 'medium';
        message = `You usually park for ${formatDuration(estimatedMinutes)}.`;
    } else if (parkingAvg > 0) {
        // Only parking-level data available
        estimatedMinutes = Math.round(parkingAvg);
        confidence = 'low';
        message = `Most people park for ${formatDuration(estimatedMinutes)} here.`;
    } else {
        // No data, default estimate
        estimatedMinutes = 60;
        confidence = 'none';
        message = 'No history available. Estimated 1 hour.';
    }

    return {
        estimatedMinutes,
        estimatedHours: Math.round((estimatedMinutes / 60) * 10) / 10,
        formattedDuration: formatDuration(estimatedMinutes),
        confidence,
        message,
    };
}

/**
 * Calculate average duration from a list of bookings.
 * @param {Array} bookings - Bookings with duration_minutes field
 * @returns {number} Average duration in minutes, 0 if no data
 */
function getAverageDuration(bookings) {
    const valid = bookings.filter((b) => b.duration_minutes && b.duration_minutes > 0);
    if (valid.length === 0) return 0;
    const total = valid.reduce((sum, b) => sum + b.duration_minutes, 0);
    return total / valid.length;
}

/**
 * Format duration in minutes to human-readable string.
 * @param {number} minutes
 * @returns {string} e.g., "1h 30m" or "45m"
 */
export function formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
}

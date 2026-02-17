/**
 * Check if a given date is a holiday and return the multiplier.
 *
 * @param {Date} date - The date to check
 * @param {Array} holidays - Array of holiday objects from the database
 * @returns {Object} { isHoliday, holidayName, multiplier }
 */
export function getHolidayMultiplier(date, holidays = []) {
    if (!date || !holidays || holidays.length === 0) {
        return { isHoliday: false, holidayName: null, multiplier: 1.0 };
    }

    // Format date to YYYY-MM-DD for comparison
    const dateStr = formatDate(date);

    const holiday = holidays.find(
        (h) => h.is_active !== false && h.date === dateStr
    );

    if (holiday) {
        return {
            isHoliday: true,
            holidayName: holiday.name,
            multiplier: parseFloat(holiday.multiplier) || 1.5,
        };
    }

    return { isHoliday: false, holidayName: null, multiplier: 1.0 };
}

/**
 * Format a Date object to YYYY-MM-DD string.
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get upcoming holidays within the next N days.
 * @param {Array} holidays - All holidays from database
 * @param {number} days - Number of days to look ahead (default 7)
 * @returns {Array} Upcoming holidays
 */
export function getUpcomingHolidays(holidays = [], days = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = new Date(today);
    future.setDate(future.getDate() + days);

    return holidays.filter((h) => {
        const hDate = new Date(h.date);
        hDate.setHours(0, 0, 0, 0);
        return h.is_active !== false && hDate >= today && hDate <= future;
    });
}

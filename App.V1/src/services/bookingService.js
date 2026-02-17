import { supabase } from '../config/supabase';

/**
 * Create a new booking.
 */
export async function createBooking(bookingData) {
    const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/**
 * Get active bookings for a user.
 */
export async function getActiveBookings(userId) {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      parkings (name, address, lat, lng),
      slots (slot_number, size, floor),
      vehicles (vehicle_name, vehicle_number, vehicle_type)
    `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

/**
 * Complete a booking: mark as completed, archive to booking_history,
 * free the slot, and update parking occupancy.
 */
export async function completeBooking(bookingId) {
    // 1. Get the booking
    const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
    if (fetchErr) throw fetchErr;

    const endTime = new Date().toISOString();
    const startTime = new Date(booking.start_time);
    const durationMinutes = Math.round((new Date(endTime) - startTime) / 60000);

    // 2. Update booking status
    const { error: updateErr } = await supabase
        .from('bookings')
        .update({
            status: 'completed',
            end_time: endTime,
            duration_minutes: durationMinutes,
        })
        .eq('id', bookingId);
    if (updateErr) throw updateErr;

    // 3. Archive to booking_history
    const { error: archiveErr } = await supabase
        .from('booking_history')
        .insert({
            user_id: booking.user_id,
            parking_id: booking.parking_id,
            slot_id: booking.slot_id,
            vehicle_id: booking.vehicle_id,
            start_time: booking.start_time,
            end_time: endTime,
            duration_minutes: durationMinutes,
            final_price: booking.final_price,
            base_price: booking.base_price,
            applied_multipliers: booking.applied_multipliers,
            status: 'completed',
        });
    if (archiveErr) throw archiveErr;

    // 4. Free the slot
    const { error: slotErr } = await supabase
        .from('slots')
        .update({ status: 'available' })
        .eq('id', booking.slot_id);
    if (slotErr) throw slotErr;

    // 5. Decrease occupied count
    const { data: parking } = await supabase
        .from('parkings')
        .select('occupied_slots')
        .eq('id', booking.parking_id)
        .single();
    if (parking) {
        await supabase
            .from('parkings')
            .update({ occupied_slots: Math.max(0, parking.occupied_slots - 1) })
            .eq('id', booking.parking_id);
    }

    return { durationMinutes, endTime };
}

/**
 * Free slot - simply deletes the booking and frees the slot.
 */
export async function freeSlot(bookingId) {
    if (!bookingId) {
        throw new Error('Booking ID is required to free slot.');
    }

    // 1. Get the booking
    const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

    if (fetchErr) {
        throw new Error(fetchErr.message || 'Could not fetch booking.');
    }

    // Calculate duration and price for archival
    const endTime = new Date().toISOString();
    const startTime = new Date(booking.start_time);
    const durationMinutes = Math.round((new Date(endTime) - startTime) / 60000);
    const durationHours = durationMinutes / 60;
    const finalPrice = Math.round(booking.base_price * durationHours);

    // 2. Free the slot FIRST
    const { error: slotErr } = await supabase
        .from('slots')
        .update({ status: 'available' })
        .eq('id', booking.slot_id)
        .select('id, status')
        .single();

    if (slotErr) throw new Error(slotErr.message || 'Could not free the slot.');

    // 3. Decrease occupied count
    const { data: parking } = await supabase
        .from('parkings')
        .select('occupied_slots')
        .eq('id', booking.parking_id)
        .single();

    if (parking) {
        const { error: occupancyErr } = await supabase
            .from('parkings')
            .update({ occupied_slots: Math.max(0, parking.occupied_slots - 1) })
            .eq('id', booking.parking_id);
        if (occupancyErr) throw new Error(occupancyErr.message || 'Could not update parking occupancy.');
    }

    // 4. Archive into booking_history
    const { error: archiveErr } = await supabase
        .from('booking_history')
        .insert({
            user_id: booking.user_id,
            parking_id: booking.parking_id,
            slot_id: booking.slot_id,
            vehicle_id: booking.vehicle_id,
            start_time: booking.start_time,
            end_time: endTime,
            duration_minutes: durationMinutes,
            final_price: finalPrice,
            base_price: booking.base_price,
            applied_multipliers: booking.applied_multipliers,
            status: 'completed', // Or 'pending_payment' if schema allows
        });

    if (archiveErr) throw new Error(archiveErr.message || 'Could not archive booking history.');

    // 5. Delete the booking LAST
    const { error: deleteErr } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

    if (deleteErr) throw new Error(deleteErr.message || 'Could not finalize free-slot action.');

    return { success: true, finalPrice, durationMinutes };
}

/**
 * Cancel a booking.
 */
export async function cancelBooking(bookingId) {
    const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
    if (fetchErr) throw fetchErr;

    // Update booking status
    await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

    // Free the slot
    await supabase
        .from('slots')
        .update({ status: 'available' })
        .eq('id', booking.slot_id);

    // Decrease occupied count
    const { data: parking } = await supabase
        .from('parkings')
        .select('occupied_slots')
        .eq('id', booking.parking_id)
        .single();
    if (parking) {
        await supabase
            .from('parkings')
            .update({ occupied_slots: Math.max(0, parking.occupied_slots - 1) })
            .eq('id', booking.parking_id);
    }

    // Archive
    await supabase.from('booking_history').insert({
        user_id: booking.user_id,
        parking_id: booking.parking_id,
        slot_id: booking.slot_id,
        vehicle_id: booking.vehicle_id,
        start_time: booking.start_time,
        end_time: new Date().toISOString(),
        duration_minutes: 0,
        final_price: 0,
        base_price: booking.base_price,
        applied_multipliers: booking.applied_multipliers,
        status: 'cancelled',
    });
}

/**
 * Get user's booking history.
 */
export async function getBookingHistory(userId) {
    const { data, error } = await supabase
        .from('booking_history')
        .select(`
      *,
      parkings (name, address),
      vehicles (vehicle_name, vehicle_number, vehicle_type)
    `)
        .eq('user_id', userId)
        .order('archived_at', { ascending: false });
    if (error) throw error;
    return data;
}

/**
 * Get user's bookings for duration estimation.
 */
export async function getUserBookingsForEstimation(userId) {
    const { data, error } = await supabase
        .from('booking_history')
        .select('parking_id, duration_minutes')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gt('duration_minutes', 0);
    if (error) throw error;
    return data || [];
}

/**
 * Get all bookings at a parking for duration estimation.
 */
export async function getParkingBookingsForEstimation(parkingId) {
    const { data, error } = await supabase
        .from('booking_history')
        .select('duration_minutes')
        .eq('parking_id', parkingId)
        .eq('status', 'completed')
        .gt('duration_minutes', 0)
        .limit(100);
    if (error) throw error;
    return data || [];
}

/**
 * Get pending payment bookings from history.
 */
export async function getPendingPaymentBookings(userId) {
    const { data, error } = await supabase
        .from('booking_history')
        .select(`
            *,
            parkings (name, address),
            vehicles (vehicle_name, vehicle_number)
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('archived_at', { ascending: false });
    if (error) throw error;
    return data;
}

/**
 * Mark bookings as paid in history.
 */
export async function markAsPaid(historyIds) {
    if (!historyIds || historyIds.length === 0) return;

    await supabase
        .from('booking_history')
        .update({ status: 'paid' })
        .in('id', historyIds);
}

/**
 * Get user's average booking duration.
 */
export async function getUserAverageBookingDuration(userId) {
    if (!userId) return 0;
    const { data, error } = await supabase
        .from('booking_history')
        .select('duration_minutes')
        .eq('user_id', userId)
        .gt('duration_minutes', 0);

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    const total = data.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
    return Math.round(total / data.length);
}

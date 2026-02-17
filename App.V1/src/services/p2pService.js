import { supabase } from '../config/supabase';

const VEHICLE_COMPATIBILITY = {
    bike: ['bike', 'car', 'suv'],
    car: ['car', 'suv'],
    suv: ['suv'],
};

const RENTAL_WINDOW_ERROR_CODE = '23514';
const PERMISSION_ERROR_CODE = '42501';

function normalizeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function roundTo2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getReadableP2PError(error, fallbackMessage) {
    if (!error) return new Error(fallbackMessage);

    if (error.code === PERMISSION_ERROR_CODE) {
        return new Error(
            'Permission denied by current RLS policy. Apply the latest p2p SQL migration and try again.'
        );
    }

    if (error.code === RENTAL_WINDOW_ERROR_CODE) {
        return new Error('Invalid rental start/end time. End time must be after start time.');
    }

    if (typeof error.message === 'string' && error.message.includes('relation "p2p_parkings" does not exist')) {
        return new Error('p2p_parkings table is missing. Run the latest p2p SQL migration first.');
    }

    if (typeof error.message === 'string' && error.message.includes('relation "p2p_rental_history" does not exist')) {
        return new Error('p2p_rental_history table is missing. Run the latest p2p SQL migration first.');
    }

    return new Error(error.message || fallbackMessage);
}

async function getPhoneFromProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw getReadableP2PError(error, 'Unable to fetch user phone.');
    return data?.phone || null;
}

function calculateRentalAmount(listing) {
    const storedAmount = normalizeNumber(listing?.rental_total_price, 0);
    if (storedAmount > 0) return roundTo2(storedAmount);

    const startTime = listing?.rental_start_time ? new Date(listing.rental_start_time) : null;
    const endTime = listing?.rental_end_time ? new Date(listing.rental_end_time) : null;
    const diffMs = startTime && endTime ? Math.max(0, endTime.getTime() - startTime.getTime()) : 0;

    const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const months = Math.max(1, Math.ceil(days / 30));
    const units = Math.max(1, Math.round(normalizeNumber(listing?.rental_units, 0)));
    const mode = listing?.rental_duration_mode;

    if (mode === 'hourly') {
        return roundTo2(normalizeNumber(listing?.hourly_price, 0) * units);
    }
    if (mode === 'monthly') {
        return roundTo2(normalizeNumber(listing?.monthly_price, 0) * units);
    }
    if (mode === 'daily' || mode === 'range') {
        return roundTo2(normalizeNumber(listing?.daily_price, 0) * units);
    }

    if (diffMs > 30 * 24 * 60 * 60 * 1000) {
        return roundTo2(normalizeNumber(listing?.monthly_price, 0) * months);
    }
    if (diffMs > 24 * 60 * 60 * 1000) {
        return roundTo2(normalizeNumber(listing?.daily_price, 0) * days);
    }
    return roundTo2(normalizeNumber(listing?.hourly_price, 0) * hours);
}

export async function fetchAvailableP2PListings(filters = {}) {
    const { vehicleType = 'all' } = filters;
    let query = supabase
        .from('p2p_parkings')
        .select('*')
        .eq('is_rented', false)
        .order('created_at', { ascending: false });

    if (vehicleType !== 'all') {
        const compatibleSizes = VEHICLE_COMPATIBILITY[vehicleType] || [vehicleType];
        query = query.in('vehicle_size_allowed', compatibleSizes);
    }

    const { data, error } = await query;
    if (error) throw getReadableP2PError(error, 'Unable to fetch P2P listings.');
    return data || [];
}

export async function fetchMyP2PListings(ownerUserId) {
    if (!ownerUserId) throw new Error('Owner user ID is required.');

    const { data, error } = await supabase
        .from('p2p_parkings')
        .select('*')
        .eq('owner_user_id', ownerUserId)
        .order('created_at', { ascending: false });

    if (error) throw getReadableP2PError(error, 'Unable to fetch your listings.');
    return data || [];
}

export async function fetchMyActiveP2PRentals(renterUserId) {
    if (!renterUserId) throw new Error('Renter user ID is required.');

    const { data, error } = await supabase
        .from('p2p_parkings')
        .select('*')
        .eq('rented_by_user_id', renterUserId)
        .eq('is_rented', true)
        .order('rental_start_time', { ascending: false });

    if (error) throw getReadableP2PError(error, 'Unable to fetch active rentals.');
    return data || [];
}

export async function fetchMyPendingP2PPayments(renterUserId) {
    if (!renterUserId) throw new Error('Renter user ID is required.');

    const { data, error } = await supabase
        .from('p2p_rental_history')
        .select('*')
        .eq('renter_user_id', renterUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw getReadableP2PError(error, 'Unable to fetch pending payments.');
    return data || [];
}

export async function createP2PListing(payload) {
    const {
        ownerUserId,
        ownerEmail,
        locationLat,
        locationLng,
        description,
        availabilityDuration,
        vehicleSizeAllowed,
        hourlyPrice,
        dailyPrice,
        monthlyPrice,
    } = payload || {};

    if (!ownerUserId || !ownerEmail) {
        throw new Error('Owner user ID and email are required.');
    }
    if (!description || !availabilityDuration || !vehicleSizeAllowed) {
        throw new Error('Description, availability duration, and allowed vehicle size are required.');
    }

    const parsedHourlyPrice = normalizeNumber(hourlyPrice);
    const parsedDailyPrice = normalizeNumber(dailyPrice);
    const parsedMonthlyPrice = normalizeNumber(monthlyPrice);
    if (parsedHourlyPrice <= 0 || parsedDailyPrice <= 0 || parsedMonthlyPrice <= 0) {
        throw new Error('Hourly, daily, and monthly prices must be greater than zero.');
    }

    const listingInput = {
        owner_user_id: ownerUserId,
        owner_email: ownerEmail,
        location_lat: normalizeNumber(locationLat),
        location_lng: normalizeNumber(locationLng),
        description: description.trim(),
        availability_duration: availabilityDuration.trim(),
        vehicle_size_allowed: vehicleSizeAllowed,
        hourly_price: parsedHourlyPrice,
        daily_price: parsedDailyPrice,
        monthly_price: parsedMonthlyPrice,
        is_rented: false,
    };

    const { data, error } = await supabase
        .from('p2p_parkings')
        .insert(listingInput)
        .select()
        .single();

    if (error) throw getReadableP2PError(error, 'Unable to create listing.');
    return data;
}

export async function updateP2PListing(listingId, ownerUserId, updates = {}) {
    if (!listingId || !ownerUserId) {
        throw new Error('Listing ID and owner user ID are required.');
    }

    const payload = {};
    if (typeof updates.owner_email === 'string') payload.owner_email = updates.owner_email.trim();
    if (typeof updates.location_lat !== 'undefined') payload.location_lat = normalizeNumber(updates.location_lat);
    if (typeof updates.location_lng !== 'undefined') payload.location_lng = normalizeNumber(updates.location_lng);
    if (typeof updates.description === 'string') payload.description = updates.description.trim();
    if (typeof updates.availability_duration === 'string') {
        payload.availability_duration = updates.availability_duration.trim();
    }
    if (typeof updates.vehicle_size_allowed === 'string') payload.vehicle_size_allowed = updates.vehicle_size_allowed;
    if (typeof updates.hourly_price !== 'undefined') payload.hourly_price = normalizeNumber(updates.hourly_price);
    if (typeof updates.daily_price !== 'undefined') payload.daily_price = normalizeNumber(updates.daily_price);
    if (typeof updates.monthly_price !== 'undefined') payload.monthly_price = normalizeNumber(updates.monthly_price);

    const hasInvalidPrice =
        (typeof payload.hourly_price !== 'undefined' && payload.hourly_price <= 0) ||
        (typeof payload.daily_price !== 'undefined' && payload.daily_price <= 0) ||
        (typeof payload.monthly_price !== 'undefined' && payload.monthly_price <= 0);
    if (hasInvalidPrice) {
        throw new Error('Hourly, daily, and monthly prices must be greater than zero.');
    }

    const { data, error } = await supabase
        .from('p2p_parkings')
        .update(payload)
        .eq('id', listingId)
        .eq('owner_user_id', ownerUserId)
        .select()
        .maybeSingle();

    if (error) throw getReadableP2PError(error, 'Unable to update listing.');
    if (!data) throw new Error('Listing not found or not owned by this user.');
    return data;
}

export async function rentP2PListing(payload) {
    const {
        listingId,
        renterUserId,
        renterPhoneNumber,
        rentalStartTime,
        rentalEndTime,
        rentalDurationMode,
        rentalUnits,
        rentalTotalPrice,
    } = payload || {};

    if (!listingId || !renterUserId || !rentalStartTime || !rentalEndTime) {
        throw new Error('Listing, renter, and rental time range are required.');
    }

    const phoneNumber = renterPhoneNumber || (await getPhoneFromProfile(renterUserId));

    const { data, error } = await supabase
        .from('p2p_parkings')
        .update({
            is_rented: true,
            rented_by_user_id: renterUserId,
            rented_by_phone_number: phoneNumber,
            rental_start_time: rentalStartTime,
            rental_end_time: rentalEndTime,
            rental_duration_mode: rentalDurationMode || null,
            rental_units: normalizeNumber(rentalUnits, 0) || null,
            rental_total_price: normalizeNumber(rentalTotalPrice, 0) || null,
        })
        .eq('id', listingId)
        .eq('is_rented', false)
        .select()
        .maybeSingle();

    if (error) throw getReadableP2PError(error, 'Unable to rent listing.');
    if (!data) {
        throw new Error('This listing is no longer available.');
    }

    return data;
}

async function releaseP2PRental({ listingId, renterUserId, markPaid }) {
    if (!listingId || !renterUserId) {
        throw new Error('Listing ID and renter user ID are required.');
    }

    const { data: listing, error: fetchError } = await supabase
        .from('p2p_parkings')
        .select('*')
        .eq('id', listingId)
        .eq('rented_by_user_id', renterUserId)
        .eq('is_rented', true)
        .maybeSingle();

    if (fetchError) throw getReadableP2PError(fetchError, 'Unable to fetch active rental.');
    if (!listing) throw new Error('Active rental not found for this user.');

    const amount = calculateRentalAmount(listing);
    const paidAt = markPaid ? new Date().toISOString() : null;

    const historyInput = {
        listing_id: listing.id,
        owner_user_id: listing.owner_user_id,
        renter_user_id: renterUserId,
        renter_phone_number: listing.rented_by_phone_number,
        description: listing.description,
        location_lat: listing.location_lat,
        location_lng: listing.location_lng,
        vehicle_size_allowed: listing.vehicle_size_allowed,
        rental_start_time: listing.rental_start_time,
        rental_end_time: listing.rental_end_time,
        rental_duration_mode: listing.rental_duration_mode,
        rental_units: listing.rental_units,
        amount,
        status: markPaid ? 'paid' : 'pending',
        paid_at: paidAt,
    };

    const { data: history, error: historyError } = await supabase
        .from('p2p_rental_history')
        .insert(historyInput)
        .select()
        .maybeSingle();

    if (historyError) throw getReadableP2PError(historyError, 'Unable to create rental payment record.');

    const { data: released, error: updateError } = await supabase
        .from('p2p_parkings')
        .update({
            is_rented: false,
            rented_by_user_id: null,
            rented_by_phone_number: null,
            rental_start_time: null,
            rental_end_time: null,
            rental_duration_mode: null,
            rental_units: null,
            rental_total_price: null,
        })
        .eq('id', listingId)
        .eq('rented_by_user_id', renterUserId)
        .select()
        .maybeSingle();

    if (updateError) throw getReadableP2PError(updateError, 'Unable to free listing.');

    return { releasedListing: released, paymentRecord: history, amount };
}

export async function freeP2PRentalSlot(listingId, renterUserId) {
    return releaseP2PRental({ listingId, renterUserId, markPaid: false });
}

export async function payAndFreeP2PRentalSlot(listingId, renterUserId) {
    return releaseP2PRental({ listingId, renterUserId, markPaid: true });
}

export async function payPendingP2PRental(paymentRecordId, renterUserId) {
    if (!paymentRecordId || !renterUserId) {
        throw new Error('Payment record ID and renter user ID are required.');
    }

    const { data, error } = await supabase
        .from('p2p_rental_history')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
        })
        .eq('id', paymentRecordId)
        .eq('renter_user_id', renterUserId)
        .eq('status', 'pending')
        .select()
        .maybeSingle();

    if (error) throw getReadableP2PError(error, 'Unable to complete payment.');
    if (!data) throw new Error('Pending payment not found.');
    return data;
}

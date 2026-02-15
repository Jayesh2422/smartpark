SmartPark – Intelligent Parking Decision Engine

A modern smart parking mobile application that uses multi-factor decision algorithms, dynamic pricing, and optimization-based slot allocation to enhance parking efficiency.

📱 Overview

SmartPark is a React Native + Supabase powered smart parking application designed to:

Help users discover nearby parking spaces

Dynamically adjust pricing based on demand

Suggest intelligent alternatives

Optimize slot allocation based on vehicle type and duration

Improve parking efficiency using algorithm-driven logic

This system simulates a real-world intelligent parking infrastructure using structured backend design and decision-engine logic.

🎯 Key Features
📍 1. Location-Based Parking Search

Real-world location search

Adjustable search radius (1km, 3km, 5km)

Distance calculated using Haversine formula

Map view + list view

Nearby parkings dynamically filtered

🧠 2. Intelligent Parking Comparison Engine

Multi-factor scoring model:

score =
(distance × weight) +
(price × weight) -
(availability × weight)


Automatically highlights:

⭐ Best Overall

💰 Cheapest

🚶 Closest

💰 3. Dynamic Pricing Engine

Price is calculated using:

finalPrice =
basePrice × holidayFactor × weekendFactor × occupancyFactor × durationDiscount


Factors:

Holiday surge multiplier

Weekend multiplier

Occupancy-based surge

Long-duration discount

📅 4. Holiday-Based Demand Detection

Manual yearly holiday dataset

Automatic surge pricing on holidays

Holiday alert banner displayed

No external holiday API required.

⏱ 5. Smart Duration Estimator

Calculates user’s average parking duration

Calculates location-based average duration

Provides behavioral insight

Example:

“You usually park for 1h 45m.”

🔁 6. Smart Alternative Suggestion

If selected parking:

Is full

Too expensive

Too far

System suggests a better alternative with explanation:

“Parking B is ₹10 cheaper and 0.8km closer.”

🅿️ 7. Slot Allocation Optimization

Slots are assigned using weighted scoring:

slotScore =
(sizeMatch × weight) +
(distanceFactor × weight) +
(durationSuitability × weight)


Optimizes for:

Vehicle size compatibility

Proximity

Expected duration

📊 8. Occupancy-Based Intelligence

Real-time slot availability tracking

Occupancy-based pricing adjustments

Demand forecasting logic

🎨 9. Modern UI Design

White primary theme

Coffee brown accent (#6F4E37)

Rounded cards (16px radius)

Smooth animations & toggle controls

Minimal premium design

Modern segmented toggles & filter chips

🏗 Tech Stack
Frontend

React Native (Expo)

Reanimated / LayoutAnimation (for smooth UI)

Modern design system

Backend

Supabase (PostgreSQL)

Supabase Auth

Structured relational schema

Maps

Google Maps / OpenStreetMap

Used only for:

Location search

Coordinates

Map rendering

All recommendation and pricing intelligence is built manually.

🗄 Database Schema
users

id

email

created_at

parkings

id

name

lat

lng

base_price

total_slots

occupied_slots

slots

id

parking_id

size

distance_from_entrance

floor

status

bookings

id

user_id

parking_id

slot_id

start_time

end_time

duration_minutes

holidays

id

name

date

multiplier

-- ============================================
-- PARKING11 - Comprehensive Demo Parking
-- Location: Connaught Place, Delhi
-- For presentation and feature showcase
-- STARTS EMPTY - All slots available
-- ============================================

-- Insert Parking11
INSERT INTO parkings (id, name, address, lat, lng, base_price, total_slots, occupied_slots, image_url)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Parking11',
  'Connaught Place, New Delhi, Delhi 110001',
  28.6315,
  77.2167,
  30.00,
  25,
  0,
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800'
);

-- Insert 25 slots for Parking11 - ALL AVAILABLE
-- 10 Bike slots (all available)
INSERT INTO slots (parking_id, slot_number, size, distance_from_entrance, floor, status) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B1', 'bike', 10, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B2', 'bike', 12, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B3', 'bike', 14, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B4', 'bike', 16, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B5', 'bike', 18, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B6', 'bike', 20, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B7', 'bike', 22, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B8', 'bike', 24, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B9', 'bike', 26, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'B10', 'bike', 28, 0, 'available'),

-- 10 Car slots (all available)
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C1', 'car', 30, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C2', 'car', 35, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C3', 'car', 40, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C4', 'car', 45, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C5', 'car', 50, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C6', 'car', 55, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C7', 'car', 60, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C8', 'car', 65, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C9', 'car', 70, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'C10', 'car', 75, 0, 'available'),

-- 5 SUV slots (all available)
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'S1', 'suv', 80, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'S2', 'suv', 90, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'S3', 'suv', 100, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'S4', 'suv', 110, 0, 'available'),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'S5', 'suv', 120, 0, 'available');

-- ============================================
-- SEED DATA - Run AFTER schema.sql
-- ============================================

-- PARKINGS (5 locations in Pune, India)
INSERT INTO parkings (id, name, address, lat, lng, base_price, total_slots, occupied_slots) VALUES
  ('a1b2c3d4-1111-1111-1111-111111111111', 'Phoenix Mall Parking', 'Viman Nagar, Pune', 18.5679, 73.9143, 20.00, 50, 38),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'JM Road Smart Park', 'JM Road, Shivajinagar, Pune', 18.5314, 73.8446, 20.00, 30, 8),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'Hinjewadi IT Park Parking', 'Hinjewadi Phase 1, Pune', 18.5912, 73.7389, 20.00, 100, 85),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'Koregaon Park Plaza', 'Lane 6, Koregaon Park, Pune', 18.5362, 73.8938, 20.00, 20, 5),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'Swargate Metro Parking', 'Near Swargate Bus Stand, Pune', 18.5018, 73.8636, 20.00, 40, 30);

-- SLOTS for Phoenix Mall (parking 1) - 10 sample slots
INSERT INTO slots (parking_id, slot_number, size, distance_from_entrance, floor, status) VALUES
  ('a1b2c3d4-1111-1111-1111-111111111111', 'A-01', 'car', 10, 0, 'available'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'A-02', 'car', 15, 0, 'occupied'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'A-03', 'suv', 20, 0, 'available'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'A-04', 'bike', 5, 0, 'available'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'B-01', 'car', 30, 1, 'available'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'B-02', 'car', 35, 1, 'occupied'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'B-03', 'suv', 40, 1, 'available'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'B-04', 'bike', 25, 1, 'available'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'C-01', 'car', 50, 2, 'available'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'C-02', 'suv', 55, 2, 'available');

-- SLOTS for JM Road (parking 2) - 8 sample slots
INSERT INTO slots (parking_id, slot_number, size, distance_from_entrance, floor, status) VALUES
  ('a1b2c3d4-2222-2222-2222-222222222222', 'P-01', 'car', 8, 0, 'available'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'P-02', 'car', 12, 0, 'available'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'P-03', 'bike', 3, 0, 'available'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'P-04', 'suv', 18, 0, 'available'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'P-05', 'car', 22, 0, 'available'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'P-06', 'bike', 6, 0, 'available'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'P-07', 'car', 28, 0, 'occupied'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'P-08', 'suv', 32, 0, 'available');

-- SLOTS for Hinjewadi (parking 3) - 8 slots
INSERT INTO slots (parking_id, slot_number, size, distance_from_entrance, floor, status) VALUES
  ('a1b2c3d4-3333-3333-3333-333333333333', 'H-01', 'car', 15, 0, 'occupied'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'H-02', 'car', 20, 0, 'occupied'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'H-03', 'suv', 25, 0, 'available'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'H-04', 'bike', 8, 0, 'available'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'H-05', 'car', 40, 1, 'available'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'H-06', 'car', 45, 1, 'occupied'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'H-07', 'suv', 50, 1, 'occupied'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'H-08', 'bike', 35, 1, 'available');

-- SLOTS for Koregaon Park (parking 4) - 6 slots
INSERT INTO slots (parking_id, slot_number, size, distance_from_entrance, floor, status) VALUES
  ('a1b2c3d4-4444-4444-4444-444444444444', 'K-01', 'car', 5, 0, 'available'),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'K-02', 'car', 10, 0, 'available'),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'K-03', 'bike', 3, 0, 'available'),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'K-04', 'suv', 15, 0, 'available'),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'K-05', 'car', 20, 0, 'available'),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'K-06', 'bike', 8, 0, 'available');

-- SLOTS for Swargate (parking 5) - 8 slots
INSERT INTO slots (parking_id, slot_number, size, distance_from_entrance, floor, status) VALUES
  ('a1b2c3d4-5555-5555-5555-555555555555', 'S-01', 'car', 10, 0, 'available'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'S-02', 'car', 15, 0, 'occupied'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'S-03', 'bike', 5, 0, 'available'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'S-04', 'suv', 20, 0, 'available'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'S-05', 'car', 30, 1, 'available'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'S-06', 'car', 35, 1, 'occupied'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'S-07', 'bike', 25, 1, 'available'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'S-08', 'suv', 40, 1, 'available');

-- HOLIDAYS (2026 Indian Holidays)
INSERT INTO holidays (name, date, multiplier) VALUES
  ('Republic Day', '2026-01-26', 1.50),
  ('Maha Shivaratri', '2026-02-17', 1.50),
  ('Holi', '2026-03-10', 1.50),
  ('Good Friday', '2026-04-03', 1.30),
  ('Eid ul-Fitr', '2026-03-31', 1.50),
  ('Dr. Ambedkar Jayanti', '2026-04-14', 1.30),
  ('Ram Navami', '2026-04-06', 1.40),
  ('May Day', '2026-05-01', 1.30),
  ('Buddha Purnima', '2026-05-12', 1.30),
  ('Eid ul-Adha', '2026-06-07', 1.50),
  ('Independence Day', '2026-08-15', 1.50),
  ('Janmashtami', '2026-08-25', 1.40),
  ('Ganesh Chaturthi', '2026-09-08', 1.50),
  ('Mahatma Gandhi Jayanti', '2026-10-02', 1.50),
  ('Dussehra', '2026-10-12', 1.50),
  ('Diwali', '2026-10-31', 2.00),
  ('Guru Nanak Jayanti', '2026-11-08', 1.40),
  ('Christmas', '2026-12-25', 1.50);

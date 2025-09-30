-- Seed data for EV Charging Station Management System
-- Run this after the main migration

-- Insert roles
INSERT INTO roles (name) VALUES
('Driver'),
('Station Manager'),
('Admin');

-- Insert connector types
INSERT INTO connector_types (code, name, max_power_kw) VALUES
('CCS', 'Combined Charging System', 350.00),
('CHAdeMO', 'CHAdeMO Fast Charging', 150.00),
('Type2', 'Type 2 AC Charging', 22.00),
('Tesla', 'Tesla Supercharger', 250.00),
('CCS2', 'CCS Type 2', 300.00);

-- Insert payment methods
INSERT INTO payment_methods (code, name) VALUES
('CASH', 'Cash'),
('CREDIT_CARD', 'Credit Card'),
('DEBIT_CARD', 'Debit Card'),
('MOMO', 'MoMo Wallet'),
('VNPAY', 'VNPay'),
('ZALOPAY', 'ZaloPay');

-- Insert sample users
INSERT INTO users (name, email, phone, role_id) VALUES
('Nguyen Van Driver', 'driver@example.com', '+84123456789', 1),
('Tran Thi Manager', 'manager@evcharging.com', '+84123456790', 2),
('Le Van Admin', 'admin@evcharging.com', '+84123456791', 3),
('Pham Thi Customer', 'customer@email.com', '+84123456792', 1),
('Hoang Van User', 'user@email.com', '+84123456793', 1);

-- Insert sample vehicles
INSERT INTO vehicles (user_id, plate_number, battery_capacity_kwh, connector_type_id) VALUES
(1, '29A-12345', 75.5, 1), -- Driver's car with CCS
(4, '30B-67890', 64.0, 2), -- Customer's car with CHAdeMO
(5, '51C-11111', 82.0, 1); -- User's car with CCS

-- Insert sample service packages
INSERT INTO service_packages (name, description, price, duration_days, benefits) VALUES
('Basic Plan', 'Perfect for occasional charging', 0, 30, '["Standard rates", "Basic support", "Mobile app access"]'),
('Premium Plan', 'Great for regular users', 299000, 30, '["10% discount", "Priority support", "Advanced booking", "Monthly reports"]'),
('VIP Plan', 'Best for frequent travelers', 599000, 30, '["20% discount", "24/7 support", "Unlimited booking", "Concierge service"]');

-- Insert sample promotions
INSERT INTO promotions (code, description, discount_type, discount_pct, discount_amount, valid_from, valid_to, usage_limit, per_user_limit) VALUES
('WELCOME10', 'Welcome discount 10%', 'percentage', 10.00, NULL, '2024-01-01', '2024-12-31', 1000, 1),
('SUMMER50', 'Summer promotion 50k VND off', 'amount', NULL, 50000.00, '2024-06-01', '2024-08-31', 500, 3),
('NEWUSER', 'New user special 15%', 'percentage', 15.00, NULL, '2024-01-01', '2024-12-31', NULL, 1);

-- Insert sample stations
INSERT INTO stations (name, address, latitude, longitude, total_points, status) VALUES
('Central Mall Charging Hub', '123 Nguyen Hue, District 1, Ho Chi Minh City', 10.7769, 106.7009, 8, 'Available'),
('Airport Express Station', '456 Tan Son Nhat Airport, Tan Binh District, Ho Chi Minh City', 10.8231, 106.6297, 12, 'Available'),
('Tech Park Station', '789 Quang Trung Software City, District 12, Ho Chi Minh City', 10.8506, 106.6200, 6, 'Available'),
('University Hub', '321 Linh Trung, Thu Duc City, Ho Chi Minh City', 10.8700, 106.8030, 10, 'Available'),
('Highway Service Center', '555 National Highway 1A, Binh Chanh District, Ho Chi Minh City', 10.7500, 106.6000, 4, 'Available');

-- Insert charging points for each station
INSERT INTO charging_points (station_id, connector_type_id, name, status, power_kw, price_rate, idle_fee_per_min) VALUES
-- Central Mall (8 points)
(1, 1, 'CCS Point 1', 'Available', 150.00, 8500, 1000),
(1, 1, 'CCS Point 2', 'Available', 150.00, 8500, 1000),
(1, 2, 'CHAdeMO Point 1', 'Occupied', 150.00, 8500, 1000),
(1, 1, 'CCS Point 3', 'Available', 150.00, 8500, 1000),
(1, 3, 'Type2 Point 1', 'Available', 22.00, 6000, 500),
(1, 3, 'Type2 Point 2', 'Available', 22.00, 6000, 500),
(1, 1, 'CCS Point 4', 'Maintenance', 150.00, 8500, 1000),
(1, 3, 'Type2 Point 3', 'Available', 22.00, 6000, 500),

-- Airport Express (12 points)
(2, 1, 'Ultra Fast CCS 1', 'Available', 350.00, 12000, 2000),
(2, 1, 'Ultra Fast CCS 2', 'Occupied', 350.00, 12000, 2000),
(2, 1, 'Ultra Fast CCS 3', 'Available', 350.00, 12000, 2000),
(2, 1, 'Ultra Fast CCS 4', 'Available', 350.00, 12000, 2000),
(2, 2, 'CHAdeMO Fast 1', 'Available', 150.00, 9000, 1500),
(2, 2, 'CHAdeMO Fast 2', 'Occupied', 150.00, 9000, 1500),
(2, 3, 'AC Type2 1', 'Available', 22.00, 6500, 500),
(2, 3, 'AC Type2 2', 'Available', 22.00, 6500, 500),
(2, 4, 'Tesla SC 1', 'Available', 250.00, 10000, 1800),
(2, 4, 'Tesla SC 2', 'Available', 250.00, 10000, 1800),
(2, 1, 'Ultra Fast CCS 5', 'Available', 350.00, 12000, 2000),
(2, 1, 'Ultra Fast CCS 6', 'Available', 350.00, 12000, 2000),

-- Tech Park (6 points)
(3, 1, 'Tech CCS 1', 'Available', 125.00, 7500, 1000),
(3, 1, 'Tech CCS 2', 'Occupied', 125.00, 7500, 1000),
(3, 3, 'Office Type2 1', 'Available', 22.00, 5500, 300),
(3, 3, 'Office Type2 2', 'Available', 22.00, 5500, 300),
(3, 1, 'Tech CCS 3', 'Available', 125.00, 7500, 1000),
(3, 3, 'Office Type2 3', 'Available', 22.00, 5500, 300),

-- University Hub (10 points)
(4, 1, 'Student CCS 1', 'Available', 200.00, 7000, 800),
(4, 1, 'Student CCS 2', 'Available', 200.00, 7000, 800),
(4, 1, 'Student CCS 3', 'Occupied', 200.00, 7000, 800),
(4, 3, 'Campus Type2 1', 'Available', 22.00, 5000, 300),
(4, 3, 'Campus Type2 2', 'Available', 22.00, 5000, 300),
(4, 3, 'Campus Type2 3', 'Occupied', 22.00, 5000, 300),
(4, 1, 'Student CCS 4', 'Available', 200.00, 7000, 800),
(4, 3, 'Campus Type2 4', 'Available', 22.00, 5000, 300),
(4, 4, 'Tesla Uni 1', 'Available', 250.00, 9000, 1500),
(4, 4, 'Tesla Uni 2', 'Available', 250.00, 9000, 1500),

-- Highway Service (4 points)
(5, 1, 'Highway CCS 1', 'Available', 300.00, 11000, 2000),
(5, 1, 'Highway CCS 2', 'Occupied', 300.00, 11000, 2000),
(5, 2, 'Highway CHAdeMO', 'Available', 150.00, 9500, 1500),
(5, 4, 'Highway Tesla', 'Available', 250.00, 10500, 1800);

-- Insert sample bookings
INSERT INTO bookings (user_id, point_id, start_time, expire_time, status, confirmed_at, price_estimate) VALUES
(1, 1, '2024-12-20 14:00:00', '2024-12-20 16:00:00', 'Completed', '2024-12-20 13:30:00', 170000),
(4, 15, '2024-12-21 10:30:00', '2024-12-21 11:30:00', 'Completed', '2024-12-21 10:00:00', 90000),
(5, 25, '2024-12-22 09:00:00', '2024-12-22 11:00:00', 'Confirmed', '2024-12-22 08:30:00', 140000),
(1, 33, '2024-12-23 16:00:00', '2024-12-23 18:00:00', 'Pending', NULL, 220000);

-- Insert sample charging sessions
INSERT INTO charging_sessions (user_id, vehicle_id, point_id, booking_id, start_time, end_time, meter_start, meter_end, energy_consumed_kwh, cost, status) VALUES
(1, 1, 1, 1, '2024-12-20 14:05:00', '2024-12-20 15:50:00', 1000.0000, 1048.5000, 48.5000, 165000, 'Completed'),
(4, 2, 15, 2, '2024-12-21 10:35:00', '2024-12-21 11:25:00', 500.0000, 528.5000, 28.5000, 85500, 'Completed');

-- Insert sample payments
INSERT INTO payments (user_id, method_id, amount, currency, status, external_reference) VALUES
(1, 2, 165000, 'VND', 'Completed', 'TXN_20241220_001'),
(4, 4, 85500, 'VND', 'Completed', 'MOMO_20241221_002'),
(5, 3, 50000, 'VND', 'Pending', 'VNPAY_20241222_003');

-- Insert sample feedbacks
INSERT INTO feedbacks (user_id, station_id, rating, comment) VALUES
(1, 1, 5, 'Excellent service! Fast charging and clean facilities.'),
(4, 2, 4, 'Good location near airport, but a bit expensive.'),
(1, 3, 5, 'Perfect for work meetings. Great wifi and workspace.'),
(5, 4, 4, 'Student-friendly pricing. Good for university area.');

-- Insert sample notifications
INSERT INTO notifications (user_id, message, type, status) VALUES
(1, 'Your charging session has completed. Total cost: 165,000 VND', 'session', 'Sent'),
(4, 'Your booking starts in 30 minutes at Airport Express Station', 'booking', 'Sent'),
(5, 'Welcome! You have earned a 10% discount for your next session', 'promotion', 'Sent'),
(1, 'Monthly charging report is ready to view', 'report', 'Sent');

-- Insert system settings
INSERT INTO system_settings (key, value, description) VALUES
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('default_currency', 'VND', 'Default currency for payments'),
('max_booking_hours', '24', 'Maximum hours for advance booking'),
('idle_timeout_minutes', '15', 'Minutes before idle fees apply'),
('notification_email', 'support@evcharging.com', 'System notification email'),
('company_name', 'EV Charging Solutions', 'Company name for invoices');
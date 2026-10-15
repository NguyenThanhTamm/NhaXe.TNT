-- =============================================================================
-- HỆ THỐNG ĐẶT VÉ XE GIƯỜNG NẰM LIÊN TỈNH (CHUẨN HÓA 3NF)
-- HỆ QUẢN TRỊ CSDL: PostgreSQL 14+
-- FILE: init_schema_and_seed.sql
-- =============================================================================

-- Bật extension hỗ trợ UUID & mở rộng
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PHẦN 1: DỌN DẸP NẾU BẢNG ĐÃ TỒN TẠI (DROP THEO THỨ TỰ RÀNG BUỘC)
-- =============================================================================
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS booking_items CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS trip_seats CASCADE;
DROP TABLE IF EXISTS trip_pickup_drop_points CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS bus_type CASCADE;
DROP TYPE IF EXISTS trip_status CASCADE;
DROP TYPE IF EXISTS point_type CASCADE;
DROP TYPE IF EXISTS seat_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;

-- =============================================================================
-- PHẦN 2: ĐỊNH NGHĨA ENUM TYPES
-- =============================================================================
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'DRIVER', 'ADMIN');
CREATE TYPE bus_type AS ENUM ('GIUONG_NAM_36', 'GIUONG_NAM_40', 'LIMOUSINE_22', 'LIMOUSINE_34');
CREATE TYPE trip_status AS ENUM ('SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED');
CREATE TYPE point_type AS ENUM ('PICKUP', 'DROPOFF');
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'HOLDING', 'BOOKED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('VNPAY', 'MOMO', 'CASH');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- =============================================================================
-- PHẦN 3: TẠO CÁC BẢNG (3NF NORMALIZED SCHEMA)
-- =============================================================================

-- 1. BẢNG USERS (Hành khách, Tài xế, Quản trị viên)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100),
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BẢNG STATIONS (Bến xe, Trạm trung chuyển)
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    city VARCHAR(50) NOT NULL,       -- Ví dụ: Sài Gòn, Đà Lạt, Cần Thơ, Nha Trang
    address VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. BẢNG ROUTES (Tuyến đường vận chuyển)
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    destination_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    distance_km NUMERIC(6, 2) NOT NULL CHECK (distance_km > 0),
    estimated_duration_minutes INT NOT NULL CHECK (estimated_duration_minutes > 0),
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    CONSTRAINT uq_route_pair UNIQUE (origin_station_id, destination_station_id),
    CONSTRAINT chk_different_stations CHECK (origin_station_id <> destination_station_id)
);

-- 4. BẢNG BUSES (Phương tiện xe giường nằm)
CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) NOT NULL UNIQUE, -- Biển kiểm soát xe (51B-888.99)
    bus_type bus_type NOT NULL DEFAULT 'GIUONG_NAM_36',
    total_floors INT NOT NULL DEFAULT 2 CHECK (total_floors IN (1, 2)),
    floor_seats_count INT NOT NULL CHECK (floor_seats_count > 0)
);

-- 5. BẢNG TRIPS (Chuyến xe cụ thể)
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    status trip_status NOT NULL DEFAULT 'SCHEDULED',
    CONSTRAINT chk_trip_times CHECK (arrival_time > departure_time)
);

-- 6. BẢNG TRIP_PICKUP_DROP_POINTS (Điểm đón & trả khách cụ thể theo chuyến)
CREATE TABLE trip_pickup_drop_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    point_name VARCHAR(150) NOT NULL,
    point_type point_type NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    address VARCHAR(255) NOT NULL
);

-- 7. BẢNG TRIP_SEATS (Trạng thái giường của từng chuyến)
CREATE TABLE trip_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_code VARCHAR(10) NOT NULL, -- Tầng 1: A01..A18; Tầng 2: B01..B18
    floor INT NOT NULL CHECK (floor IN (1, 2)),
    row INT NOT NULL CHECK (row > 0),
    col INT NOT NULL CHECK (col IN (1, 2, 3)), -- 1: Dãy Trái, 2: Dãy Giữa, 3: Dãy Phải
    status seat_status NOT NULL DEFAULT 'AVAILABLE',
    holding_expires_at TIMESTAMPTZ,
    CONSTRAINT uq_trip_seat_code UNIQUE (trip_id, seat_code),
    CONSTRAINT uq_trip_seat_position UNIQUE (trip_id, floor, row, col)
);

-- 8. BẢNG BOOKINGS (Hóa đơn / Đơn đặt vé)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(30) NOT NULL UNIQUE, -- Mã vé duy nhất (vd: FUTA-88239)
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    customer_email VARCHAR(100),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    pickup_point_id UUID NOT NULL REFERENCES trip_pickup_drop_points(id) ON DELETE RESTRICT,
    drop_point_id UUID NOT NULL REFERENCES trip_pickup_drop_points(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    payment_method payment_method NOT NULL DEFAULT 'VNPAY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. BẢNG BOOKING_ITEMS (Chi tiết từng vé / giường nằm trong đơn đặt)
CREATE TABLE booking_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    trip_seat_id UUID NOT NULL REFERENCES trip_seats(id) ON DELETE RESTRICT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    -- RÀNG BUỘC CHỐNG DOUBLE BOOKING: Mỗi giường trong chuyến chỉ được gắn vào 1 vé duy nhất!
    CONSTRAINT uq_booking_item_seat UNIQUE (trip_seat_id)
);

-- 10. BẢNG PAYMENT_TRANSACTIONS (Lịch sử giao dịch thanh toán)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    transaction_no VARCHAR(100) NOT NULL UNIQUE,
    gateway payment_method NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    response_data JSONB,
    status transaction_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PHẦN 4: INDEXES TỐI ƯU HIỆU NĂNG TRUY VẤN
-- =============================================================================
-- 1. Index tìm kiếm chuyến theo tuyến và thời gian khởi hành
CREATE INDEX idx_trips_route_departure ON trips (route_id, departure_time);

-- 2. Index truy vấn sơ đồ và lọc trạng thái giường (AVAILABLE/HOLDING/BOOKED)
CREATE INDEX idx_trip_seats_trip_status ON trip_seats (trip_id, status);

-- 3. Index tra cứu đơn đặt vé theo số điện thoại hành khách và mã vé
CREATE INDEX idx_bookings_phone_code ON bookings (customer_phone, booking_code);

-- 4. Index hỗ trợ cron job quét và nhả các ghế bị quá hạn giữ chỗ (HOLDING)
CREATE INDEX idx_trip_seats_holding_expiry ON trip_seats (holding_expires_at) 
WHERE status = 'HOLDING';

-- =============================================================================
-- PHẦN 5: SEEDING DỮ LIỆU MẪU (SAMPLE DATA)
-- =============================================================================
DO $$
DECLARE
    v_station_sg_id UUID;
    v_station_dl_id UUID;
    v_route_id UUID;
    v_bus_id UUID;
    v_trip_id UUID;
    v_pickup_bxmt UUID;
    v_pickup_hx UUID;
    v_dropoff_dt UUID;
    v_dropoff_bxdl UUID;
    v_departure TIMESTAMPTZ;
    v_arrival TIMESTAMPTZ;
    v_r INT;
    v_c INT;
    v_seat_num INT;
    v_code VARCHAR(10);
BEGIN
    -- 1. Thêm 2 Bến xe mẫu: Sài Gòn & Đà Lạt
    INSERT INTO stations (id, name, city, address, is_active)
    VALUES 
        ('11111111-1111-1111-1111-111111111111', 'Bến xe Miền Tây', 'Sài Gòn', '395 Kinh Dương Vương, An Lạc, Bình Tân, TP.HCM', TRUE),
        ('22222222-2222-2222-2222-222222222222', 'Bến xe Liên tỉnh Đà Lạt', 'Đà Lạt', '01 Tô Hiến Thành, Phường 3, TP. Đà Lạt, Lâm Đồng', TRUE)
    RETURNING id INTO v_station_sg_id;
    v_station_sg_id := '11111111-1111-1111-1111-111111111111';
    v_station_dl_id := '22222222-2222-2222-2222-222222222222';

    -- 2. Thêm Tuyến đường: Sài Gòn ➔ Đà Lạt (Cự ly 305km, chạy ~390 phút = 6.5 giờ, giá 310.000 VNĐ)
    INSERT INTO routes (id, origin_station_id, destination_station_id, distance_km, estimated_duration_minutes, base_price)
    VALUES (
        '33333333-3333-3333-3333-333333333333',
        v_station_sg_id,
        v_station_dl_id,
        305.00,
        390,
        310000.00
    ) RETURNING id INTO v_route_id;

    -- 3. Thêm Xe khách: Giường nằm 2 tầng 36 chỗ (18 giường/tầng)
    INSERT INTO buses (id, plate_number, bus_type, total_floors, floor_seats_count)
    VALUES (
        '44444444-4444-4444-4444-444444444444',
        '51B-888.99',
        'GIUONG_NAM_36',
        2,
        18
    ) RETURNING id INTO v_bus_id;

    -- 4. Thêm 1 Chuyến xe xuất phát ngày mai lúc 22:00
    -- Tính thời điểm 22:00:00 của ngày kế tiếp theo giờ hệ thống
    v_departure := (CURRENT_DATE + INTERVAL '1 day' + TIME '22:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
    v_arrival   := v_departure + INTERVAL '390 minutes'; -- 04:30 sáng hôm sau

    INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
    VALUES (
        '55555555-5555-5555-5555-555555555555',
        v_route_id,
        v_bus_id,
        v_departure,
        v_arrival,
        310000.00,
        'SCHEDULED'
    ) RETURNING id INTO v_trip_id;

    -- 5. Thêm các điểm đón/trả mẫu dọc tuyến cho chuyến xe này
    INSERT INTO trip_pickup_drop_points (id, trip_id, point_name, point_type, scheduled_time, address)
    VALUES 
        ('66666666-6666-6666-6666-000000000001', v_trip_id, 'Bến xe Miền Tây (Bến chính)', 'PICKUP', v_departure, '395 Kinh Dương Vương, Bình Tân, TP.HCM'),
        ('66666666-6666-6666-6666-000000000002', v_trip_id, 'Văn phòng Hàng Xanh', 'PICKUP', v_departure + INTERVAL '30 minutes', '486H Điện Biên Phủ, Bình Thạnh, TP.HCM'),
        ('66666666-6666-6666-6666-000000000003', v_trip_id, 'Ngã ba Đức Trọng', 'DROPOFF', v_departure + INTERVAL '330 minutes', 'QL20, TT. Liên Nghĩa, Đức Trọng, Lâm Đồng'),
        ('66666666-6666-6666-6666-000000000004', v_trip_id, 'Bến xe Liên tỉnh Đà Lạt (Bến cuối)', 'DROPOFF', v_arrival, '01 Tô Hiến Thành, P.3, TP. Đà Lạt');

    -- 6. Tự động sinh 36 giường mẫu (18 giường Tầng 1: A01-A18 | 18 giường Tầng 2: B01-B18)
    -- Cấu hình: 6 hàng (row: 1->6), 3 cột (col: 1=Trái, 2=Giữa, 3=Phải)
    
    -- TẦNG 1: Mã A01 -> A18
    FOR v_r IN 1..6 LOOP
        FOR v_c IN 1..3 LOOP
            v_seat_num := (v_r - 1) * 3 + v_c;
            v_code := 'A' || LPAD(v_seat_num::TEXT, 2, '0');
            
            INSERT INTO trip_seats (trip_id, seat_code, floor, row, col, status, holding_expires_at)
            VALUES (v_trip_id, v_code, 1, v_r, v_c, 'AVAILABLE', NULL);
        END LOOP;
    END LOOP;

    -- TẦNG 2: Mã B01 -> B18
    FOR v_r IN 1..6 LOOP
        FOR v_c IN 1..3 LOOP
            v_seat_num := (v_r - 1) * 3 + v_c;
            v_code := 'B' || LPAD(v_seat_num::TEXT, 2, '0');
            
            INSERT INTO trip_seats (trip_id, seat_code, floor, row, col, status, holding_expires_at)
            VALUES (v_trip_id, v_code, 2, v_r, v_c, 'AVAILABLE', NULL);
        END LOOP;
    END LOOP;

    -- Thêm 1 tài khoản người dùng mẫu
    INSERT INTO users (full_name, phone_number, email, role)
    VALUES ('Nguyễn Văn Khách', '0909123456', 'khachhang@example.com', 'CUSTOMER')
    ON CONFLICT (phone_number) DO NOTHING;

    RAISE NOTICE 'Đã khởi tạo Schema và Seed dữ liệu mẫu thành công!';
END $$;

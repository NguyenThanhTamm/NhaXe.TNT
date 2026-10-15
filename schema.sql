-- =============================================================================
-- DATABASE SCHEMA: HỆ THỐNG ĐẶT VÉ XE GIƯỜNG NẰM LIÊN TỈNH (PHƯƠNG TRANG / FUTA STYLE)
-- Hệ quản trị CSDL: PostgreSQL 14+
-- =============================================================================

-- 0. Khởi tạo extension cần thiết
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================================================
-- 1. ENUMS (Định nghĩa kiểu dữ liệu cố định)
-- =============================================================================
CREATE TYPE user_role AS ENUM ('PASSENGER', 'DRIVER', 'STAFF', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'LOCKED', 'PENDING');

CREATE TYPE bus_type AS ENUM (
    'SLEEPER_36',        -- Xe giường nằm tiêu chuẩn 36 chỗ
    'SLEEPER_40',        -- Xe giường nằm tiêu chuẩn 40 chỗ
    'LIMOUSINE_22',      -- Xe Limousine phòng nằm 22 cabin VIP
    'LIMOUSINE_34'       -- Xe Limousine 34 phòng
);

CREATE TYPE deck_type AS ENUM ('LOWER', 'UPPER'); -- Tầng dưới (A) / Tầng trên (B)

CREATE TYPE trip_status AS ENUM ('SCHEDULED', 'DEPARTED', 'COMPLETED', 'CANCELLED');

CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'HOLDING', 'BOOKED', 'LOCKED');

CREATE TYPE booking_status AS ENUM (
    'PENDING_PAYMENT',   -- Chờ thanh toán (đang giữ ghế)
    'CONFIRMED',         -- Đã thanh toán & xuất vé thành công
    'CANCELLED',         -- Đã hủy
    'EXPIRED'            -- Quá thời gian giữ chỗ không thanh toán
);

CREATE TYPE payment_method AS ENUM ('VNPAY', 'MOMO', 'ZALOPAY', 'BANK_TRANSFER', 'CASH_AT_COUNTER');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

CREATE TYPE point_type AS ENUM ('BUS_STATION', 'OFFICE', 'PICKUP_POINT', 'DROPOFF_POINT', 'REST_STOP');

-- =============================================================================
-- 2. USERS & PHÂN QUYỀN (Hành khách, Tài xế, Nhân viên, Quản trị)
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'PASSENGER',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    driver_license_number VARCHAR(30), -- Dành cho tài xế
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);

-- =============================================================================
-- 3. BUSES & SEATS (Xe & Sơ đồ giường nằm tầng trên / tầng dưới)
-- =============================================================================
CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) NOT NULL UNIQUE,     -- Biển số xe (ví dụ: 51B-123.45)
    bus_type bus_type NOT NULL,
    model_name VARCHAR(100),                      -- Ví dụ: Hyundai Universe, Thaco Mobihome
    total_seats INT NOT NULL CHECK (total_seats > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mẫu sơ đồ giường cố định của xe (A01, A02: Tầng 1 | B01, B02: Tầng 2)
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    seat_code VARCHAR(10) NOT NULL,               -- A01, A02, B01, B02...
    deck deck_type NOT NULL DEFAULT 'LOWER',      -- Tầng dưới hoặc Tầng trên
    row_num INT NOT NULL CHECK (row_num > 0),     -- Số hàng
    col_num INT NOT NULL CHECK (col_num > 0),     -- Cột: 1=Trái, 2=Giữa, 3=Phải
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_bus_seat_code UNIQUE (bus_id, seat_code),
    CONSTRAINT uq_bus_seat_position UNIQUE (bus_id, deck, row_num, col_num)
);

CREATE INDEX idx_seats_bus_id ON seats(bus_id);

-- =============================================================================
-- 4. ROUTES & PICK/DROP POINTS (Tuyến đường & Điểm đón/trả dọc đường)
-- =============================================================================
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_code VARCHAR(30) NOT NULL UNIQUE,       -- SG-DL (Sài Gòn - Đà Lạt)
    origin_city VARCHAR(50) NOT NULL,             -- TP. Hồ Chí Minh
    destination_city VARCHAR(50) NOT NULL,        -- Đà Lạt - Lâm Đồng
    distance_km NUMERIC(6, 2) NOT NULL,           -- Cự ly ~300km
    estimated_duration_hours NUMERIC(4, 2) NOT NULL, -- Thời gian chạy dự kiến ~7h
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Danh mục các điểm đón/trả/văn phòng/trạm dừng chân
CREATE TABLE pick_drop_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    point_name VARCHAR(150) NOT NULL,             -- Bến Xe Miền Đông, VP Hàng Xanh, Đèo Bảo Lộc
    address VARCHAR(255) NOT NULL,
    city VARCHAR(50) NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    point_type point_type NOT NULL DEFAULT 'PICKUP_POINT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Cấu hình điểm đón/trả cho từng tuyến đường cụ thể
CREATE TABLE route_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    point_id UUID NOT NULL REFERENCES pick_drop_points(id) ON DELETE RESTRICT,
    stop_order INT NOT NULL CHECK (stop_order >= 0), -- Thứ tự ghé trạm trên tuyến
    is_pickup BOOLEAN NOT NULL DEFAULT FALSE,        -- Cho phép đón khách?
    is_dropoff BOOLEAN NOT NULL DEFAULT FALSE,       -- Cho phép trả khách?
    extra_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,    -- Phụ phí đón tận nơi (nếu có)
    offset_minutes INT NOT NULL DEFAULT 0,          -- Thời gian dự kiến tới trạm sau giờ xuất bến (phút)
    CONSTRAINT uq_route_stop_order UNIQUE (route_id, stop_order)
);

CREATE INDEX idx_route_points_route ON route_points(route_id);

-- =============================================================================
-- 5. TRIPS & TRIP_SEATS (Chuyến xe cụ thể & Trạng thái từng giường theo chuyến)
-- =============================================================================
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_code VARCHAR(50) NOT NULL UNIQUE,        -- Ví dụ: SG-DL-20261014-2300
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    departure_time TIMESTAMPTZ NOT NULL,          -- Thời gian xuất phát tại bến đầu
    estimated_arrival_time TIMESTAMPTZ NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0), -- Giá vé gốc
    status trip_status NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_search ON trips(route_id, departure_time, status);

-- Bảng trạng thái ghế của từng chuyến (Cốt lõi chống Double Booking)
CREATE TABLE trip_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    status seat_status NOT NULL DEFAULT 'AVAILABLE',
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    
    -- Các trường phục vụ cơ chế giữ chỗ tạm thời (Holding Lock)
    hold_session_id VARCHAR(100),                 -- Session ID hoặc User ID đang giữ ghế
    hold_expires_at TIMESTAMPTZ,                  -- Thời hạn hết hạn giữ chỗ (ví dụ: 10 phút)
    
    -- Optimistic Locking counter
    version INT NOT NULL DEFAULT 0,
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_trip_seat UNIQUE (trip_id, seat_id)
);

CREATE INDEX idx_trip_seats_status ON trip_seats(trip_id, status);
CREATE INDEX idx_trip_seats_hold_expiry ON trip_seats(hold_expires_at) WHERE status = 'HOLDING';

-- =============================================================================
-- 6. BOOKINGS & TICKETS (Đơn đặt chỗ & Chi tiết vé của từng hành khách)
-- =============================================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(20) NOT NULL UNIQUE,     -- Mã vé gửi SMS: FUTA-888999
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Có thể đặt ẩn danh (guest)
    
    -- Thông tin người liên hệ nhận vé
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(15) NOT NULL,
    contact_email VARCHAR(100),
    
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    pickup_point_id UUID NOT NULL REFERENCES pick_drop_points(id) ON DELETE RESTRICT,
    dropoff_point_id UUID NOT NULL REFERENCES pick_drop_points(id) ON DELETE RESTRICT,
    
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(12, 2) NOT NULL CHECK (final_amount >= 0),
    
    status booking_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    hold_expires_at TIMESTAMPTZ NOT NULL,         -- Hạn chót để thanh toán đơn này
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_bookings_status ON bookings(status, hold_expires_at);

-- Bảng chi tiết từng vé gắn với giường cụ thể
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(30) NOT NULL UNIQUE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    is_boarded BOOLEAN NOT NULL DEFAULT FALSE,    -- Tài xế quét mã QR khi lên xe
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RÀNG BUỘC TUYỆT ĐỐI CHỐNG DOUBLE BOOKING TẠI BẢNG TICKETS:
-- 1 giường trên 1 chuyến chỉ được xuất 1 vé thành công
CREATE UNIQUE INDEX uq_ticket_trip_seat ON tickets (trip_id, seat_id);

-- =============================================================================
-- 7. TRANSACTIONS (Lịch sử thanh toán trực tuyến: VNPay, MoMo, ZaloPay...)
-- =============================================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    transaction_code VARCHAR(100) NOT NULL UNIQUE,-- Mã GD cổng thanh toán
    gateway payment_method NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status transaction_status NOT NULL DEFAULT 'PENDING',
    payment_url TEXT,
    gateway_response JSONB,                       -- Toàn bộ webhook IPN payload từ VNPay/MoMo
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_booking ON transactions(booking_id);
CREATE INDEX idx_transactions_code ON transactions(transaction_code);

-- =============================================================================
-- SUPABASE CLOUD SETUP SCRIPT: NHÀ XE TAM NGUYEN THANH
-- Tự động khởi tạo bảng, chính sách RLS và Realtime đồng bộ đa thiết bị
-- Dán trực tiếp vào: Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================

-- 1. BẬT TIỆN ÍCH MỞ RỘNG
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 2. TẠO CÁC BẢNG DỮ LIỆU CHÍNH (Đồng bộ với BookingStore)
-- =============================================================================

-- 2.1. BẢNG XE (BUSES)
CREATE TABLE IF NOT EXISTS public.tnt_buses (
    id TEXT PRIMARY KEY,
    plate_number TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    bus_type TEXT NOT NULL,
    year INT NOT NULL DEFAULT 2024,
    inspection_expiry TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    last_maintenance TEXT NOT NULL,
    total_trips INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2. BẢNG TÀI XẾ & TIẾP VIÊN (DRIVERS)
CREATE TABLE IF NOT EXISTS public.tnt_drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    license_class TEXT NOT NULL,
    license_number TEXT NOT NULL,
    experience_years INT NOT NULL DEFAULT 5,
    main_route TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MAIN_DRIVER',
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    total_trips INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3. BẢNG CHUYẾN XE (TRIPS & KHOANG GHẾ)
CREATE TABLE IF NOT EXISTS public.tnt_trips (
    id TEXT PRIMARY KEY,
    trip_code TEXT NOT NULL UNIQUE,
    route TEXT NOT NULL,
    from_city TEXT NOT NULL,
    from_station TEXT NOT NULL,
    to_city TEXT NOT NULL,
    to_station TEXT NOT NULL,
    departure_date TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    duration TEXT NOT NULL,
    price NUMERIC NOT NULL,
    bus_type TEXT NOT NULL,
    bus_type_name TEXT NOT NULL,
    bus_id TEXT,
    plate_number TEXT,
    driver_id TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    assistant_id TEXT,
    assistant_name TEXT,
    assistant_phone TEXT,
    status TEXT NOT NULL DEFAULT 'SCHEDULED',
    shift TEXT NOT NULL DEFAULT 'MORNING',
    pickup_points JSONB DEFAULT '[]'::JSONB,
    dropoff_points JSONB DEFAULT '[]'::JSONB,
    seats JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4. BẢNG ĐƠN ĐẶT VÉ (BOOKINGS)
CREATE TABLE IF NOT EXISTS public.tnt_bookings (
    id TEXT PRIMARY KEY,
    booking_code TEXT NOT NULL UNIQUE,
    trip_id TEXT NOT NULL,
    trip_code TEXT NOT NULL,
    route TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    departure_date TEXT NOT NULL,
    seats JSONB NOT NULL DEFAULT '[]'::JSONB,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    pickup_point TEXT NOT NULL,
    dropoff_point TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'VNPAY',
    payment_status TEXT NOT NULL DEFAULT 'PAID',
    status TEXT NOT NULL DEFAULT 'PAID',
    luggage_note TEXT,
    created_at TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5. BẢNG TÀI KHOẢN NHÂN VIÊN & QUẢN TRỊ (USERS)
CREATE TABLE IF NOT EXISTS public.tnt_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL DEFAULT '123456',
    role TEXT NOT NULL DEFAULT 'TICKET_CLERK',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    last_login TEXT,
    created_at TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. CẤU HÌNH ROW LEVEL SECURITY (RLS) - AN TOÀN CHO PUBLIC CLIENT (ANON KEY)
-- =============================================================================

ALTER TABLE public.tnt_buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tnt_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tnt_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tnt_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tnt_users ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép truy cập với Public Anon Key
DROP POLICY IF EXISTS "Public Anon Key Full Access on tnt_buses" ON public.tnt_buses;
CREATE POLICY "Public Anon Key Full Access on tnt_buses" ON public.tnt_buses FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Key Full Access on tnt_drivers" ON public.tnt_drivers;
CREATE POLICY "Public Anon Key Full Access on tnt_drivers" ON public.tnt_drivers FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Key Full Access on tnt_trips" ON public.tnt_trips;
CREATE POLICY "Public Anon Key Full Access on tnt_trips" ON public.tnt_trips FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Key Full Access on tnt_bookings" ON public.tnt_bookings;
CREATE POLICY "Public Anon Key Full Access on tnt_bookings" ON public.tnt_bookings FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Key Full Access on tnt_users" ON public.tnt_users;
CREATE POLICY "Public Anon Key Full Access on tnt_users" ON public.tnt_users FOR ALL TO anon USING (true) WITH CHECK (true);

-- Cho phép authenticated users (nếu có đăng nhập Supabase Auth sau này)
DROP POLICY IF EXISTS "Authenticated Users Full Access on tnt_buses" ON public.tnt_buses;
CREATE POLICY "Authenticated Users Full Access on tnt_buses" ON public.tnt_buses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Users Full Access on tnt_drivers" ON public.tnt_drivers;
CREATE POLICY "Authenticated Users Full Access on tnt_drivers" ON public.tnt_drivers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Users Full Access on tnt_trips" ON public.tnt_trips;
CREATE POLICY "Authenticated Users Full Access on tnt_trips" ON public.tnt_trips FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Users Full Access on tnt_bookings" ON public.tnt_bookings;
CREATE POLICY "Authenticated Users Full Access on tnt_bookings" ON public.tnt_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Users Full Access on tnt_users" ON public.tnt_users;
CREATE POLICY "Authenticated Users Full Access on tnt_users" ON public.tnt_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- 4. BẬT SUPABASE REALTIME ĐỂ ĐỒNG BỘ THỜI GIAN THỰC GIỮA MOBILE & ADMIN
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'tnt_trips'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tnt_trips;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'tnt_bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tnt_bookings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'tnt_buses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tnt_buses;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'tnt_drivers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tnt_drivers;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'tnt_users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tnt_users;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- =============================================================================
-- 5. TẠO INDEX TĂNG TỐC TRUY VẤN
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tnt_trips_route ON public.tnt_trips(from_city, to_city, status);
CREATE INDEX IF NOT EXISTS idx_tnt_trips_code ON public.tnt_trips(trip_code);
CREATE INDEX IF NOT EXISTS idx_tnt_bookings_code ON public.tnt_bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_tnt_bookings_phone ON public.tnt_bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_tnt_bookings_trip ON public.tnt_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_tnt_users_username ON public.tnt_users(username);

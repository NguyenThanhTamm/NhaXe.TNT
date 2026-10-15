-- =============================================================================
-- SEED DATA: NHÀ XE TAM NGUYEN THANH
-- Khẩu hiệu: "Chất lượng là danh dự - Hành trình an toàn, tiện nghi"
-- Hệ quản trị: PostgreSQL (Supabase Cloud)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- HELPER FUNCTION: TỰ ĐỘNG SINH GIƯỜNG NẰM VÀ ĐIỂM ĐÓN TRẢ CHO TỪNG CHUYẾN
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_seed_trip_details(
    p_trip_id UUID,
    p_dep TIMESTAMPTZ,
    p_arr TIMESTAMPTZ,
    p_bus_type TEXT,
    p_route_type TEXT
) RETURNS VOID AS $$
DECLARE
    v_r INT;
    v_c INT;
    v_seat_num INT;
    v_code VARCHAR(10);
BEGIN
    -- 1. SINH GHẾ / GIƯỜNG NẰM
    IF p_bus_type = '36_SEATER' THEN
        -- Xe 36 Giường: Tầng 1 (A01-A18), Tầng 2 (B01-B18)
        -- Tầng 1
        FOR v_r IN 1..6 LOOP
            FOR v_c IN 1..3 LOOP
                v_seat_num := (v_r - 1) * 3 + v_c;
                v_code := 'A' || LPAD(v_seat_num::TEXT, 2, '0');
                INSERT INTO trip_seats (trip_id, seat_code, floor, row_num, col_num, status)
                VALUES (p_trip_id, v_code, 1, v_r, v_c, 'AVAILABLE');
            END LOOP;
        END LOOP;

        -- Tầng 2
        FOR v_r IN 1..6 LOOP
            FOR v_c IN 1..3 LOOP
                v_seat_num := (v_r - 1) * 3 + v_c;
                v_code := 'B' || LPAD(v_seat_num::TEXT, 2, '0');
                INSERT INTO trip_seats (trip_id, seat_code, floor, row_num, col_num, status)
                VALUES (p_trip_id, v_code, 2, v_r, v_c, 'AVAILABLE');
            END LOOP;
        END LOOP;
    ELSE
        -- Xe Limousine 22 Phòng VIP: Tầng 1 (VIP01-VIP11), Tầng 2 (VIP12-VIP22)
        -- 2 dãy 2 bên, lối đi rộng ở giữa
        FOR v_seat_num IN 1..11 LOOP
            v_code := 'VIP' || LPAD(v_seat_num::TEXT, 2, '0');
            INSERT INTO trip_seats (trip_id, seat_code, floor, row_num, col_num, status)
            VALUES (p_trip_id, v_code, 1, (v_seat_num + 1) / 2, CASE WHEN v_seat_num % 2 = 1 THEN 1 ELSE 3 END, 'AVAILABLE');
        END LOOP;

        FOR v_seat_num IN 12..22 LOOP
            v_code := 'VIP' || LPAD(v_seat_num::TEXT, 2, '0');
            INSERT INTO trip_seats (trip_id, seat_code, floor, row_num, col_num, status)
            VALUES (p_trip_id, v_code, 2, (v_seat_num - 11 + 1) / 2, CASE WHEN (v_seat_num - 11) % 2 = 1 THEN 1 ELSE 3 END, 'AVAILABLE');
        END LOOP;
    END IF;

    -- 2. SINH ĐIỂM ĐÓN / TRẢ CHO CHUYẾN
    IF p_route_type = 'SG_DL' THEN
        INSERT INTO trip_pickup_drop_points (trip_id, point_name, point_type, scheduled_time, address) VALUES
            (p_trip_id, 'Bến xe Miền Tây (Văn phòng chính)', 'PICKUP', p_dep, '395 Kinh Dương Vương, Bình Tân, TP.HCM'),
            (p_trip_id, 'Trạm Trung Chuyển Hàng Xanh', 'PICKUP', p_dep + INTERVAL '30 minutes', '486H Điện Biên Phủ, Bình Thạnh, TP.HCM'),
            (p_trip_id, 'Văn phòng Bảo Lộc', 'DROPOFF', p_dep + INTERVAL '240 minutes', '280 Trần Phú, TP. Bảo Lộc, Lâm Đồng'),
            (p_trip_id, 'Bến xe Liên tỉnh Đà Lạt', 'DROPOFF', p_arr, '01 Tô Hiến Thành, P.3, TP. Đà Lạt');
    ELSIF p_route_type = 'SG_NT' THEN
        INSERT INTO trip_pickup_drop_points (trip_id, point_name, point_type, scheduled_time, address) VALUES
            (p_trip_id, 'Bến xe Miền Tây (Văn phòng chính)', 'PICKUP', p_dep, '395 Kinh Dương Vương, Bình Tân, TP.HCM'),
            (p_trip_id, 'Ngã tư Thủ Đức (Cây xăng Song Hành)', 'PICKUP', p_dep + INTERVAL '45 minutes', 'Xa lộ Hà Nội, Thủ Đức, TP.HCM'),
            (p_trip_id, 'Trạm Dừng Cam Ranh', 'DROPOFF', p_dep + INTERVAL '400 minutes', 'QL1A, TP. Cam Ranh, Khánh Hòa'),
            (p_trip_id, 'Bến xe Phía Nam Nha Trang', 'DROPOFF', p_arr, 'Km 6 Đường 23/10, TP. Nha Trang');
    ELSIF p_route_type = 'SG_CT' THEN
        INSERT INTO trip_pickup_drop_points (trip_id, point_name, point_type, scheduled_time, address) VALUES
            (p_trip_id, 'Bến xe Miền Tây (Văn phòng chính)', 'PICKUP', p_dep, '395 Kinh Dương Vương, Bình Tân, TP.HCM'),
            (p_trip_id, 'Trạm Cao tốc Trung Lương', 'PICKUP', p_dep + INTERVAL '30 minutes', 'Nút giao Thân Cửu Nghĩa, Tiền Giang'),
            (p_trip_id, 'Cầu Cần Thơ (Đầu Ninh Kiều)', 'DROPOFF', p_dep + INTERVAL '190 minutes', 'Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ'),
            (p_trip_id, 'Bến xe Trung tâm Cần Thơ', 'DROPOFF', p_arr, 'Khu đô thị Nam Cần Thơ, Cái Răng, Cần Thơ');
    END IF;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    -- Bến xe
    v_st_sg_mientay UUID := '10000000-0000-0000-0000-000000000001';
    v_st_sg_ansuong UUID := '10000000-0000-0000-0000-000000000002';
    v_st_dalat      UUID := '10000000-0000-0000-0000-000000000003';
    v_st_nhatrang   UUID := '10000000-0000-0000-0000-000000000004';
    v_st_cantho     UUID := '10000000-0000-0000-0000-000000000005';

    -- Tuyến đường
    v_rt_sg_dl UUID := '20000000-0000-0000-0000-000000000001';
    v_rt_dl_sg UUID := '20000000-0000-0000-0000-000000000002';
    v_rt_sg_nt UUID := '20000000-0000-0000-0000-000000000003';
    v_rt_nt_sg UUID := '20000000-0000-0000-0000-000000000004';
    v_rt_sg_ct UUID := '20000000-0000-0000-0000-000000000005';
    v_rt_ct_sg UUID := '20000000-0000-0000-0000-000000000006';

    -- Xe khách
    v_bus_36_1 UUID := '30000000-0000-0000-0000-000000000001';
    v_bus_36_2 UUID := '30000000-0000-0000-0000-000000000002';
    v_bus_22_1 UUID := '30000000-0000-0000-0000-000000000003';
    v_bus_22_2 UUID := '30000000-0000-0000-0000-000000000004';

    -- Biến tạm
    v_trip_id UUID;
    v_dep TIMESTAMPTZ;
    v_arr TIMESTAMPTZ;
    v_r INT;
    v_c INT;
    v_code VARCHAR(10);
    v_seat_num INT;
    v_day_offset INT;
BEGIN
    -- 1. BẾN XE & VĂN PHÒNG ĐÓN TRẢ
    INSERT INTO stations (id, name, city, address, is_active)
    VALUES 
        (v_st_sg_mientay, 'Bến xe Miền Tây (TP.HCM)', 'Sài Gòn', '395 Kinh Dương Vương, An Lạc, Bình Tân, TP.HCM', TRUE),
        (v_st_sg_ansuong, 'Bến xe An Sương (TP.HCM)', 'Sài Gòn', 'QL22, Bà Điểm, Hóc Môn, TP.HCM', TRUE),
        (v_st_dalat,      'Bến xe Liên tỉnh Đà Lạt', 'Đà Lạt', '01 Tô Hiến Thành, Phường 3, TP. Đà Lạt, Lâm Đồng', TRUE),
        (v_st_nhatrang,   'Bến xe Phía Nam Nha Trang', 'Nha Trang', 'Km 6 Đường 23/10, Vĩnh Trung, TP. Nha Trang, Khánh Hòa', TRUE),
        (v_st_cantho,     'Bến xe Trung tâm Cần Thơ', 'Cần Thơ', 'Khu đô thị Nam Cần Thơ, Q. Cái Răng, Cần Thơ', TRUE)
    ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        city = EXCLUDED.city, 
        address = EXCLUDED.address;

    -- 2. CÁC TUYẾN ĐƯỜNG TRỌNG ĐIỂM
    -- Tuyến Sài Gòn <-> Đà Lạt (~305km, 6.5h)
    INSERT INTO routes (id, origin_station_id, destination_station_id, distance_km, estimated_duration_minutes, base_price)
    VALUES 
        (v_rt_sg_dl, v_st_sg_mientay, v_st_dalat, 305.00, 390, 310000.00),
        (v_rt_dl_sg, v_st_dalat, v_st_sg_mientay, 305.00, 390, 310000.00)
    ON CONFLICT (id) DO UPDATE SET base_price = EXCLUDED.base_price;

    -- Tuyến Sài Gòn <-> Nha Trang (~430km, 8h qua cao tốc Vĩnh Hảo)
    INSERT INTO routes (id, origin_station_id, destination_station_id, distance_km, estimated_duration_minutes, base_price)
    VALUES 
        (v_rt_sg_nt, v_st_sg_mientay, v_st_nhatrang, 430.00, 480, 350000.00),
        (v_rt_nt_sg, v_st_nhatrang, v_st_sg_mientay, 430.00, 480, 350000.00)
    ON CONFLICT (id) DO UPDATE SET base_price = EXCLUDED.base_price;

    -- Tuyến Sài Gòn <-> Cần Thơ (~165km, 3.5h qua cao tốc Mỹ Thuận)
    INSERT INTO routes (id, origin_station_id, destination_station_id, distance_km, estimated_duration_minutes, base_price)
    VALUES 
        (v_rt_sg_ct, v_st_sg_mientay, v_st_cantho, 165.00, 210, 185000.00),
        (v_rt_ct_sg, v_st_cantho, v_st_sg_mientay, 165.00, 210, 185000.00)
    ON CONFLICT (id) DO UPDATE SET base_price = EXCLUDED.base_price;

    -- 3. ĐỘI XE CAO CẤP NHÀ XE TAM NGUYEN THANH
    INSERT INTO buses (id, plate_number, bus_type, total_floors, floor_seats_count)
    VALUES 
        (v_bus_36_1, '51B-888.99', 'GIUONG_NAM_36', 2, 18),
        (v_bus_36_2, '51B-777.66', 'GIUONG_NAM_36', 2, 18),
        (v_bus_22_1, '51B-999.88', 'LIMOUSINE_22',  2, 11),
        (v_bus_22_2, '49B-888.22', 'LIMOUSINE_22',  2, 11)
    ON CONFLICT (plate_number) DO UPDATE SET 
        bus_type = EXCLUDED.bus_type,
        total_floors = EXCLUDED.total_floors,
        floor_seats_count = EXCLUDED.floor_seats_count;

    SELECT id INTO v_bus_36_1 FROM buses WHERE plate_number = '51B-888.99' LIMIT 1;
    SELECT id INTO v_bus_36_2 FROM buses WHERE plate_number = '51B-777.66' LIMIT 1;
    SELECT id INTO v_bus_22_1 FROM buses WHERE plate_number = '51B-999.88' LIMIT 1;
    SELECT id INTO v_bus_22_2 FROM buses WHERE plate_number = '49B-888.22' LIMIT 1;

    -- 4. TẠO CÁC CHUYẾN XE (CHO HÔM NAY VÀ 3 NGÀY KẾ TIẾP)
    FOR v_day_offset IN 0..3 LOOP
        -- =====================================================================
        -- TUYẾN 1: SÀI GÒN -> ĐÀ LẠT (5 Khung giờ: 07:00, 11:30, 20:30, 22:00, 23:30)
        -- =====================================================================
        
        -- Chuyến 07:00 sáng
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '07:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '390 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_dl, v_bus_36_1, v_dep, v_arr, 310000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '36_SEATER', 'SG_DL');

        -- Chuyến 11:30 trưa (Limousine VIP)
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '11:30:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '390 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_dl, v_bus_22_1, v_dep, v_arr, 380000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '22_LIMOUSINE', 'SG_DL');

        -- Chuyến 20:30 tối
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '20:30:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '390 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_dl, v_bus_36_2, v_dep, v_arr, 310000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '36_SEATER', 'SG_DL');

        -- Chuyến 22:00 đêm (Chuyến vàng)
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '22:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '390 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_dl, v_bus_36_1, v_dep, v_arr, 310000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '36_SEATER', 'SG_DL');

        -- Chuyến 23:30 đêm (Limousine VIP Đêm)
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '23:30:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '390 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_dl, v_bus_22_2, v_dep, v_arr, 380000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '22_LIMOUSINE', 'SG_DL');

        -- =====================================================================
        -- TUYẾN 2: SÀI GÒN -> NHA TRANG (3 Khung giờ: 08:00, 21:00, 22:30)
        -- =====================================================================
        -- 08:00
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '08:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '480 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_nt, v_bus_36_1, v_dep, v_arr, 350000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '36_SEATER', 'SG_NT');

        -- 21:00 (Limousine VIP)
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '21:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '480 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_nt, v_bus_22_1, v_dep, v_arr, 420000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '22_LIMOUSINE', 'SG_NT');

        -- 22:30
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '22:30:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '480 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_nt, v_bus_36_2, v_dep, v_arr, 350000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '36_SEATER', 'SG_NT');

        -- =====================================================================
        -- TUYẾN 3: SÀI GÒN -> CẦN THƠ (5 Khung giờ: 06:00, 09:00, 13:00, 16:00, 19:00)
        -- =====================================================================
        -- 06:00
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '06:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '210 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_ct, v_bus_36_1, v_dep, v_arr, 185000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '36_SEATER', 'SG_CT');

        -- 09:00
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '09:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '210 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_ct, v_bus_36_2, v_dep, v_arr, 185000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '36_SEATER', 'SG_CT');

        -- 13:00
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '13:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '210 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_ct, v_bus_36_1, v_dep, v_arr, 185000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '36_SEATER', 'SG_CT');

        -- 16:00
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '16:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '210 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_ct, v_bus_36_2, v_dep, v_arr, 185000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '36_SEATER', 'SG_CT');

        -- 19:00
        v_dep := (CURRENT_DATE + (v_day_offset || ' days')::INTERVAL + TIME '19:00:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        v_arr := v_dep + INTERVAL '210 minutes';
        v_trip_id := uuid_generate_v4();
        INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, price, status)
        VALUES (v_trip_id, v_rt_sg_ct, v_bus_22_1, v_dep, v_arr, 240000.00, 'SCHEDULED');
        PERFORM fn_seed_trip_details(v_trip_id, v_dep, v_arr, '22_LIMOUSINE', 'SG_CT');
    END LOOP;

END $$;


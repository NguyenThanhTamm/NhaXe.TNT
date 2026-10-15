-- =============================================================================
-- GIẢI PHÁP CHỐNG DOUBLE BOOKING (2 NGƯỜI CÙNG ĐẶT 1 GIƯỜNG)
-- =============================================================================

-- =============================================================================
-- BƯỚC 1: TỰ ĐỘNG KHỞI TẠO GIƯỜNG (TRIP_SEATS) KHI TẠO CHUYẾN MỚI
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_generate_trip_seats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO trip_seats (trip_id, seat_id, status, price)
    SELECT 
        NEW.id, 
        s.id, 
        'AVAILABLE', 
        NEW.base_price
    FROM seats s
    WHERE s.bus_id = NEW.bus_id AND s.is_active = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_trip_seats_after_insert
AFTER INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION fn_generate_trip_seats();


-- =============================================================================
-- BƯỚC 2: ATOMIC HOLD (GIỮ CHỖ 10 PHÚT KHI KHÁCH CHỌN GHẾ)
-- Khách A và Khách B cùng bấm chọn giường A01 cùng 1 tích tắc.
-- Chỉ 1 người duy nhất có row_count = 1, người còn lại trả về 0 row!
-- =============================================================================
-- Tham số đầu vào:
-- :p_trip_id = UUID chuyến xe
-- :p_seat_id = UUID giường
-- :p_session_id = Token định danh phiên người dùng (hoặc User ID)
-- :p_hold_minutes = 10 (phút)

UPDATE trip_seats
SET 
    status = 'HOLDING',
    hold_session_id = 'session_client_A_12345',
    hold_expires_at = NOW() + INTERVAL '10 minutes',
    version = version + 1,
    updated_at = NOW()
WHERE trip_id = 'c1234567-89ab-cdef-0123-456789abcdef'
  AND seat_id = 'e1234567-89ab-cdef-0123-456789abcdef'
  AND (
      -- Điều kiện: Ghế đang trống HOẶC ghế từng bị giữ nhưng đã quá hạn 10 phút
      status = 'AVAILABLE' 
      OR (status = 'HOLDING' AND hold_expires_at < NOW())
  );

-- Backend kiểm tra:
-- If affected_rows == 0: Báo lỗi "Giường này vừa có người khác chọn, vui lòng chọn giường khác".
-- If affected_rows == 1: Thành công! Tạo Booking ở trạng thái 'PENDING_PAYMENT'.


-- =============================================================================
-- BƯỚC 3: XÁC NHẬN THANH TOÁN (PESSIMISTIC LOCKING - FOR UPDATE)
-- Khi webhook IPN từ VNPay/MoMo gọi về báo khách đã thanh toán thành công:
-- =============================================================================
CREATE OR REPLACE PROCEDURE sp_confirm_booking_payment(
    p_booking_id UUID,
    p_transaction_code VARCHAR,
    p_gateway payment_method,
    p_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_trip_id UUID;
    v_seat_id UUID;
    v_booking_status booking_status;
    v_hold_expires_at TIMESTAMPTZ;
    v_rec RECORD;
BEGIN
    -- 1. Khóa bản ghi Booking để tránh IPN gọi webhook 2 lần cùng lúc
    SELECT trip_id, status, hold_expires_at
    INTO v_trip_id, v_booking_status, v_hold_expires_at
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF v_booking_status = 'CONFIRMED' THEN
        -- Đã xử lý rồi, trả về thành công (Idempotent)
        RETURN;
    END IF;

    -- 2. Khóa cứng bản ghi ghế trong chuyến (Trip Seat) bằng FOR UPDATE
    -- Đảm bảo không ai có thể can thiệp vào ghế này trong lúc ghi vé
    FOR v_rec IN 
        SELECT ts.id, ts.seat_id, ts.status, ts.hold_session_id
        FROM trip_seats ts
        WHERE ts.trip_id = v_trip_id
          AND ts.hold_session_id = p_booking_id::text
        FOR UPDATE
    LOOP
        -- Chuyển trạng thái ghế sang ĐÃ ĐẶT (BOOKED) vĩnh viễn
        UPDATE trip_seats
        SET status = 'BOOKED',
            hold_expires_at = NULL,
            updated_at = NOW()
        WHERE id = v_rec.id;

        -- 3. Tạo vé chính thức (Nếu vi phạm UNIQUE(trip_id, seat_id) DB sẽ chặn ngay)
        INSERT INTO tickets (ticket_code, booking_id, trip_id, seat_id, price)
        VALUES (
            'TK-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8)),
            p_booking_id,
            v_trip_id,
            v_rec.seat_id,
            p_amount
        );
    END LOOP;

    -- 4. Cập nhật Booking sang CONFIRMED
    UPDATE bookings
    SET status = 'CONFIRMED',
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- 5. Cập nhật Transaction
    UPDATE transactions
    SET status = 'SUCCESS',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE booking_id = p_booking_id AND transaction_code = p_transaction_code;

END;
$$;


-- =============================================================================
-- BƯỚC 4: GIẢI PHÓNG GHẾ TREO HẾT HẠN (CRON JOB MỖI 1 PHÚT)
-- Khi khách giữ chỗ nhưng không chịu thanh toán quá 10 phút:
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_release_expired_holds()
RETURNS INT AS $$
DECLARE
    v_released_count INT;
BEGIN
    -- Cập nhật ghế quá hạn về lại AVAILABLE
    WITH updated AS (
        UPDATE trip_seats
        SET 
            status = 'AVAILABLE',
            hold_session_id = NULL,
            hold_expires_at = NULL,
            updated_at = NOW()
        WHERE status = 'HOLDING'
          AND hold_expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO v_released_count FROM updated;

    -- Cập nhật booking quá hạn về EXPIRED
    UPDATE bookings
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE status = 'PENDING_PAYMENT'
      AND hold_expires_at < NOW();

    RETURN v_released_count;
END;
$$ LANGUAGE plpgsql;

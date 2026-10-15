'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bus,
  MapPin,
  Calendar,
  Search,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  CreditCard,
  User,
  Phone,
  Mail,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  QrCode,
  Banknote,
  Navigation,
  FileText,
  Crown,
  Check,
  Tag,
  Star,
  Users,
} from 'lucide-react';
import SeatLayoutSelection, { BedSeat } from '@/components/SeatLayoutSelection';
import Navbar from '@/components/Navbar';
import PromotionsSection from '@/components/PromotionsSection';
import PopularRoutesSection from '@/components/PopularRoutesSection';
import CoreValuesSection from '@/components/CoreValuesSection';
import NewsSection from '@/components/NewsSection';
import Footer from '@/components/Footer';
import TicketLookupModal from '@/components/TicketLookupModal';
import ScheduleModal from '@/components/ScheduleModal';
import {
  getTrips,
  getTripById,
  bookSeats,
  createBooking,
  createBookingAsync,
  matchCity,
  subscribeBookingStore,
  TripDetail,
} from '@/services/bookingStore';

interface PickupDropPoint {
  id: string;
  name: string;
  timeOffset: string;
  address: string;
}

interface TripItem {
  id: string;
  tripCode: string;
  fromCity: string;
  fromStation: string;
  toCity: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  busType: 'GIUONG_NAM_36' | 'LIMOUSINE_22';
  busTypeName: string;
  availableSeats: number;
  pickupPoints: PickupDropPoint[];
  dropoffPoints: PickupDropPoint[];
}

export default function HomePage() {
  // Modal states
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Search form states
  const [ticketType, setTicketType] = useState<'ONE_WAY' | 'ROUND_TRIP'>('ONE_WAY');
  const [fromCity, setFromCity] = useState('Sài Gòn');
  const [toCity, setToCity] = useState('Đà Lạt');
  const [departureDate, setDepartureDate] = useState('2026-10-15');
  const [returnDate, setReturnDate] = useState('2026-10-17');
  const [passengerCount, setPassengerCount] = useState(1);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number; discountFixed: number } | null>(null);

  // Booking Flow States
  const [selectedTrip, setSelectedTrip] = useState<TripItem | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    seats: BedSeat[];
    totalAmount: number;
  } | null>(null);

  // Passenger form states
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [pickupPointId, setPickupPointId] = useState('');
  const [dropoffPointId, setDropoffPointId] = useState('');
  const [roadsideNote, setRoadsideNote] = useState('');
  const [isFormTouched, setIsFormTouched] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'VIETQR' | 'CASH'>('VNPAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<{
    bookingCode: string;
    trip: TripItem;
    seats: BedSeat[];
    originalAmount: number;
    discountAmount: number;
    totalAmount: number;
    passengerName: string;
    passengerPhone: string;
    pickupName: string;
    dropoffName: string;
    departureDate: string;
  } | null>(null);

  const [currentBookingCode, setCurrentBookingCode] = useState('TNT-10001');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const today = new Date();
      setDepartureDate(today.toISOString().split('T')[0]);
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 2);
      setReturnDate(nextDay.toISOString().split('T')[0]);
      setCurrentBookingCode(`TNT-${Math.floor(10000 + Math.random() * 90000)}`);
    } catch {
      // Safe fallback
    }
  }, []);

  const tripsResultRef = useRef<HTMLDivElement>(null);

  // Toast trigger helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Switch departure and destination
  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
    showToast(`Đã đổi chiều hành trình: ${toCity} ➔ ${temp}`);
  };

  // Scroll to section helper
  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Select route from Popular Routes or Schedule modal
  const handleSelectRouteFromCard = (from: string, to: string) => {
    setFromCity(from);
    setToCity(to);
    setSelectedTrip(null);
    setCheckoutData(null);
    handleScrollToSection('booking-engine');
    showToast(`Đã chọn tuyến: ${from} ➔ ${to}`);
  };

  // Apply promo code logic
  const handleApplyPromo = (code: string) => {
    const upperCode = code.trim().toUpperCase();
    setPromoCodeInput(upperCode);

    if (upperCode === 'TNTMOI20') {
      setAppliedPromo({ code: upperCode, discountPercent: 0.2, discountFixed: 0 });
      showToast('Áp dụng mã TNTMOI20 thành công: Giảm 20%');
    } else if (upperCode === 'TNTSINHVIEN') {
      setAppliedPromo({ code: upperCode, discountPercent: 0.15, discountFixed: 0 });
      showToast('Áp dụng mã TNTSINHVIEN thành công: Giảm 15%');
    } else if (upperCode === 'TNTKHUHOI50') {
      setAppliedPromo({ code: upperCode, discountPercent: 0, discountFixed: 50000 });
      showToast('Áp dụng mã TNTKHUHOI50 thành công: Giảm 50.000đ');
    } else if (upperCode === 'TNTNHOM4') {
      setAppliedPromo({ code: upperCode, discountPercent: 0.1, discountFixed: 0 });
      showToast('Áp dụng mã TNTNHOM4 thành công: Giảm 10%');
    } else {
      setAppliedPromo(null);
      showToast('Mã khuyến mãi không hợp lệ hoặc đã hết hạn.');
    }
  };

  // DANH SÁCH CHUYẾN XE CHÍNH THỨC CỦA NHÀ XE TAM NGUYEN THANH
  const allTrips: TripItem[] = useMemo(
    () => [
      // =========================================================================
      // TUYẾN 1: SÀI GÒN <-> ĐÀ LẠT
      // =========================================================================
      {
        id: 'trip-sg-dl-0700',
        tripCode: 'TNT-0700',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Đà Lạt',
        toStation: 'Bến xe Liên tỉnh Đà Lạt',
        departureTime: '07:00',
        arrivalTime: '13:30',
        duration: '6h30m',
        price: 310000,
        busType: 'GIUONG_NAM_36',
        busTypeName: 'Giường Nằm Tiêu Chuẩn 36 Chỗ',
        availableSeats: 28,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '07:00', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p2', name: 'Trạm Trung Chuyển Hàng Xanh', timeOffset: '07:30', address: '486H Điện Biên Phủ, P.21, Bình Thạnh, TP.HCM' },
          { id: 'p3', name: 'Ngã tư Thủ Đức (Cây xăng Song Hành)', timeOffset: '07:50', address: 'Xa lộ Hà Nội, TP. Thủ Đức' },
        ],
        dropoffPoints: [
          { id: 'd1', name: 'Văn phòng Bảo Lộc', timeOffset: '11:00', address: '280 Trần Phú, TP. Bảo Lộc, Lâm Đồng' },
          { id: 'd2', name: 'Đức Trọng (Ngã ba Phi Nôm)', timeOffset: '12:45', address: 'QL20, Huyện Đức Trọng, Lâm Đồng' },
          { id: 'd3', name: 'Bến xe Liên tỉnh Đà Lạt', timeOffset: '13:30', address: '01 Tô Hiến Thành, Phường 3, TP. Đà Lạt' },
        ],
      },
      {
        id: 'trip-sg-dl-1130',
        tripCode: 'TNT-1130',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Đà Lạt',
        toStation: 'Bến xe Liên tỉnh Đà Lạt',
        departureTime: '11:30',
        arrivalTime: '18:00',
        duration: '6h30m',
        price: 380000,
        busType: 'LIMOUSINE_22',
        busTypeName: 'Limousine VIP 22 Cabin Riêng Tư',
        availableSeats: 16,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '11:30', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p2', name: 'Trạm Trung Chuyển Hàng Xanh', timeOffset: '12:00', address: '486H Điện Biên Phủ, Bình Thạnh, TP.HCM' },
        ],
        dropoffPoints: [
          { id: 'd1', name: 'Văn phòng Bảo Lộc', timeOffset: '15:30', address: '280 Trần Phú, TP. Bảo Lộc, Lâm Đồng' },
          { id: 'd3', name: 'Bến xe Liên tỉnh Đà Lạt', timeOffset: '18:00', address: '01 Tô Hiến Thành, P.3, TP. Đà Lạt' },
        ],
      },
      {
        id: 'trip-sg-dl-2030',
        tripCode: 'TNT-2030',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Đà Lạt',
        toStation: 'Bến xe Liên tỉnh Đà Lạt',
        departureTime: '20:30',
        arrivalTime: '03:00',
        duration: '6h30m',
        price: 310000,
        busType: 'GIUONG_NAM_36',
        busTypeName: 'Giường Nằm Tiêu Chuẩn 36 Chỗ',
        availableSeats: 22,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '20:30', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p2', name: 'Trạm Trung Chuyển Hàng Xanh', timeOffset: '21:00', address: '486H Điện Biên Phủ, Bình Thạnh, TP.HCM' },
        ],
        dropoffPoints: [
          { id: 'd1', name: 'Văn phòng Bảo Lộc', timeOffset: '00:30', address: '280 Trần Phú, TP. Bảo Lộc' },
          { id: 'd3', name: 'Bến xe Liên tỉnh Đà Lạt', timeOffset: '03:00', address: '01 Tô Hiến Thành, P.3, TP. Đà Lạt' },
        ],
      },
      {
        id: 'trip-sg-dl-2200',
        tripCode: 'TNT-2200',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Đà Lạt',
        toStation: 'Bến xe Liên tỉnh Đà Lạt',
        departureTime: '22:00',
        arrivalTime: '04:30',
        duration: '6h30m',
        price: 310000,
        busType: 'GIUONG_NAM_36',
        busTypeName: 'Giường Nằm Tiêu Chuẩn 36 Chỗ',
        availableSeats: 19,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '22:00', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p2', name: 'Trạm Trung Chuyển Hàng Xanh', timeOffset: '22:30', address: '486H Điện Biên Phủ, Bình Thạnh, TP.HCM' },
        ],
        dropoffPoints: [
          { id: 'd1', name: 'Văn phòng Bảo Lộc', timeOffset: '02:00', address: '280 Trần Phú, TP. Bảo Lộc' },
          { id: 'd3', name: 'Bến xe Liên tỉnh Đà Lạt', timeOffset: '04:30', address: '01 Tô Hiến Thành, P.3, TP. Đà Lạt' },
        ],
      },
      {
        id: 'trip-sg-dl-2330',
        tripCode: 'TNT-2330',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Đà Lạt',
        toStation: 'Bến xe Liên tỉnh Đà Lạt',
        departureTime: '23:30',
        arrivalTime: '06:00',
        duration: '6h30m',
        price: 380000,
        busType: 'LIMOUSINE_22',
        busTypeName: 'Limousine VIP 22 Cabin Riêng Tư',
        availableSeats: 12,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '23:30', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p2', name: 'Trạm Trung Chuyển Hàng Xanh', timeOffset: '00:00', address: '486H Điện Biên Phủ, Bình Thạnh, TP.HCM' },
        ],
        dropoffPoints: [
          { id: 'd1', name: 'Văn phòng Bảo Lộc', timeOffset: '03:30', address: '280 Trần Phú, TP. Bảo Lộc' },
          { id: 'd3', name: 'Bến xe Liên tỉnh Đà Lạt', timeOffset: '06:00', address: '01 Tô Hiến Thành, P.3, TP. Đà Lạt' },
        ],
      },

      // =========================================================================
      // TUYẾN 2: ĐÀ LẠT <-> SÀI GÒN (CHIỀU NGƯỢC LẠI)
      // =========================================================================
      {
        id: 'trip-dl-sg-1300',
        tripCode: 'TNT-DL1300',
        fromCity: 'Đà Lạt',
        fromStation: 'Bến xe Liên tỉnh Đà Lạt',
        toCity: 'Sài Gòn',
        toStation: 'Bến xe Miền Tây',
        departureTime: '13:00',
        arrivalTime: '19:30',
        duration: '6h30m',
        price: 310000,
        busType: 'GIUONG_NAM_36',
        busTypeName: 'Giường Nằm Tiêu Chuẩn 36 Chỗ',
        availableSeats: 25,
        pickupPoints: [
          { id: 'p5', name: 'Bến xe Liên tỉnh Đà Lạt', timeOffset: '13:00', address: '01 Tô Hiến Thành, P.3, TP. Đà Lạt' },
          { id: 'p6', name: 'Văn phòng Bảo Lộc', timeOffset: '15:00', address: '280 Trần Phú, TP. Bảo Lộc' },
        ],
        dropoffPoints: [
          { id: 'd7', name: 'Trạm Trung Chuyển Hàng Xanh', timeOffset: '19:00', address: '486H Điện Biên Phủ, Bình Thạnh' },
          { id: 'd8', name: 'Bến xe Miền Tây', timeOffset: '19:30', address: '395 Kinh Dương Vương, Bình Tân' },
        ],
      },
      {
        id: 'trip-dl-sg-2230',
        tripCode: 'TNT-DL2230',
        fromCity: 'Đà Lạt',
        fromStation: 'Bến xe Liên tỉnh Đà Lạt',
        toCity: 'Sài Gòn',
        toStation: 'Bến xe Miền Tây',
        departureTime: '22:30',
        arrivalTime: '05:00',
        duration: '6h30m',
        price: 380000,
        busType: 'LIMOUSINE_22',
        busTypeName: 'Limousine VIP 22 Cabin Riêng Tư',
        availableSeats: 15,
        pickupPoints: [
          { id: 'p5', name: 'Bến xe Liên tỉnh Đà Lạt', timeOffset: '22:30', address: '01 Tô Hiến Thành, P.3, TP. Đà Lạt' },
          { id: 'p6', name: 'Văn phòng Bảo Lộc', timeOffset: '00:30', address: '280 Trần Phú, TP. Bảo Lộc' },
        ],
        dropoffPoints: [
          { id: 'd7', name: 'Trạm Trung Chuyển Hàng Xanh', timeOffset: '04:30', address: '486H Điện Biên Phủ, Bình Thạnh' },
          { id: 'd8', name: 'Bến xe Miền Tây', timeOffset: '05:00', address: '395 Kinh Dương Vương, Bình Tân' },
        ],
      },

      // =========================================================================
      // TUYẾN 3: SÀI GÒN <-> NHA TRANG
      // =========================================================================
      {
        id: 'trip-sg-nt-0800',
        tripCode: 'TNT-0800',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Nha Trang',
        toStation: 'Bến xe Phía Nam Nha Trang',
        departureTime: '08:00',
        arrivalTime: '16:00',
        duration: '8h00m',
        price: 350000,
        busType: 'GIUONG_NAM_36',
        busTypeName: 'Giường Nằm Tiêu Chuẩn 36 Chỗ',
        availableSeats: 26,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '08:00', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p3', name: 'Ngã tư Thủ Đức (Cây xăng Song Hành)', timeOffset: '08:45', address: 'Xa lộ Hà Nội, TP. Thủ Đức' },
        ],
        dropoffPoints: [
          { id: 'd4', name: 'Trạm Dừng Cam Ranh', timeOffset: '14:30', address: 'QL1A, TP. Cam Ranh, Khánh Hòa' },
          { id: 'd5', name: 'Bến xe Phía Nam Nha Trang', timeOffset: '16:00', address: 'Km 6 Đường 23/10, TP. Nha Trang' },
        ],
      },
      {
        id: 'trip-sg-nt-2100',
        tripCode: 'TNT-2100',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Nha Trang',
        toStation: 'Bến xe Phía Nam Nha Trang',
        departureTime: '21:00',
        arrivalTime: '05:00',
        duration: '8h00m',
        price: 420000,
        busType: 'LIMOUSINE_22',
        busTypeName: 'Limousine VIP 22 Cabin Riêng Tư',
        availableSeats: 14,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '21:00', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p3', name: 'Ngã tư Thủ Đức (Cây xăng Song Hành)', timeOffset: '21:45', address: 'Xa lộ Hà Nội, TP. Thủ Đức' },
        ],
        dropoffPoints: [
          { id: 'd4', name: 'Trạm Dừng Cam Ranh', timeOffset: '03:30', address: 'QL1A, TP. Cam Ranh, Khánh Hòa' },
          { id: 'd5', name: 'Bến xe Phía Nam Nha Trang', timeOffset: '05:00', address: 'Km 6 Đường 23/10, TP. Nha Trang' },
        ],
      },

      // =========================================================================
      // TUYẾN 4: SÀI GÒN <-> CẦN THƠ
      // =========================================================================
      {
        id: 'trip-sg-ct-0700',
        tripCode: 'TNT-CT0700',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Cần Thơ',
        toStation: 'Bến xe Trung tâm Cần Thơ',
        departureTime: '07:00',
        arrivalTime: '10:30',
        duration: '3h30m',
        price: 180000,
        busType: 'GIUONG_NAM_36',
        busTypeName: 'Giường Nằm Tiêu Chuẩn 36 Chỗ',
        availableSeats: 30,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '07:00', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p4', name: 'Trạm Thu Phí Cao Tốc Trung Lương', timeOffset: '07:30', address: 'Nút giao Thân Cửu Nghĩa, Tiền Giang' },
        ],
        dropoffPoints: [
          { id: 'd6', name: 'Cầu Cần Thơ (Đầu Ninh Kiều)', timeOffset: '10:10', address: 'Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ' },
          { id: 'd7', name: 'Bến xe Trung tâm Cần Thơ', timeOffset: '10:30', address: 'Khu đô thị Nam Cần Thơ, Cái Răng, Cần Thơ' },
        ],
      },
      {
        id: 'trip-sg-ct-1000',
        tripCode: 'TNT-CT1000',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Cần Thơ',
        toStation: 'Bến xe Trung tâm Cần Thơ',
        departureTime: '10:00',
        arrivalTime: '13:30',
        duration: '3h30m',
        price: 240000,
        busType: 'LIMOUSINE_22',
        busTypeName: 'Limousine VIP 22 Cabin Riêng Tư',
        availableSeats: 18,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '10:00', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p4', name: 'Trạm Thu Phí Cao Tốc Trung Lương', timeOffset: '10:30', address: 'Nút giao Thân Cửu Nghĩa, Tiền Giang' },
        ],
        dropoffPoints: [
          { id: 'd6', name: 'Cầu Cần Thơ (Đầu Ninh Kiều)', timeOffset: '13:10', address: 'Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ' },
          { id: 'd7', name: 'Bến xe Trung tâm Cần Thơ', timeOffset: '13:30', address: 'Khu đô thị Nam Cần Thơ, Cái Răng, Cần Thơ' },
        ],
      },
      {
        id: 'trip-sg-ct-1900',
        tripCode: 'TNT-CT1900',
        fromCity: 'Sài Gòn',
        fromStation: 'Bến xe Miền Tây',
        toCity: 'Cần Thơ',
        toStation: 'Bến xe Trung tâm Cần Thơ',
        departureTime: '19:00',
        arrivalTime: '22:30',
        duration: '3h30m',
        price: 240000,
        busType: 'LIMOUSINE_22',
        busTypeName: 'Limousine VIP 22 Cabin Riêng Tư',
        availableSeats: 15,
        pickupPoints: [
          { id: 'p1', name: 'Bến xe Miền Tây (Văn phòng chính)', timeOffset: '19:00', address: '395 Kinh Dương Vương, Bình Tân, TP.HCM' },
          { id: 'p4', name: 'Trạm Thu Phí Cao Tốc Trung Lương', timeOffset: '19:30', address: 'Nút giao Thân Cửu Nghĩa, Tiền Giang' },
        ],
        dropoffPoints: [
          { id: 'd6', name: 'Cầu Cần Thơ (Đầu Ninh Kiều)', timeOffset: '22:10', address: 'Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ' },
          { id: 'd7', name: 'Bến xe Trung tâm Cần Thơ', timeOffset: '22:30', address: 'Khu đô thị Nam Cần Thơ, Cái Răng, Cần Thơ' },
        ],
      },
    ],
    [],
  );

  // Tự động lắng nghe và đồng bộ danh sách chuyến xe từ BookingStore (Shared State)
  const [storeTrips, setStoreTrips] = useState<TripDetail[]>([]);

  useEffect(() => {
    setStoreTrips(getTrips());
    const unsubscribe = subscribeBookingStore(() => {
      setStoreTrips(getTrips());
    });
    return unsubscribe;
  }, []);

  // Lọc danh sách chuyến xe phù hợp với điểm đi và điểm đến (kết hợp store và danh mục)
  const filteredTrips = useMemo(() => {
    const mergedList: TripItem[] = [];
    const seenCodes = new Set<string>();

    storeTrips.forEach((st) => {
      seenCodes.add(st.tripCode);
      const bookedCount = st.seats.filter((s) => s.status === 'BOOKED').length;
      mergedList.push({
        id: st.id,
        tripCode: st.tripCode,
        fromCity: st.fromCity,
        fromStation: st.fromStation,
        toCity: st.toCity,
        toStation: st.toStation,
        departureTime: st.departureTime,
        arrivalTime: st.arrivalTime,
        duration: st.duration,
        price: st.price,
        busType: st.busType,
        busTypeName: st.busTypeName,
        availableSeats: st.seats.length - bookedCount,
        pickupPoints: st.pickupPoints,
        dropoffPoints: st.dropoffPoints,
      });
    });

    return mergedList.filter((trip) => {
      const matchFrom = matchCity(trip.fromCity, fromCity);
      const matchTo = matchCity(trip.toCity, toCity);
      return matchFrom && matchTo;
    });
  }, [storeTrips, fromCity, toCity]);

  // Sơ đồ ghế thực tế của chuyến đang được khách chọn
  const currentTripSeats: BedSeat[] = useMemo(() => {
    if (!selectedTrip) return [];
    const found = storeTrips.find((t) => t.id === selectedTrip.id || t.tripCode === selectedTrip.tripCode);
    if (!found) return [];
    return found.seats.map((s) => ({
      id: s.id,
      seatCode: s.seatCode,
      floor: s.floor,
      row: s.row,
      col: s.col,
      status: s.status === 'AVAILABLE' ? 'AVAILABLE' : s.status === 'HOLDING' ? 'HOLDING' : 'BOOKED',
      price: s.price,
    }));
  }, [selectedTrip, storeTrips]);

  // Validation
  const isNameValid = useMemo(() => {
    const words = passengerName.trim().split(/\s+/).filter(Boolean);
    return words.length >= 2;
  }, [passengerName]);

  const isPhoneValid = useMemo(() => {
    const vnPhoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return vnPhoneRegex.test(passengerPhone.trim());
  }, [passengerPhone]);

  const isEmailValid = useMemo(() => {
    if (!passengerEmail.trim()) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(passengerEmail.trim());
  }, [passengerEmail]);

  const isPickupValid = pickupPointId !== '';
  const isDropoffValid = dropoffPointId !== '';

  const isFormValid =
    isNameValid &&
    isPhoneValid &&
    isEmailValid &&
    isPickupValid &&
    isDropoffValid &&
    (checkoutData?.seats.length || 0) > 0;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleSelectTrip = (trip: TripItem) => {
    setSelectedTrip(trip);
    setCheckoutData(null);
    if (trip.pickupPoints.length > 0) setPickupPointId(trip.pickupPoints[0].id);
    if (trip.dropoffPoints.length > 0) setDropoffPointId(trip.dropoffPoints[0].id);
    setCurrentBookingCode(`TNT-${Math.floor(10000 + Math.random() * 90000)}`);

    // Smooth scroll to seat selector
    setTimeout(() => {
      const el = document.getElementById('seat-selection-view');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleProceedToCheckout = (selectedSeats: BedSeat[], totalAmount: number) => {
    setCheckoutData({ seats: selectedSeats, totalAmount });
    setTimeout(() => {
      const el = document.getElementById('checkout-form-view');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Tính toán số tiền giảm giá
  const calculatedDiscount = useMemo(() => {
    if (!checkoutData || !appliedPromo) return 0;
    if (appliedPromo.discountPercent > 0) {
      return Math.round(checkoutData.totalAmount * appliedPromo.discountPercent);
    }
    if (appliedPromo.discountFixed > 0) {
      return Math.min(checkoutData.totalAmount, appliedPromo.discountFixed);
    }
    return 0;
  }, [checkoutData, appliedPromo]);

  const finalTotalAmount = useMemo(() => {
    if (!checkoutData) return 0;
    return Math.max(0, checkoutData.totalAmount - calculatedDiscount);
  }, [checkoutData, calculatedDiscount]);

  // Ghi nhận đặt vé đồng bộ sang bookingStore & Supabase Cloud
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormTouched(true);

    if (!isFormValid || !checkoutData || !selectedTrip) return;

    setIsProcessing(true);
    const pickupObj = selectedTrip?.pickupPoints.find((p) => p.id === pickupPointId);
    const dropoffObj = selectedTrip?.dropoffPoints.find((d) => d.id === dropoffPointId);

    try {
      console.log('🚀 [Đặt vé] Khách hàng xác nhận đặt vé, gọi createBooking...');
      const pickupAddress = pickupObj ? `${pickupObj.name} (${pickupObj.address})` : 'Bến xe Miền Đông';
      const dropAddress = dropoffObj ? `${dropoffObj.name} (${dropoffObj.address})` : 'Bến xe Liên tỉnh Đà Lạt';

      const result = await createBooking({
        tripId: selectedTrip.id,
        seatCodes: checkoutData.seats.map((s) => s.seatCode),
        customerName: passengerName,
        customerPhone: passengerPhone,
        customerEmail: passengerEmail,
        pickupPoint: pickupAddress,
        dropPoint: dropAddress,
        dropoffPoint: dropAddress,
        totalPrice: finalTotalAmount,
        totalAmount: finalTotalAmount,
        paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'VNPAY',
        luggageNote: roadsideNote || 'Hành lý tiêu chuẩn',
        departureDate,
      });

      if (!result.success) {
        setIsProcessing(false);
        showToast(result.message || 'Lỗi đặt vé, vui lòng thử lại!');
        return;
      }

      // Cập nhật lại storeTrips ngay lập tức trên Client
      setStoreTrips(getTrips());

      setTimeout(() => {
        setIsProcessing(false);
        setBookingSuccessModal({
          bookingCode: result.bookingCode,
          trip: selectedTrip,
          seats: checkoutData.seats,
          originalAmount: checkoutData.totalAmount,
          discountAmount: calculatedDiscount,
          totalAmount: finalTotalAmount,
          passengerName,
          passengerPhone,
          pickupName: pickupObj ? `${pickupObj.name} (${pickupObj.timeOffset})` : 'Điểm đón chính',
          dropoffName: dropoffObj ? `${dropoffObj.name} (${dropoffObj.timeOffset})` : 'Bến xe đích',
          departureDate,
        });
        showToast(`Đặt vé thành công! Mã vé: ${result.bookingCode}`);
      }, 400);
    } catch (err: any) {
      setIsProcessing(false);
      alert(`Lỗi đặt vé: ${err.message}`);
    }
  };

  const handleReset = () => {
    setSelectedTrip(null);
    setCheckoutData(null);
    setBookingSuccessModal(null);
    setPassengerName('');
    setPassengerPhone('');
    setPassengerEmail('');
    setRoadsideNote('');
    setIsFormTouched(false);
    handleScrollToSection('booking-engine');
  };

  const handleSearchTripsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedTrip(null);
    setCheckoutData(null);
    if (tripsResultRef.current) {
      tripsResultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    showToast(`Đang tìm các chuyến xe từ ${fromCity} đi ${toCity}...`);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F4] text-slate-800 flex flex-col font-sans selection:bg-[#2E7D32] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B5E20] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-400/40 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER & NAVIGATION BAR */}
      <Navbar
        onOpenLookupModal={() => setIsLookupModalOpen(true)}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
        onScrollToSection={handleScrollToSection}
      />

      {/* 2. HERO SECTION & BOOKING CARD */}
      <section
        id="booking-engine"
        className="relative bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#388E3C] text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Background visual graphics */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute left-1/3 bottom-0 w-80 h-80 rounded-full bg-amber-400 blur-3xl" />
          <Bus className="absolute right-10 bottom-6 w-96 h-96 text-white transform -scale-x-100 opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-green-100 text-xs font-black shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>NHÀ XE TAM NGUYEN THANH • CHẤT LƯỢNG LÀ DANH DỰ</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Đặt Vé Xe Khách & Limousine VIP Trực Tuyến
            </h1>

            <p className="text-sm sm:text-base text-green-100/90 font-medium max-w-2xl mx-auto">
              Hệ thống giữ chỗ trực tuyến tức thì 10 phút. Cam kết đúng giường đã chọn, xuất bến đúng giờ, không phụ thu bất hợp lý.
            </p>
          </div>

          {/* Floating Booking Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-5 sm:p-8 text-slate-800 shadow-2xl border border-green-100 relative">
            {/* Ticket Type Tabs */}
            <div className="flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => setTicketType('ONE_WAY')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                  ticketType === 'ONE_WAY'
                    ? 'bg-[#2E7D32] text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>Một chiều</span>
                {ticketType === 'ONE_WAY' && <Check className="w-4 h-4 text-white" />}
              </button>

              <button
                type="button"
                onClick={() => setTicketType('ROUND_TRIP')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                  ticketType === 'ROUND_TRIP'
                    ? 'bg-[#2E7D32] text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>Khứ hồi (Tiết kiệm)</span>
                {ticketType === 'ROUND_TRIP' && <Check className="w-4 h-4 text-white" />}
              </button>

              <div className="ml-auto hidden sm:flex items-center space-x-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
                <span>Giữ chỗ an toàn 100%</span>
              </div>
            </div>

            {/* Booking Form Grid */}
            <form onSubmit={handleSearchTripsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Điểm đi */}
                <div className="md:col-span-5 bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-green-400 transition-colors">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-[#2E7D32] mr-1" />
                    <span>Điểm khởi hành</span>
                  </label>
                  <select
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base font-black text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Sài Gòn">Sài Gòn (Bến xe Miền Tây / Hàng Xanh)</option>
                    <option value="Đà Lạt">Đà Lạt (Bến xe Liên tỉnh / Nội thành)</option>
                    <option value="Nha Trang">Nha Trang (Khánh Hòa)</option>
                    <option value="Cần Thơ">Cần Thơ (Miền Tây)</option>
                  </select>
                </div>

                {/* Swap button */}
                <div className="md:col-span-2 flex justify-center">
                  <button
                    type="button"
                    onClick={handleSwapCities}
                    className="w-10 h-10 rounded-2xl bg-green-50 hover:bg-green-100 text-[#2E7D32] border border-green-200 flex items-center justify-center transition-all transform hover:rotate-180 duration-300 shadow-sm"
                    title="Đổi chiều đi - về"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Điểm đến */}
                <div className="md:col-span-5 bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-green-400 transition-colors">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                    <Navigation className="w-3.5 h-3.5 text-red-500 mr-1" />
                    <span>Điểm đến</span>
                  </label>
                  <select
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base font-black text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Đà Lạt">Đà Lạt (Lâm Đồng)</option>
                    <option value="Nha Trang">Nha Trang (Khánh Hòa)</option>
                    <option value="Cần Thơ">Cần Thơ (Miền Tây)</option>
                    <option value="Sài Gòn">Sài Gòn (TP.HCM)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Ngày đi, Ngày về, Hành khách */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Ngày đi */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 text-[#2E7D32] mr-1" />
                    <span>Ngày đi</span>
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Ngày về (Khứ hồi) */}
                <div
                  className={`p-3 rounded-2xl border transition-colors ${
                    ticketType === 'ROUND_TRIP'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-100/60 border-slate-200/50 opacity-60'
                  }`}
                >
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 mr-1" />
                    <span>Ngày về {ticketType === 'ONE_WAY' && '(Chỉ khứ hồi)'}</span>
                  </label>
                  <input
                    type="date"
                    disabled={ticketType === 'ONE_WAY'}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>

                {/* Số lượng hành khách */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                    <Users className="w-3.5 h-3.5 text-[#2E7D32] mr-1" />
                    <span>Số lượng vé</span>
                  </label>
                  <select
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1 Vé (1 Giường)</option>
                    <option value={2}>2 Vé (2 Giường)</option>
                    <option value={3}>3 Vé (3 Giường)</option>
                    <option value={4}>4 Vé (4 Giường)</option>
                    <option value={5}>5 Vé (Tối đa 5 Giường)</option>
                  </select>
                </div>
              </div>

              {/* Promo input inline & Search Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:flex-1 relative">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#2E7D32]">
                    <Tag className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Mã giảm giá (VD: TNTMOI20)..."
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-900 w-full focus:outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo(promoCodeInput)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-black px-3 py-1.5 rounded-xl transition-colors shrink-0"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#2E7D32] via-[#388E3C] to-[#1B5E20] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white font-black text-base shadow-lg shadow-green-900/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <Search className="w-5 h-5 text-amber-300" />
                  <span>Tìm Chuyến Xe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2.1. RESULTS & BOOKING FLOW SECTION */}
      <section ref={tripsResultRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Nút quay lại nếu đang ở bước chọn ghế hoặc thanh toán */}
        {selectedTrip && !bookingSuccessModal && (
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (checkoutData) {
                  setCheckoutData(null);
                } else {
                  setSelectedTrip(null);
                }
              }}
              className="inline-flex items-center text-xs sm:text-sm font-black text-[#2E7D32] hover:text-[#1B5E20] bg-white hover:bg-green-50 px-4 py-2.5 rounded-2xl border border-green-200 shadow-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              {checkoutData ? 'Quay lại sơ đồ chọn giường' : 'Quay lại danh sách chuyến xe'}
            </button>

            <span className="text-xs text-slate-500 font-semibold hidden sm:inline-block">
              Hành trình: <strong className="text-slate-800">{fromCity} ➔ {toCity}</strong> ({departureDate})
            </span>
          </div>
        )}

        {/* STEP 1: DANH SÁCH CHUYẾN XE */}
        {!selectedTrip && !bookingSuccessModal && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
                  <span>Chuyến Xe Từ {fromCity} Đi {toCity}</span>
                  <span className="text-xs bg-green-100 text-[#1B5E20] font-black px-2.5 py-0.5 rounded-full">
                    {filteredTrips.length} chuyến
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ngày khởi hành: <strong>{departureDate}</strong> • Giá vé niêm yết đã bao gồm bảo hiểm hành khách
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>Xuất bến đúng giờ 100%</span>
              </div>
            </div>

            {filteredTrips.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-800">
                  Chưa có chuyến xe trực tiếp giữa {fromCity} và {toCity}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hiện tại Nhà xe Tam Nguyen Thanh đang vận hành mạnh nhất các chặng: Sài Gòn ⇄ Đà Lạt, Sài Gòn ⇄ Nha Trang, Sài Gòn ⇄ Cần Thơ.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFromCity('Sài Gòn');
                      setToCity('Đà Lạt');
                    }}
                    className="bg-[#2E7D32] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1B5E20] transition-colors"
                  >
                    Xem chặng Sài Gòn ⇄ Đà Lạt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFromCity('Sài Gòn');
                      setToCity('Nha Trang');
                    }}
                    className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                  >
                    Xem chặng Sài Gòn ⇄ Nha Trang
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTrips.map((trip) => {
                  const isLimousine = trip.busType === 'LIMOUSINE_22';
                  return (
                    <div
                      key={trip.id}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 group hover:border-green-300"
                    >
                      {/* Trip Meta Left */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center space-x-1 ${
                              isLimousine
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-green-100 text-[#1B5E20] border border-green-200'
                            }`}
                          >
                            {isLimousine && <Crown className="w-3.5 h-3.5 text-amber-600" />}
                            <span>{trip.busTypeName}</span>
                          </span>

                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100">
                            {trip.tripCode}
                          </span>

                          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                            Còn {trip.availableSeats} chỗ trống
                          </span>
                        </div>

                        {/* Route timeline */}
                        <div className="flex items-center space-x-4 sm:space-x-8">
                          <div>
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-none">
                              {trip.departureTime}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold block mt-1">
                              {trip.fromStation}
                            </span>
                          </div>

                          <div className="flex-1 max-w-[160px] text-center">
                            <span className="text-[11px] text-slate-400 font-bold block mb-1">
                              {trip.duration}
                            </span>
                            <div className="relative flex items-center justify-center">
                              <div className="w-full h-0.5 bg-slate-200" />
                              <div className="absolute w-6 h-6 rounded-full bg-green-50 border border-[#2E7D32] flex items-center justify-center text-[#2E7D32]">
                                <Bus className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-medium block mt-1">
                              Chạy thẳng
                            </span>
                          </div>

                          <div>
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-none">
                              {trip.arrivalTime}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold block mt-1">
                              {trip.toStation}
                            </span>
                          </div>
                        </div>

                        {/* Points breakdown */}
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 pt-1">
                          <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center">
                            <MapPin className="w-3 h-3 text-[#2E7D32] mr-1" />
                            Đón: {trip.pickupPoints[0]?.name}
                          </span>
                          <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center">
                            <MapPin className="w-3 h-3 text-red-500 mr-1" />
                            Trả: {trip.dropoffPoints[trip.dropoffPoints.length - 1]?.name}
                          </span>
                        </div>
                      </div>

                      {/* Trip Price & Action Right */}
                      <div className="lg:border-l lg:border-slate-100 lg:pl-6 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0">
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Giá vé 1 khách
                          </span>
                          <span className="text-2xl font-black text-[#1B5E20]">
                            {formatVND(trip.price)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectTrip(trip)}
                          className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 group-hover:scale-105"
                        >
                          <span>Chọn Chuyến</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SƠ ĐỒ CHỌN GIƯỜNG NẰM */}
        {selectedTrip && !checkoutData && !bookingSuccessModal && (
          <div id="seat-selection-view" className="space-y-4">
            <SeatLayoutSelection
              tripCode={selectedTrip.tripCode}
              routeName={`${selectedTrip.fromCity} ➔ ${selectedTrip.toCity}`}
              departureTime={`${selectedTrip.departureTime} • ${departureDate}`}
              unitPrice={selectedTrip.price}
              busType={selectedTrip.busType}
              initialSeats={currentTripSeats}
              maxSelectableSeats={5}
              onProceed={handleProceedToCheckout}
            />
          </div>
        )}

        {/* STEP 3: FORM THÔNG TIN HÀNH KHÁCH & THANH TOÁN */}
        {selectedTrip && checkoutData && !bookingSuccessModal && (
          <div id="checkout-form-view" className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-black uppercase tracking-wider text-[#2E7D32] block mb-1">
                  Bước 3 / 3 • Xác nhận đặt chỗ
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Thông Tin Hành Khách & Thanh Toán
                </h3>
                <p className="text-xs text-slate-500">
                  Vui lòng nhập chính xác thông tin để nhận vé điện tử SMS & Zalo. Chỗ của bạn đang được khóa giữ trong 10 phút.
                </p>
              </div>

              {/* Tóm tắt đặt vé */}
              <div className="p-4 bg-green-50/70 rounded-2xl border border-green-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-500">Hành trình:</span>
                  <p className="text-sm font-black text-slate-900">
                    {selectedTrip.fromCity} ➔ {selectedTrip.toCity} ({selectedTrip.tripCode})
                  </p>
                  <p className="text-slate-600">
                    Khởi hành: <strong>{selectedTrip.departureTime}</strong> ngày <strong>{departureDate}</strong>
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-500">Giường đã chọn:</span>
                  <p className="text-base font-black text-[#1B5E20]">
                    {checkoutData.seats.map((s) => s.seatCode).join(', ')} ({checkoutData.seats.length} vé)
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="font-bold text-slate-500">Tạm tính:</span>
                  <p className="text-lg font-black text-[#2E7D32]">
                    {formatVND(checkoutData.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Form Chi Tiết */}
              <form onSubmit={handleConfirmBooking} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ và tên */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1 flex items-center">
                      <User className="w-3.5 h-3.5 text-[#2E7D32] mr-1" />
                      <span>Họ và tên hành khách <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Văn An"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                        isFormTouched && !isNameValid
                          ? 'border-red-400 focus:ring-red-300'
                          : 'border-slate-200 focus:ring-[#2E7D32]'
                      }`}
                    />
                    {isFormTouched && !isNameValid && (
                      <span className="text-[11px] text-red-500 font-semibold mt-1 block">
                        Vui lòng nhập đầy đủ họ và tên (tối thiểu 2 từ).
                      </span>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1 flex items-center">
                      <Phone className="w-3.5 h-3.5 text-[#2E7D32] mr-1" />
                      <span>Số điện thoại di động <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="tel"
                      placeholder="VD: 0988123456"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                        isFormTouched && !isPhoneValid
                          ? 'border-red-400 focus:ring-red-300'
                          : 'border-slate-200 focus:ring-[#2E7D32]'
                      }`}
                    />
                    {isFormTouched && !isPhoneValid && (
                      <span className="text-[11px] text-red-500 font-semibold mt-1 block">
                        Số điện thoại không hợp lệ (chuẩn 10 số di động VN).
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1 flex items-center">
                      <Mail className="w-3.5 h-3.5 text-[#2E7D32] mr-1" />
                      <span>Email nhận vé điện tử (Không bắt buộc)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="VD: nguyenvana@gmail.com"
                      value={passengerEmail}
                      onChange={(e) => setPassengerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  {/* Ghi chú đón */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1 flex items-center">
                      <FileText className="w-3.5 h-3.5 text-[#2E7D32] mr-1" />
                      <span>Ghi chú đón / hành lý cồng kềnh</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Có em bé đi kèm, đón tại đầu hẻm 12..."
                      value={roadsideNote}
                      onChange={(e) => setRoadsideNote(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>
                </div>

                {/* Chọn điểm đón & điểm trả */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-black text-slate-800 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 text-[#2E7D32] mr-1" />
                      <span>Điểm đón khách (Xuất bến) <span className="text-red-500">*</span></span>
                    </label>
                    <div className="space-y-2">
                      {selectedTrip.pickupPoints.map((pt) => (
                        <label
                          key={pt.id}
                          className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            pickupPointId === pt.id
                              ? 'bg-green-100/70 border-[#2E7D32] text-[#1B5E20]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="pickupPoint"
                            value={pt.id}
                            checked={pickupPointId === pt.id}
                            onChange={(e) => setPickupPointId(e.target.value)}
                            className="mt-0.5 accent-[#2E7D32]"
                          />
                          <div className="text-xs">
                            <span className="font-black block">{pt.name} ({pt.timeOffset})</span>
                            <span className="text-[11px] text-slate-500">{pt.address}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-black text-slate-800 mb-2 flex items-center">
                      <Navigation className="w-4 h-4 text-red-500 mr-1" />
                      <span>Điểm trả khách (Điểm đến) <span className="text-red-500">*</span></span>
                    </label>
                    <div className="space-y-2">
                      {selectedTrip.dropoffPoints.map((pt) => (
                        <label
                          key={pt.id}
                          className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            dropoffPointId === pt.id
                              ? 'bg-green-100/70 border-[#2E7D32] text-[#1B5E20]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="dropoffPoint"
                            value={pt.id}
                            checked={dropoffPointId === pt.id}
                            onChange={(e) => setDropoffPointId(e.target.value)}
                            className="mt-0.5 accent-[#2E7D32]"
                          />
                          <div className="text-xs">
                            <span className="font-black block">{pt.name} ({pt.timeOffset})</span>
                            <span className="text-[11px] text-slate-500">{pt.address}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="pt-2">
                  <label className="block text-xs font-black text-slate-800 mb-3">
                    Chọn phương thức thanh toán:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('VNPAY')}
                      className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                        paymentMethod === 'VNPAY'
                          ? 'bg-green-50 border-[#2E7D32] ring-2 ring-[#2E7D32]/20'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-[#2E7D32]" />
                      <div>
                        <span className="text-xs font-black text-slate-900 block">VNPAY QR & Thẻ ATM</span>
                        <span className="text-[11px] text-slate-500">Giảm thêm với app ngân hàng</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('VIETQR')}
                      className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                        paymentMethod === 'VIETQR'
                          ? 'bg-green-50 border-[#2E7D32] ring-2 ring-[#2E7D32]/20'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="text-xs font-black text-slate-900 block">Chuyển Khoản VietQR</span>
                        <span className="text-[11px] text-slate-500">Xác nhận tự động trong 10 giây</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                        paymentMethod === 'CASH'
                          ? 'bg-green-50 border-[#2E7D32] ring-2 ring-[#2E7D32]/20'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-amber-600" />
                      <div>
                        <span className="text-xs font-black text-slate-900 block">Thanh Toán Khi Lên Xe</span>
                        <span className="text-[11px] text-slate-500">Có mặt trước giờ xuất bến 15p</span>
                      </div>
                    </button>
                  </div>

                  {/* KHỐI HIỂN THỊ VIETQR MBBANK CHÍNH THỨC */}
                  {paymentMethod === 'VIETQR' && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-3xl border-2 border-[#2E7D32]/30 shadow-inner space-y-4 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        {/* Ảnh QR VietQR tự động sinh */}
                        <div className="bg-white p-3 rounded-2xl shadow-md border border-green-200 shrink-0 text-center">
                          <img
                            src={`https://img.vietqr.io/image/MB-010765-compact2.png?amount=${finalTotalAmount}&addInfo=${encodeURIComponent(
                              currentBookingCode,
                            )}&accountName=NGUYEN%20THANH%20TAM`}
                            alt="VietQR MBBank"
                            className="w-48 h-auto mx-auto rounded-lg"
                          />
                          <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">
                            Quét mã bằng mọi App Ngân hàng / MoMo
                          </span>
                        </div>

                        {/* Thông tin chuyển khoản chi tiết kèm nút sao chép */}
                        <div className="flex-1 space-y-2.5 text-xs w-full">
                          <div className="flex items-center justify-between pb-2 border-b border-green-200">
                            <span className="font-bold text-slate-600">Ngân hàng:</span>
                            <span className="font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-green-200">
                              MBBank (Ngân hàng Quân Đội)
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600">Số tài khoản:</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-black text-base text-[#1B5E20] bg-white px-2.5 py-0.5 rounded-lg border border-green-300">
                                010765
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('010765');
                                  showToast('Đã sao chép Số tài khoản MB: 010765');
                                }}
                                className="px-2 py-1 bg-white hover:bg-green-100 text-[#2E7D32] border border-green-300 rounded-lg text-[11px] font-bold flex items-center space-x-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Chép</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600">Chủ tài khoản:</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-green-200">
                                NGUYEN THANH TAM
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('NGUYEN THANH TAM');
                                  showToast('Đã sao chép Tên chủ tài khoản: NGUYEN THANH TAM');
                                }}
                                className="px-2 py-1 bg-white hover:bg-green-100 text-[#2E7D32] border border-green-300 rounded-lg text-[11px] font-bold flex items-center space-x-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Chép</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600">Số tiền:</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-red-600 text-sm bg-white px-2.5 py-0.5 rounded-lg border border-red-200">
                                {formatVND(finalTotalAmount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(finalTotalAmount.toString());
                                  showToast(`Đã sao chép số tiền: ${finalTotalAmount}đ`);
                                }}
                                className="px-2 py-1 bg-white hover:bg-green-100 text-[#2E7D32] border border-green-300 rounded-lg text-[11px] font-bold flex items-center space-x-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Chép</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600">Nội dung CK:</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-black text-slate-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                                {currentBookingCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(currentBookingCode);
                                  showToast(`Đã sao chép nội dung: ${currentBookingCode}`);
                                }}
                                className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center space-x-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Chép</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#1B5E20] bg-white/80 p-2.5 rounded-xl border border-green-200 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                        <span>Hệ thống tự động đồng bộ biến động số dư MBBank và cấp vé ngay lập tức sau khi nhận tiền.</span>
                      </div>
                    </div>
                  )}

                  {/* KHỐI HIỂN THỊ CỔNG VNPAY */}
                  {paymentMethod === 'VNPAY' && (
                    <div className="mt-4 p-4 bg-blue-50/80 rounded-3xl border border-blue-200 text-xs space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <span className="font-black text-sm text-blue-900">Cổng Thanh Toán VNPAY Gateway (Sandbox)</span>
                        </div>
                        <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-lg text-[10px]">
                          Bảo Mật SSL 256-bit
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Hỗ trợ thanh toán quét VNPAY-QR qua 40+ ứng dụng ngân hàng (Vietcombank, BIDV, VietinBank, Agribank, Techcombank, VPBank...) và Thẻ ATM nội địa / Quốc tế.
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-blue-800">✓ VNPAY-QR</span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-blue-800">✓ Thẻ ATM Nội Địa</span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-blue-800">✓ Visa / Mastercard / JCB</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tổng tiền & Giảm giá summary */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tổng tiền vé gốc ({checkoutData.seats.length} vé):</span>
                    <span className="font-bold">{formatVND(checkoutData.totalAmount)}</span>
                  </div>

                  {appliedPromo && calculatedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Mã ưu đãi áp dụng ({appliedPromo.code}):</span>
                      <span>-{formatVND(calculatedDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                    <span className="font-black text-slate-900">Tổng thanh toán cuối cùng:</span>
                    <span className="text-xl font-black text-[#1B5E20]">
                      {formatVND(finalTotalAmount)}
                    </span>
                  </div>
                </div>

                {/* Nút bấm hoàn tất */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-green-900/20 hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span className="flex items-center space-x-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang khởi tạo mã vé và liên kết thanh toán...</span>
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                        <span>Xác Nhận Đặt Chỗ Ngay ({formatVND(finalTotalAmount)})</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL THÔNG BÁO ĐẶT VÉ THÀNH CÔNG */}
        {bookingSuccessModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-green-100 text-[#2E7D32] rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Đặt Vé Xe Thành Công!
                </h3>
                <p className="text-xs text-slate-500">
                  Nhà Xe Tam Nguyen Thanh trân trọng cảm ơn quý khách. Thông tin vé đã được lưu trữ trên máy chủ vận tải.
                </p>
              </div>

              {/* Chi tiết vé điện tử */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">MÃ VÉ ĐIỆN TỬ:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-base text-[#2E7D32] bg-green-100 px-3 py-1 rounded-lg">
                      {bookingSuccessModal.bookingCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(bookingSuccessModal.bookingCode);
                        showToast(`Đã sao chép mã vé: ${bookingSuccessModal.bookingCode}`);
                      }}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                      title="Sao chép mã vé"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Hành khách:</span>
                  <span className="font-bold text-slate-900">
                    {bookingSuccessModal.passengerName} ({bookingSuccessModal.passengerPhone})
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Tuyến xe:</span>
                  <span className="font-bold text-slate-900">
                    {bookingSuccessModal.trip.fromCity} ➔ {bookingSuccessModal.trip.toCity} ({bookingSuccessModal.trip.tripCode})
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Khởi hành:</span>
                  <span className="font-bold text-slate-900">
                    {bookingSuccessModal.trip.departureTime} • {bookingSuccessModal.departureDate}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Giường đã đặt:</span>
                  <span className="font-black text-[#2E7D32]">
                    {bookingSuccessModal.seats.map((s) => s.seatCode).join(', ')} ({bookingSuccessModal.seats.length} vé)
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Điểm đón:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[240px]">
                    {bookingSuccessModal.pickupName}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Điểm trả:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[240px]">
                    {bookingSuccessModal.dropoffName}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                  <span className="font-black text-slate-900">Tổng thanh toán:</span>
                  <span className="font-black text-red-600">
                    {formatVND(bookingSuccessModal.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Thông báo hình thức thanh toán & VietQR Receipt */}
              {paymentMethod === 'VIETQR' && (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200 text-xs space-y-3">
                  <div className="text-center font-bold text-[#1B5E20]">
                    Quét mã QR MBBank để thanh toán ({formatVND(bookingSuccessModal.totalAmount)})
                  </div>
                  <div className="bg-white p-2.5 rounded-xl shadow-xs border border-green-200 text-center max-w-[200px] mx-auto">
                    <img
                      src={`https://img.vietqr.io/image/MB-010765-compact2.png?amount=${bookingSuccessModal.totalAmount}&addInfo=${encodeURIComponent(
                        bookingSuccessModal.bookingCode,
                      )}&accountName=NGUYEN%20THANH%20TAM`}
                      alt="VietQR MBBank"
                      className="w-full h-auto rounded"
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 bg-white/70 p-2.5 rounded-xl border border-green-100">
                    <p>• MBBank: <strong>010765</strong> - NGUYEN THANH TAM</p>
                    <p>• Nội dung: <strong className="text-amber-800 font-mono">{bookingSuccessModal.bookingCode}</strong></p>
                  </div>
                </div>
              )}

              {paymentMethod === 'VNPAY' && (
                <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-blue-900 border border-blue-200">
                  <p>✓ Đã liên kết cổng VNPAY. Mã giao dịch <strong>VNPAY-{Math.floor(100000 + Math.random() * 900000)}</strong> đã được ghi nhận.</p>
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="p-3 bg-green-50 rounded-xl text-[11px] text-[#1B5E20] border border-green-200">
                  <p>✓ Quý khách vui lòng có mặt trước giờ xuất bến 15 phút tại điểm đón để nhận vé và thanh toán trực tiếp.</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-3.5 rounded-2xl font-black text-sm shadow-md transition-all"
              >
                Hoàn Tất & Về Trang Chủ
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. SECTION: KHUYẾN MÃI NỔI BẬT */}
      <PromotionsSection onApplyPromoCode={handleApplyPromo} />

      {/* 4. SECTION: TUYẾN PHỔ BIẾN - ĐIỂM ĐẾN ĐƯỢC YÊU THÍCH */}
      <PopularRoutesSection onSelectRoute={handleSelectRouteFromCard} />

      {/* 5. SECTION: "CHẤT LƯỢNG LÀ DANH DỰ" (GIÁ TRỊ CỐT LÕI & CAM KẾT) */}
      <CoreValuesSection />

      {/* 6. SECTION: TIN TỨC MỚI & THÔNG BÁO */}
      <NewsSection />

      {/* 7. FOOTER & LIÊN HỆ ĐA KÊNH */}
      <Footer
        onOpenLookupModal={() => setIsLookupModalOpen(true)}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
        onScrollToSection={handleScrollToSection}
      />

      {/* Tra Cứu Vé Modal */}
      <TicketLookupModal
        isOpen={isLookupModalOpen}
        onClose={() => setIsLookupModalOpen(false)}
      />

      {/* Lịch Trình Modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSelectSchedule={handleSelectRouteFromCard}
      />
    </div>
  );
}

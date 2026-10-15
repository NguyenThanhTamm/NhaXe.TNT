import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
// Nếu dùng socket.io-client: import { io } from 'socket.io-client';

// Bảng màu chuẩn thương hiệu
export const BRAND_COLORS = {
  primary: '#2E7D32',       // Xanh lá cây đậm chủ đạo
  primaryLight: '#81C784',  // Xanh lá cây nhạt nhấn
  primarySurface: '#E8F5E9',// Nền xanh nhạt dịu mắt
  background: '#F6F8F6',
  white: '#FFFFFF',
  textDark: '#1B2E1D',
  textMuted: '#757575',

  // Trạng thái giường
  availableBg: '#FFFFFF',
  availableBorder: '#2E7D32',
  selectedBg: '#2E7D32',
  holdingBg: '#FFA000',      // Vàng cảnh báo đang giữ chỗ
  holdingLight: '#FFF8E1',
  bookedBg: '#E0E0E0',       // Xám đã bán
  bookedText: '#9E9E9E',
};

export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'HOLDING' | 'BOOKED';
export type DeckType = 'LOWER' | 'UPPER';

export interface BedItem {
  id: string;
  seatCode: string; // A01, A02, B01...
  deck: DeckType;
  row: number;      // 0 -> 5
  col: number;      // 0: Trái, 1: Giữa, 2: Phải
  price: number;
  status: SeatStatus;
}

export const SeatSelectionScreen: React.FC = () => {
  const [activeDeck, setActiveDeck] = useState<DeckType>('LOWER');
  const [beds, setBeds] = useState<BedItem[]>([]);
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);

  // Khởi tạo sơ đồ 36 giường nằm
  useEffect(() => {
    const initialBeds: BedItem[] = [];
    const standardPrice = 310000; // 310.000 VNĐ

    // Tầng Dưới: A01 -> A18
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        const num = r * 3 + c + 1;
        const code = `A${num < 10 ? '0' + num : num}`;
        let status: SeatStatus = 'AVAILABLE';
        if (code === 'A01' || code === 'A04') status = 'BOOKED';
        if (code === 'A06') status = 'HOLDING';

        initialBeds.push({
          id: `lower_${code}`,
          seatCode: code,
          deck: 'LOWER',
          row: r,
          col: c,
          price: standardPrice,
          status,
        });
      }
    }

    // Tầng Trên: B01 -> B18
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        const num = r * 3 + c + 1;
        const code = `B${num < 10 ? '0' + num : num}`;
        let status: SeatStatus = 'AVAILABLE';
        if (code === 'B02' || code === 'B07') status = 'BOOKED';
        if (code === 'B05') status = 'HOLDING';

        initialBeds.push({
          id: `upper_${code}`,
          seatCode: code,
          deck: 'UPPER',
          row: r,
          col: c,
          price: standardPrice,
          status,
        });
      }
    }

    setBeds(initialBeds);

    // REAL-TIME WEBSOCKET LISTENER (Socket.IO):
    /*
    const socket = io('http://your-nest-backend:3000');
    socket.emit('join_trip', { tripId: 'SG-DL-2300' });
    socket.on('seat_status_changed', (data) => {
      setBeds((prev) =>
        prev.map((bed) =>
          bed.seatCode === data.seatCode ? { ...bed, status: data.status } : bed
        )
      );
    });
    return () => socket.disconnect();
    */
  }, []);

  const handleToggleBed = (bed: BedItem) => {
    if (bed.status === 'BOOKED') {
      Alert.alert('Thông báo', `Giường ${bed.seatCode} đã có người đặt mua.`);
      return;
    }
    if (bed.status === 'HOLDING') {
      Alert.alert('Thông báo', `Giường ${bed.seatCode} đang được giữ chỗ trong 10 phút.`);
      return;
    }

    if (selectedBeds.includes(bed.id)) {
      setSelectedBeds(selectedBeds.filter((id) => id !== bed.id));
    } else {
      if (selectedBeds.length >= 5) {
        Alert.alert('Giới hạn', 'Bạn chỉ được chọn tối đa 5 giường trong 1 lần đặt.');
        return;
      }
      setSelectedBeds([...selectedBeds, bed.id]);
    }
  };

  const currentDeckBeds = beds.filter((b) => b.deck === activeDeck);
  const selectedBedObjs = beds.filter((b) => selectedBeds.includes(b.id));
  const totalPrice = selectedBedObjs.reduce((sum, b) => sum + b.price, 0);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_COLORS.primary} />

      {/* 1. Header thông tin tuyến xe */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sài Gòn ➔ Đà Lạt</Text>
        <Text style={styles.headerSubtitle}>Xuất bến: 23:00 • 14/10/2026 • Xe Giường Nằm 36 Chỗ</Text>
      </View>

      {/* 2. Bộ chuyển đổi Tầng Dưới / Tầng Trên */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeDeck === 'LOWER' && styles.tabButtonActive]}
          onPress={() => setActiveDeck('LOWER')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeDeck === 'LOWER' && styles.tabTextActive]}>
            Tầng Dưới (Dãy A)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeDeck === 'UPPER' && styles.tabButtonActive]}
          onPress={() => setActiveDeck('UPPER')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeDeck === 'UPPER' && styles.tabTextActive]}>
            Tầng Trên (Dãy B)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Chú thích trạng thái giường */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendAvailable]} />
          <Text style={styles.legendLabel}>Trống</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendSelected]} />
          <Text style={styles.legendLabel}>Đang chọn</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendHolding]} />
          <Text style={styles.legendLabel}>Đang giữ</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendBooked]} />
          <Text style={styles.legendLabel}>Đã đặt</Text>
        </View>
      </View>

      {/* 4. Thân xe & Sơ đồ 3 dãy */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.busFrame}>
          {/* Đầu xe: Vị trí Bác tài & Cửa lên xe */}
          <View style={styles.busFront}>
            <Text style={styles.busFrontText}>Bác tài 💺</Text>
            <Text style={styles.busFrontText}>🚪 Cửa lên</Text>
          </View>
          <View style={styles.divider} />

          {/* 6 Hàng giường x 3 Cột (Trái - Lối đi 1 - Giữa - Lối đi 2 - Phải) */}
          {[0, 1, 2, 3, 4, 5].map((rowIdx) => {
            const leftBed = currentDeckBeds.find((b) => b.row === rowIdx && b.col === 0);
            const centerBed = currentDeckBeds.find((b) => b.row === rowIdx && b.col === 1);
            const rightBed = currentDeckBeds.find((b) => b.row === rowIdx && b.col === 2);

            return (
              <View key={`row_${rowIdx}`} style={styles.bedRow}>
                {leftBed && renderBed(leftBed, selectedBeds.includes(leftBed.id), () => handleToggleBed(leftBed))}
                <View style={styles.walkway} />
                {centerBed && renderBed(centerBed, selectedBeds.includes(centerBed.id), () => handleToggleBed(centerBed))}
                <View style={styles.walkway} />
                {rightBed && renderBed(rightBed, selectedBeds.includes(rightBed.id), () => handleToggleBed(rightBed))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 5. Thanh tổng kết & Nút Tiếp tục đặt chỗ cố định */}
      <View style={styles.bottomBar}>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.selectedLabel}>Giường đã chọn:</Text>
            <Text style={styles.selectedCodes}>
              {selectedBedObjs.length > 0
                ? selectedBedObjs.map((b) => b.seatCode).join(', ')
                : 'Chưa chọn'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.selectedLabel}>Tổng tiền tạm tính:</Text>
            <Text style={styles.totalPriceText}>{formatVND(totalPrice)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedBeds.length === 0 && styles.continueButtonDisabled,
          ]}
          disabled={selectedBeds.length === 0}
          onPress={() => {
            Alert.alert(
              'Xác nhận giữ chỗ 10 phút',
              `Bạn có muốn giữ chỗ các giường [${selectedBedObjs.map((b) => b.seatCode).join(', ')}] với tổng số tiền ${formatVND(totalPrice)}?`,
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đồng ý', onPress: () => console.log('Call API holdSeat...') },
              ]
            );
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>
            {selectedBeds.length === 0
              ? 'Vui lòng chọn giường'
              : `Tiếp tục (${selectedBeds.length} vé)`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Render component từng giường nằm
const renderBed = (bed: BedItem, isSelected: boolean, onSelect: () => void) => {
  let cardStyle = styles.bedCardAvailable;
  let textStyle = styles.bedTextAvailable;
  let subText = '310k';

  if (isSelected) {
    cardStyle = styles.bedCardSelected;
    textStyle = styles.bedTextSelected;
    subText = '✓ Chọn';
  } else if (bed.status === 'HOLDING') {
    cardStyle = styles.bedCardHolding;
    textStyle = styles.bedTextHolding;
    subText = '⏱ Giữ';
  } else if (bed.status === 'BOOKED') {
    cardStyle = styles.bedCardBooked;
    textStyle = styles.bedTextBooked;
    subText = '✕ Đã bán';
  }

  return (
    <TouchableOpacity
      style={[styles.bedCardBase, cardStyle]}
      onPress={onSelect}
      activeOpacity={0.7}
      disabled={bed.status === 'BOOKED'}
    >
      {/* Gối đầu mô phỏng */}
      <View style={[styles.bedPillow, isSelected && { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
      <Text style={[styles.bedCode, textStyle]}>{bed.seatCode}</Text>
      <Text style={[styles.bedSub, textStyle]}>{subText}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  header: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerTitle: {
    color: BRAND_COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: BRAND_COLORS.white,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: BRAND_COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.textDark,
  },
  tabTextActive: {
    color: BRAND_COLORS.white,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 6,
  },
  legendAvailable: {
    backgroundColor: BRAND_COLORS.white,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.primary,
  },
  legendSelected: {
    backgroundColor: BRAND_COLORS.selectedBg,
  },
  legendHolding: {
    backgroundColor: BRAND_COLORS.holdingBg,
  },
  legendBooked: {
    backgroundColor: BRAND_COLORS.bookedBg,
  },
  legendLabel: {
    fontSize: 12,
    color: BRAND_COLORS.textDark,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  busFrame: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  busFront: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  busFrontText: {
    fontSize: 13,
    color: BRAND_COLORS.textMuted,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 16,
  },
  bedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walkway: {
    width: 16,
  },
  bedCardBase: {
    flex: 1,
    height: 66,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  bedPillow: {
    width: '60%',
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    position: 'absolute',
    top: 5,
  },
  bedCardAvailable: {
    backgroundColor: BRAND_COLORS.availableBg,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.availableBorder,
  },
  bedTextAvailable: {
    color: BRAND_COLORS.primary,
  },
  bedCardSelected: {
    backgroundColor: BRAND_COLORS.selectedBg,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.selectedBg,
    shadowColor: BRAND_COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  bedTextSelected: {
    color: BRAND_COLORS.white,
  },
  bedCardHolding: {
    backgroundColor: BRAND_COLORS.holdingLight,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.holdingBg,
  },
  bedTextHolding: {
    color: '#E65100',
  },
  bedCardBooked: {
    backgroundColor: BRAND_COLORS.bookedBg,
    borderColor: 'transparent',
  },
  bedTextBooked: {
    color: BRAND_COLORS.bookedText,
  },
  bedCode: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  bedSub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: BRAND_COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedLabel: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
  },
  selectedCodes: {
    fontSize: 15,
    fontWeight: 'bold',
    color: BRAND_COLORS.primary,
    marginTop: 2,
  },
  totalPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D32F2F',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: BRAND_COLORS.primary,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

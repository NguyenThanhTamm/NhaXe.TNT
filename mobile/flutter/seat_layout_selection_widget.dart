import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

// =============================================================================
// COLOR PALETTE & CONSTANTS
// =============================================================================
class BrandColors {
  static const Color primary = Color(0xFF2E7D32); // Xanh lá thương hiệu
  static const Color primaryLight = Color(0xFF4CAF50);
  static const Color background = Color(0xFFF8FAF8);
  static const Color textDark = Color(0xFF1E293B);

  // Trạng thái giường
  static const Color availableBg = Colors.white;
  static const Color availableBorder = Color(0xFF2E7D32);
  static const Color selectedBg = Color(0xFF2E7D32);
  static const Color holdingBg = Color(0xFFFFF3E0);
  static const Color holdingBorder = Color(0xFFFB8C00);
  static const Color bookedBg = Color(0xFFE0E0E0);
}

enum SeatStatus { available, selected, holding, booked }

class BedSeat {
  final String id;
  final String seatCode; // A01..A18, B01..B18
  final int floor; // 1 hoặc 2
  final int row; // 1..6
  final int col; // 1: Trái, 2: Giữa, 3: Phải
  final double price;
  SeatStatus status;

  BedSeat({
    required this.id,
    required this.seatCode,
    required this.floor,
    required this.row,
    required this.col,
    required this.price,
    this.status = SeatStatus.available,
  });
}

// =============================================================================
// COMPONENT FLUTTER: SeatLayoutSelection
// =============================================================================
class SeatLayoutSelection extends StatefulWidget {
  final String tripCode;
  final String routeName;
  final String departureTime;
  final double unitPrice;
  final int maxSelectableSeats;
  final Function(List<BedSeat> selectedSeats, double totalAmount)? onProceed;

  const SeatLayoutSelection({
    Key? key,
    this.tripCode = 'SG-DL-2200',
    this.routeName = 'Bến xe Miền Tây ➔ Bến xe Đà Lạt',
    this.departureTime = '22:00 • 15/10/2026',
    this.unitPrice = 310000,
    this.maxSelectableSeats = 5,
    this.onProceed,
  }) : super(key: key);

  @override
  State<SeatLayoutSelection> createState() => _SeatLayoutSelectionState();
}

class _SeatLayoutSelectionState extends State<SeatLayoutSelection>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late List<BedSeat> _allSeats;
  final Set<String> _selectedIds = {};
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _init36SleeperBeds();
  }

  void _init36SleeperBeds() {
    _allSeats = [];

    // Tầng 1: A01 -> A18
    for (int r = 1; r <= 6; r++) {
      for (int c = 1; c <= 3; c++) {
        final num = (r - 1) * 3 + c;
        final code = 'A${num.toString().padLeft(2, '0')}';
        SeatStatus s = SeatStatus.available;
        if (code == 'A02' || code == 'A06') s = SeatStatus.booked;
        if (code == 'A04') s = SeatStatus.holding;

        _allSeats.add(BedSeat(
          id: 'bed_$code',
          seatCode: code,
          floor: 1,
          row: r,
          col: c,
          price: widget.unitPrice,
          status: s,
        ));
      }
    }

    // Tầng 2: B01 -> B18
    for (int r = 1; r <= 6; r++) {
      for (int c = 1; c <= 3; c++) {
        final num = (r - 1) * 3 + c;
        final code = 'B${num.toString().padLeft(2, '0')}';
        SeatStatus s = SeatStatus.available;
        if (code == 'B01' || code == 'B09') s = SeatStatus.booked;
        if (code == 'B05') s = SeatStatus.holding;

        _allSeats.add(BedSeat(
          id: 'bed_$code',
          seatCode: code,
          floor: 2,
          row: r,
          col: c,
          price: widget.unitPrice,
          status: s,
        ));
      }
    }
  }

  void _onToggleBed(BedSeat bed) {
    if (bed.status == SeatStatus.booked) {
      _showToast('Giường ${bed.seatCode} đã có khách mua!');
      return;
    }
    if (bed.status == SeatStatus.holding) {
      _showToast('Giường ${bed.seatCode} đang trong phiên giữ chỗ 10 phút!');
      return;
    }

    setState(() {
      if (_selectedIds.contains(bed.id)) {
        _selectedIds.remove(bed.id);
        bed.status = SeatStatus.available;
      } else {
        if (_selectedIds.length >= widget.maxSelectableSeats) {
          _showToast('Chỉ được chọn tối đa ${widget.maxSelectableSeats} giường.');
          return;
        }
        _selectedIds.add(bed.id);
        bed.status = SeatStatus.selected;
      }
    });
  }

  void _showToast(String msg) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  double get _totalAmount => _allSeats
      .where((s) => _selectedIds.contains(s.id))
      .fold(0, (sum, s) => sum + s.price);

  List<BedSeat> get _selectedSeats =>
      _allSeats.where((s) => _selectedIds.contains(s.id)).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: _buildHeader(),
      body: Column(
        children: [
          // 1. Tab chuyển đổi Tầng 1 (Dưới) & Tầng 2 (Trên)
          _buildFloorTabs(),

          // 2. Chú thích trạng thái giường (Legend)
          _buildLegend(),

          // 3. Khung khoang xe & Sơ đồ 3 dãy
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildBusDeckView(1),
                _buildBusDeckView(2),
              ],
            ),
          ),

          // 4. Bottom Navigation Bar Cố định
          _buildBottomBar(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildHeader() {
    return AppBar(
      backgroundColor: BrandColors.primary,
      elevation: 0,
      centerTitle: true,
      title: Column(
        children: [
          Text(
            widget.routeName,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 2),
          Text(
            '${widget.departureTime} • Xe Giường Nằm 36 Chỗ',
            style: TextStyle(fontSize: 12, color: Colors.green.shade100),
          ),
        ],
      ),
    );
  }

  Widget _buildFloorTabs() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: BrandColors.primary,
          borderRadius: BorderRadius.circular(8),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: BrandColors.textDark,
        labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        tabs: const [
          Tab(text: 'Tầng Dưới (Dãy A)'),
          Tab(text: 'Tầng Trên (Dãy B)'),
        ],
      ),
    );
  }

  Widget _buildLegend() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildLegendItem('Trống', Colors.white, border: Border.all(color: BrandColors.primary, width: 2)),
          _buildLegendItem('Đang chọn', BrandColors.selectedBg),
          _buildLegendItem('Đang giữ', BrandColors.holdingBg, border: Border.all(color: BrandColors.holdingBorder)),
          _buildLegendItem('Đã bán', BrandColors.bookedBg),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color, {BoxBorder? border}) {
    return Row(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(color: color, border: border, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.black87, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildBusDeckView(int floor) {
    final floorSeats = _allSeats.where((s) => s.floor == floor).toList();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 3)),
          ],
        ),
        child: Column(
          children: [
            // Đầu xe: Tài xế & Cửa lên
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.airline_seat_recline_extra, size: 20, color: Colors.grey.shade600),
                    const SizedBox(width: 6),
                    Text('Tài xế', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade600)),
                  ],
                ),
                Row(
                  children: [
                    Text('Cửa lên', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade600)),
                    const SizedBox(width: 6),
                    Icon(Icons.sensor_door_outlined, size: 20, color: Colors.grey.shade600),
                  ],
                ),
              ],
            ),
            const Divider(height: 20),

            // Lưới 6 hàng x 3 dãy
            for (int r = 1; r <= 6; r++) ...[
              Row(
                children: [
                  _buildBedItem(floorSeats.firstWhere((s) => s.row == r && s.col == 1)),
                  _buildWalkway(),
                  _buildBedItem(floorSeats.firstWhere((s) => s.row == r && s.col == 2)),
                  _buildWalkway(),
                  _buildBedItem(floorSeats.firstWhere((s) => s.row == r && s.col == 3)),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildWalkway() {
    return const SizedBox(width: 16, child: Center(child: Text('•', style: TextStyle(color: Colors.black12))));
  }

  Widget _buildBedItem(BedSeat seat) {
    Color bg = BrandColors.availableBg;
    BoxBorder border = Border.all(color: BrandColors.availableBorder, width: 2);
    Color textColor = Colors.black87;
    Widget? icon;

    if (seat.status == SeatStatus.selected) {
      bg = BrandColors.selectedBg;
      border = Border.all(color: BrandColors.selectedBg, width: 2);
      textColor = Colors.white;
      icon = const Icon(Icons.check, size: 12, color: Colors.white);
    } else if (seat.status == SeatStatus.holding) {
      bg = BrandColors.holdingBg;
      border = Border.all(color: BrandColors.holdingBorder, width: 1.5);
      textColor = Colors.orange.shade900;
      icon = Icon(Icons.timer_outlined, size: 12, color: Colors.orange.shade800);
    } else if (seat.status == SeatStatus.booked) {
      bg = BrandColors.bookedBg;
      border = Border.all(color: Colors.transparent);
      textColor = Colors.grey.shade400;
      icon = Icon(Icons.close, size: 12, color: Colors.grey.shade500);
    }

    return Expanded(
      child: GestureDetector(
        onTap: () => _onToggleBed(seat),
        child: Container(
          height: 64,
          decoration: BoxDecoration(
            color: bg,
            border: border,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Gối nằm
              Container(
                width: 24,
                height: 4,
                decoration: BoxDecoration(
                  color: seat.status == SeatStatus.selected ? Colors.white38 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                seat.seatCode,
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor),
              ),
              const SizedBox(height: 2),
              icon ?? Text('310k', style: TextStyle(fontSize: 9, color: textColor.withOpacity(0.6))),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    final selectedCodes = _selectedSeats.map((s) => s.seatCode).toList();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, -3)),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    selectedCodes.isEmpty ? 'Chưa chọn ghế' : 'Ghế: ${selectedCodes.join(', ')}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: selectedCodes.isEmpty ? Colors.grey : BrandColors.primary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    currencyFormat.format(_totalAmount),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.red),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: _selectedIds.isEmpty
                  ? null
                  : () {
                      if (widget.onProceed != null) {
                        widget.onProceed!(_selectedSeats, _totalAmount);
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: BrandColors.primary,
                disabledBackgroundColor: Colors.grey.shade300,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                _selectedIds.isEmpty ? 'Tiếp tục đặt vé' : 'Tiếp tục (${_selectedIds.length})',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

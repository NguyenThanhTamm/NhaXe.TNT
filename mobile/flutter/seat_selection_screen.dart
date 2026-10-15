import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

// Định nghĩa màu sắc thương hiệu
class AppColors {
  static const Color primary = Color(0xFF2E7D32);       // Xanh lá cây thương hiệu
  static const Color primaryLight = Color(0xFF81C784);  // Xanh lá nhạt
  static const Color primarySurface = Color(0xFFE8F5E9);// Nền xanh dịu
  static const Color background = Color(0xFFF6F8F6);
  static const Color textDark = Color(0xFF1B2E1D);
  static const Color textMuted = Color(0xFF757575);

  // Trạng thái giường
  static const Color availableBorder = Color(0xFF2E7D32);
  static const Color availableBg = Colors.white;
  static const Color selectedBg = Color(0xFF2E7D32);
  static const Color holdingBg = Color(0xFFFFB300);      // Màu vàng (đang giữ 10 phút)
  static const Color holdingLight = Color(0xFFFFF8E1);
  static const Color bookedBg = Color(0xFFE0E0E0);       // Màu xám (đã đặt)
  static const Color bookedText = Color(0xFF9E9E9E);
}

enum SeatStatus { available, selected, holding, booked }
enum DeckType { lower, upper } // Tầng dưới (A) / Tầng trên (B)

class BedModel {
  final String id;
  final String seatCode; // A01, A02, B01...
  final DeckType deck;
  final int row;
  final int col; // 0: Dãy Trái, 1: Dãy Giữa, 2: Dãy Phải
  final double price;
  SeatStatus status;

  BedModel({
    required this.id,
    required this.seatCode,
    required this.deck,
    required this.row,
    required this.col,
    required this.price,
    this.status = SeatStatus.available,
  });
}

class SeatSelectionScreen extends StatefulWidget {
  final String tripCode;
  final String routeName;
  final String departureTime;

  const SeatSelectionScreen({
    Key? key,
    this.tripCode = 'SG-DL-2300',
    this.routeName = 'TP. Hồ Chí Minh ➔ Đà Lạt',
    this.departureTime = '23:00 • Hôm nay, 14/10',
  }) : super(key: key);

  @override
  State<SeatSelectionScreen> createState() => _SeatSelectionScreenState();
}

class _SeatSelectionScreenState extends State<SeatSelectionScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  // Danh sách toàn bộ giường nằm (3 dãy x 6 hàng x 2 tầng = 36 chỗ)
  late List<BedModel> _allBeds;
  final Set<String> _selectedBedIds = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initializeMockBeds();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _initializeMockBeds() {
    _allBeds = [];
    const double standardPrice = 310000; // 310.000 VNĐ

    // Khởi tạo Tầng Dưới (A01 -> A18)
    for (int r = 0; r < 6; r++) {
      for (int c = 0; c < 3; c++) {
        final int index = r * 3 + c + 1;
        final String code = 'A${index.toString().padLeft(2, '0')}';
        SeatStatus initialStatus = SeatStatus.available;

        // Giả lập trạng thái thực tế
        if (code == 'A01' || code == 'A05') initialStatus = SeatStatus.booked;
        if (code == 'A03') initialStatus = SeatStatus.holding;

        _allBeds.add(BedModel(
          id: 'lower_$code',
          seatCode: code,
          deck: DeckType.lower,
          row: r,
          col: c,
          price: standardPrice,
          status: initialStatus,
        ));
      }
    }

    // Khởi tạo Tầng Trên (B01 -> B18)
    for (int r = 0; r < 6; r++) {
      for (int c = 0; c < 3; c++) {
        final int index = r * 3 + c + 1;
        final String code = 'B${index.toString().padLeft(2, '0')}';
        SeatStatus initialStatus = SeatStatus.available;

        if (code == 'B02' || code == 'B08') initialStatus = SeatStatus.booked;
        if (code == 'B06') initialStatus = SeatStatus.holding;

        _allBeds.add(BedModel(
          id: 'upper_$code',
          seatCode: code,
          deck: DeckType.upper,
          row: r,
          col: c,
          price: standardPrice,
          status: initialStatus,
        ));
      }
    }
  }

  void _toggleSelectBed(BedModel bed) {
    if (bed.status == SeatStatus.booked) {
      _showSnackbar('Giường ${bed.seatCode} đã được bán.', Colors.red[700]!);
      return;
    }
    if (bed.status == SeatStatus.holding) {
      _showSnackbar('Giường ${bed.seatCode} đang có người giữ trong 10 phút.', Colors.orange[800]!);
      return;
    }

    setState(() {
      if (_selectedBedIds.contains(bed.id)) {
        _selectedBedIds.remove(bed.id);
        bed.status = SeatStatus.available;
      } else {
        if (_selectedBedIds.length >= 5) {
          _showSnackbar('Bạn chỉ có thể chọn tối đa 5 giường trong một lần đặt.', Colors.orange);
          return;
        }
        _selectedBedIds.add(bed.id);
        bed.status = SeatStatus.selected;
      }
    });
  }

  void _showSnackbar(String msg, Color color) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  double get _totalPrice {
    return _allBeds
        .where((b) => _selectedBedIds.contains(b.id))
        .fold(0, (sum, b) => sum + b.price);
  }

  List<String> get _selectedCodes {
    return _allBeds
        .where((b) => _selectedBedIds.contains(b.id))
        .map((b) => b.seatCode)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // 1. Thông tin chuyến & Tab chọn Tầng Dưới / Tầng Trên
          _buildTripSummaryHeader(),
          _buildDeckTabs(),

          // 2. Chú thích các trạng thái giường
          _buildStatusLegend(),

          // 3. Khung xe và sơ đồ 3 dãy giường
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildDeckLayout(DeckType.lower),
                _buildDeckLayout(DeckType.upper),
              ],
            ),
          ),

          // 4. Thanh thanh toán & Tổng tiền cố định ở dưới
          _buildBottomActionPanel(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      title: const Text(
        'Chọn Giường Nằm',
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh_rounded),
          tooltip: 'Làm mới sơ đồ',
          onPressed: () {
            setState(() => _initializeMockBeds());
            _showSnackbar('Đã làm mới trạng thái giường', AppColors.primary);
          },
        ),
      ],
    );
  }

  Widget _buildTripSummaryHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.directions_bus_filled, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text(
                widget.routeName,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            widget.departureTime,
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildDeckTabs() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(10),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: AppColors.textDark,
        labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        tabs: [
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.stairs, size: 18),
                const SizedBox(width: 6),
                const Text('Tầng Dưới (Dãy A)'),
                if (_selectedBedIds.any((id) => id.startsWith('lower_')))
                  _buildCountBadge(
                    _selectedBedIds.where((id) => id.startsWith('lower_')).length,
                  ),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.arrow_upward_rounded, size: 18),
                const SizedBox(width: 6),
                const Text('Tầng Trên (Dãy B)'),
                if (_selectedBedIds.any((id) => id.startsWith('upper_')))
                  _buildCountBadge(
                    _selectedBedIds.where((id) => id.startsWith('upper_')).length,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCountBadge(int count) {
    return Container(
      margin: const EdgeInsets.only(left: 6),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: const BoxDecoration(
        color: Colors.amber,
        shape: BoxShape.circle,
      ),
      child: Text(
        '$count',
        style: const TextStyle(color: Colors.black87, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildStatusLegend() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildLegendItem(
            border: Border.all(color: AppColors.primary, width: 1.5),
            color: Colors.white,
            label: 'Trống',
          ),
          _buildLegendItem(
            color: AppColors.selectedBg,
            label: 'Đang chọn',
          ),
          _buildLegendItem(
            color: AppColors.holdingBg,
            label: 'Đang giữ',
          ),
          _buildLegendItem(
            color: AppColors.bookedBg,
            label: 'Đã đặt',
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem({
    required Color color,
    required String label,
    BoxBorder? border,
  }) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            border: border,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textDark, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  Widget _buildDeckLayout(DeckType deck) {
    final bedsInDeck = _allBeds.where((b) => b.deck == deck).toList();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            // Đầu xe: Bác tài & Cửa lên xe
            _buildBusFrontHeader(),
            const Divider(height: 24, thickness: 1),

            // Sơ đồ 3 dãy: Trái (0) - Giữa (1) - Phải (2)
            for (int r = 0; r < 6; r++) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Dãy Trái
                  _buildBedCard(bedsInDeck.firstWhere((b) => b.row == r && b.col == 0)),
                  // Lối đi bên trái
                  _buildWalkwayIndicator(),
                  // Dãy Giữa
                  _buildBedCard(bedsInDeck.firstWhere((b) => b.row == r && b.col == 1)),
                  // Lối đi bên phải
                  _buildWalkwayIndicator(),
                  // Dãy Phải
                  _buildBedCard(bedsInDeck.firstWhere((b) => b.row == r && b.col == 2)),
                ],
              ),
              const SizedBox(height: 14),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBusFrontHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.airline_seat_recline_normal, color: Colors.grey, size: 20),
            ),
            const SizedBox(width: 8),
            const Text(
              'Bác tài',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        Row(
          children: [
            const Text(
              'Cửa lên',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 6),
            Icon(Icons.sensor_door_outlined, color: Colors.grey.shade600, size: 20),
          ],
        ),
      ],
    );
  }

  Widget _buildWalkwayIndicator() {
    return SizedBox(
      width: 20,
      child: Center(
        child: Container(
          width: 1,
          height: 36,
          color: Colors.grey.shade200,
        ),
      ),
    );
  }

  Widget _buildBedCard(BedModel bed) {
    Color cardBg;
    Color borderCol;
    Color textColor;
    Widget? stateIcon;

    switch (bed.status) {
      case SeatStatus.selected:
        cardBg = AppColors.selectedBg;
        borderCol = AppColors.selectedBg;
        textColor = Colors.white;
        stateIcon = const Icon(Icons.check, color: Colors.white, size: 14);
        break;
      case SeatStatus.holding:
        cardBg = AppColors.holdingLight;
        borderCol = AppColors.holdingBg;
        textColor = Colors.orange.shade900;
        stateIcon = const Icon(Icons.timer_outlined, color: AppColors.holdingBg, size: 14);
        break;
      case SeatStatus.booked:
        cardBg = AppColors.bookedBg;
        borderCol = Colors.transparent;
        textColor = AppColors.bookedText;
        stateIcon = const Icon(Icons.close, color: AppColors.bookedText, size: 14);
        break;
      case SeatStatus.available:
      default:
        cardBg = AppColors.availableBg;
        borderCol = AppColors.primary.withOpacity(0.5);
        textColor = AppColors.primary;
        stateIcon = null;
        break;
    }

    return Expanded(
      child: GestureDetector(
        onTap: () => _toggleSelectBed(bed),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 68,
          decoration: BoxDecoration(
            color: cardBg,
            border: Border.all(color: borderCol, width: 1.5),
            borderRadius: BorderRadius.circular(10),
            boxShadow: bed.status == SeatStatus.selected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    )
                  ]
                : null,
          ),
          child: Stack(
            children: [
              // Mô phỏng gối nằm trên đầu giường
              Positioned(
                top: 4,
                left: 8,
                right: 8,
                child: Container(
                  height: 6,
                  decoration: BoxDecoration(
                    color: bed.status == SeatStatus.selected
                        ? Colors.white.withOpacity(0.4)
                        : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),

              // Mã giường nằm & Icon trạng thái
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      bed.seatCode,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: textColor,
                      ),
                    ),
                    if (stateIcon != null) ...[
                      const SizedBox(height: 2),
                      stateIcon,
                    ] else ...[
                      const SizedBox(height: 2),
                      Text(
                        '310k',
                        style: TextStyle(
                          fontSize: 10,
                          color: textColor.withOpacity(0.8),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomActionPanel() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Hàng tóm tắt số giường chọn
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Giường đã chọn:',
                      style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _selectedCodes.isEmpty ? 'Chưa chọn giường' : _selectedCodes.join(', '),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: _selectedCodes.isEmpty ? AppColors.textMuted : AppColors.primary,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'Tổng tiền tạm tính:',
                      style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      currencyFormatter.format(_totalPrice),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Colors.redAccent,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Nút Tiếp tục đặt chỗ
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _selectedBedIds.isEmpty
                    ? null
                    : () {
                        _showConfirmationDialog();
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  disabledBackgroundColor: Colors.grey.shade300,
                  foregroundColor: Colors.white,
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _selectedBedIds.isEmpty
                          ? 'Vui lòng chọn giường'
                          : 'Tiếp tục (${_selectedBedIds.length} vé)',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.3,
                      ),
                    ),
                    if (_selectedBedIds.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward_rounded, size: 20),
                    ]
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showConfirmationDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.access_time_filled, color: AppColors.primary, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Xác nhận giữ chỗ 10 phút',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Hệ thống sẽ tạm khóa các giường [${_selectedCodes.join(', ')}] cho bạn trong vòng 10 phút để tiến hành thanh toán.',
                style: const TextStyle(fontSize: 14, color: AppColors.textDark, height: 1.4),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Tổng thanh toán:', style: TextStyle(fontWeight: FontWeight.w600)),
                    Text(
                      currencyFormatter.format(_totalPrice),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.redAccent,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _showSnackbar('Đã gửi yêu cầu giữ vé tới hệ thống!', AppColors.primary);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Thanh toán ngay', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

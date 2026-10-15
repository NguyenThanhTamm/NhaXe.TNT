'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bus,
  Users,
  ShieldCheck,
  Calendar,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Wrench,
  CheckCircle,
  X,
  FileText,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
import {
  BusItem,
  DriverItem,
  BusStatus,
  DriverStatus,
  BusType,
  getBuses,
  addBus,
  updateBus,
  deleteBus,
  setBusStatus,
  getDrivers,
  addDriver,
  updateDriver,
  deleteDriver,
  setDriverStatus,
  subscribeBookingStore,
} from '@/services/bookingStore';

export default function AdminFleetPage() {
  const [activeTab, setActiveTab] = useState<'BUSES' | 'DRIVERS'>('BUSES');
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Thêm/Sửa Xe
  const [showBusModal, setShowBusModal] = useState(false);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [busFormData, setBusFormData] = useState<{
    plateNumber: string;
    model: string;
    busType: BusType;
    year: number;
    inspectionExpiry: string;
    status: BusStatus;
    lastMaintenance: string;
  }>({
    plateNumber: '',
    model: '',
    busType: 'GIUONG_NAM_36',
    year: 2024,
    inspectionExpiry: '15/12/2026',
    status: 'AVAILABLE',
    lastMaintenance: '01/10/2026',
  });

  // Modal Thêm/Sửa Tài Xế
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverFormData, setDriverFormData] = useState<{
    name: string;
    phone: string;
    licenseClass: string;
    licenseNumber: string;
    experienceYears: number;
    mainRoute: string;
    role: 'MAIN_DRIVER' | 'ASSISTANT';
    status: DriverStatus;
  }>({
    name: '',
    phone: '',
    licenseClass: 'Hạng E',
    licenseNumber: '',
    experienceYears: 5,
    mainRoute: 'Chuyên tuyến Sài Gòn ⇄ Đà Lạt',
    role: 'MAIN_DRIVER',
    status: 'AVAILABLE',
  });

  // Tải dữ liệu ban đầu và đăng ký lắng nghe realtime
  useEffect(() => {
    const loadData = () => {
      setBuses(getBuses());
      setDrivers(getDrivers());
    };
    loadData();
    const unsubscribe = subscribeBookingStore(loadData);
    return () => unsubscribe();
  }, []);

  // Lọc danh sách xe
  const filteredBuses = useMemo(() => {
    return buses.filter((b) => {
      const matchSearch =
        b.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [buses, searchTerm, statusFilter]);

  // Lọc danh sách tài xế
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm) ||
        d.mainRoute.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [drivers, searchTerm, statusFilter]);

  // Thao tác với Xe
  const handleOpenAddBus = () => {
    setEditingBusId(null);
    setBusFormData({
      plateNumber: '',
      model: '',
      busType: 'GIUONG_NAM_36',
      year: new Date().getFullYear(),
      inspectionExpiry: '15/12/2026',
      status: 'AVAILABLE',
      lastMaintenance: '10/10/2026',
    });
    setShowBusModal(true);
  };

  const handleOpenEditBus = (bus: BusItem) => {
    setEditingBusId(bus.id);
    setBusFormData({
      plateNumber: bus.plateNumber,
      model: bus.model,
      busType: bus.busType,
      year: bus.year,
      inspectionExpiry: bus.inspectionExpiry,
      status: bus.status,
      lastMaintenance: bus.lastMaintenance,
    });
    setShowBusModal(true);
  };

  const handleSaveBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busFormData.plateNumber.trim()) {
      alert('Vui lòng nhập biển số xe!');
      return;
    }

    if (editingBusId) {
      updateBus(editingBusId, busFormData);
    } else {
      addBus({
        ...busFormData,
      });
    }
    setShowBusModal(false);
  };

  const handleDeleteBus = (id: string, plate: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa xe biển số [${plate}] khỏi hệ thống?`)) {
      deleteBus(id);
    }
  };

  const handleToggleMaintenance = (bus: BusItem) => {
    const newStatus: BusStatus = bus.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    setBusStatus(bus.id, newStatus);
  };

  // Thao tác với Tài xế
  const handleOpenAddDriver = () => {
    setEditingDriverId(null);
    setDriverFormData({
      name: '',
      phone: '',
      licenseClass: 'Hạng E',
      licenseNumber: '',
      experienceYears: 5,
      mainRoute: 'Chuyên tuyến Sài Gòn ⇄ Đà Lạt',
      role: 'MAIN_DRIVER',
      status: 'AVAILABLE',
    });
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (driver: DriverItem) => {
    setEditingDriverId(driver.id);
    setDriverFormData({
      name: driver.name,
      phone: driver.phone,
      licenseClass: driver.licenseClass,
      licenseNumber: driver.licenseNumber,
      experienceYears: driver.experienceYears,
      mainRoute: driver.mainRoute,
      role: driver.role,
      status: driver.status,
    });
    setShowDriverModal(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverFormData.name.trim() || !driverFormData.phone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại tài xế!');
      return;
    }

    if (editingDriverId) {
      updateDriver(editingDriverId, driverFormData);
    } else {
      addDriver({
        ...driverFormData,
      });
    }
    setShowDriverModal(false);
  };

  const handleDeleteDriver = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa nhân sự [${name}] khỏi hệ thống?`)) {
      deleteDriver(id);
    }
  };

  const handleToggleLeave = (driver: DriverItem) => {
    const newStatus: DriverStatus = driver.status === 'ON_LEAVE' ? 'AVAILABLE' : 'ON_LEAVE';
    setDriverStatus(driver.id, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* HEADER QUẢN LÝ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>TMS / ERP Vận Hành Đội Xe & Nhân Sự</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Đội Xe & Tổ Tài Xế
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi tình trạng kỹ thuật đầu xe, phân bổ nhân sự và đảm bảo an toàn vận hành 24/7.
          </p>
        </div>

        {/* NÚT THÊM MỚI */}
        <div className="flex items-center space-x-3">
          {activeTab === 'BUSES' ? (
            <button
              onClick={handleOpenAddBus}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white font-bold text-sm shadow-md shadow-emerald-900/10 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm Đầu Xe Mới</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddDriver}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white font-bold text-sm shadow-md shadow-emerald-900/10 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm Tài Xế / Phụ Xe</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Tổng Đầu Xe</span>
            <Bus className="w-4 h-4 text-[#1B5E20]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{buses.length}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {buses.filter((b) => b.status === 'AVAILABLE').length} xe sẵn sàng xuất bến
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Xe Đang Bảo Dưỡng</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {buses.filter((b) => b.status === 'MAINTENANCE').length}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Kiểm định & thay phụ tùng</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Tổng Tổ Lái & Phụ</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{drivers.length}</div>
          <div className="text-[11px] text-blue-700 font-semibold mt-1">
            {drivers.filter((d) => d.status === 'AVAILABLE').length} nhân sự sẵn sàng nhận ca
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Bằng Hạng E / Chuẩn</span>
            <BadgeCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">100%</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Được khám định kỳ 6 tháng</div>
        </div>
      </div>

      {/* THANH CHUYỂN TAB & CÔNG CỤ LỌC */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* TAB CHUYỂN ĐỔI */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => {
                setActiveTab('BUSES');
                setStatusFilter('ALL');
              }}
              className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'BUSES'
                  ? 'bg-white text-[#1B5E20] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>DANH SÁCH ĐẦU XE ({buses.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('DRIVERS');
                setStatusFilter('ALL');
              }}
              className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'DRIVERS'
                  ? 'bg-white text-[#1B5E20] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>TÀI XẾ & TỔ LÁI ({drivers.length})</span>
            </button>
          </div>

          {/* Ô TÌM KIẾM & BỘ LỌC */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === 'BUSES'
                    ? 'Tìm biển số xe, dòng xe...'
                    : 'Tìm tên tài xế, SĐT, tuyến...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              {activeTab === 'BUSES' ? (
                <>
                  <option value="AVAILABLE">Sẵn Sàng (Hoạt động)</option>
                  <option value="ON_TRIP">Đang Chạy Chuyến</option>
                  <option value="MAINTENANCE">Đang Bảo Dưỡng</option>
                </>
              ) : (
                <>
                  <option value="AVAILABLE">Đang Rảnh (Sẵn sàng)</option>
                  <option value="ON_TRIP">Đang Lái Xe</option>
                  <option value="ON_LEAVE">Nghỉ Phép</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* TAB 1: BẢNG DANH SÁCH XE */}
        {activeTab === 'BUSES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">BIỂN SỐ XE</th>
                  <th className="py-3 px-4">DÒNG XE & LOẠI CẤU HÌNH</th>
                  <th className="py-3 px-4">NĂM SẢN XUẤT</th>
                  <th className="py-3 px-4">HẠN KIỂM ĐỊNH</th>
                  <th className="py-3 px-4">LẦN BẢO DƯỠNG GẦN NHẤT</th>
                  <th className="py-3 px-4 text-center">TỔNG CHUYẾN</th>
                  <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                  <th className="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBuses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      Không tìm thấy đầu xe nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredBuses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Biển số xe */}
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-mono text-sm shadow-xs">
                          <Bus className="w-3.5 h-3.5 text-amber-700" />
                          <span>{bus.plateNumber}</span>
                        </div>
                      </td>

                      {/* Dòng xe */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{bus.model}</div>
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-[#1B5E20] bg-emerald-50 px-2 py-0.5 rounded">
                          {bus.busType === 'GIUONG_NAM_36'
                            ? 'Sơ đồ 36 Giường Nằm Tiêu Chuẩn'
                            : 'Sơ đồ 22 Cabin VIP Cung Điện'}
                        </span>
                      </td>

                      {/* Năm sản xuất */}
                      <td className="py-3.5 px-4 font-bold text-slate-600">{bus.year}</td>

                      {/* Hạn kiểm định */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{bus.inspectionExpiry}</span>
                        </div>
                      </td>

                      {/* Bảo dưỡng gần nhất */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {bus.lastMaintenance}
                      </td>

                      {/* Tổng chuyến */}
                      <td className="py-3.5 px-4 text-center font-black text-slate-700">
                        {bus.totalTrips || 0}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {bus.status === 'AVAILABLE' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Sẵn Sàng</span>
                          </span>
                        )}
                        {bus.status === 'ON_TRIP' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 animate-pulse">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Đang Chạy Chuyến</span>
                          </span>
                        )}
                        {bus.status === 'MAINTENANCE' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Wrench className="w-3 h-3 text-amber-600" />
                            <span>Đang Bảo Dưỡng</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Toggle Bảo dưỡng */}
                          <button
                            type="button"
                            onClick={() => handleToggleMaintenance(bus)}
                            title={
                              bus.status === 'MAINTENANCE'
                                ? 'Đã bảo dưỡng xong ➔ Sẵn sàng'
                                : 'Chuyển sang bảo dưỡng'
                            }
                            className={`p-1.5 rounded-lg border transition-all ${
                              bus.status === 'MAINTENANCE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>

                          {/* Sửa xe */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditBus(bus)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Sửa thông tin xe"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Xóa xe */}
                          <button
                            type="button"
                            onClick={() => handleDeleteBus(bus.id, bus.plateNumber)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Xóa đầu xe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: BẢNG DANH SÁCH TÀI XẾ & TỔ LÁI */}
        {activeTab === 'DRIVERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">HỌ VÀ TÊN</th>
                  <th className="py-3 px-4">VAI TRÒ</th>
                  <th className="py-3 px-4">SỐ ĐIỆN THOẠI</th>
                  <th className="py-3 px-4">HẠNG BẰNG / SỐ BẰNG LÁI</th>
                  <th className="py-3 px-4">KINH NGHIỆM</th>
                  <th className="py-3 px-4">TUYẾN PHỤ TRÁCH CHÍNH</th>
                  <th className="py-3 px-4 text-center">TỔNG CHUYẾN</th>
                  <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                  <th className="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      Không tìm thấy nhân sự nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tên */}
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#1B5E20] flex items-center justify-center font-black text-xs">
                            {driver.name.charAt(0)}
                          </div>
                          <span>{driver.name}</span>
                        </div>
                      </td>

                      {/* Vai trò */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            driver.role === 'MAIN_DRIVER'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {driver.role === 'MAIN_DRIVER' ? 'Tài Xế Chính' : 'Phụ Xe / Lái Phụ'}
                        </span>
                      </td>

                      {/* SĐT */}
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        <div className="flex items-center space-x-1 text-[#1B5E20]">
                          <Phone className="w-3 h-3" />
                          <span>{driver.phone}</span>
                        </div>
                      </td>

                      {/* Bằng lái */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{driver.licenseClass}</span>
                        {driver.licenseNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Số: {driver.licenseNumber}
                          </div>
                        )}
                      </td>

                      {/* Kinh nghiệm */}
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {driver.experienceYears} năm kinh nghiệm
                      </td>

                      {/* Tuyến phụ trách */}
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        {driver.mainRoute}
                      </td>

                      {/* Tổng chuyến */}
                      <td className="py-3.5 px-4 text-center font-black text-slate-700">
                        {driver.totalTrips || 0}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {driver.status === 'AVAILABLE' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đang Rảnh</span>
                          </span>
                        )}
                        {driver.status === 'ON_TRIP' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 animate-pulse">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Đang Lái Xe</span>
                          </span>
                        )}
                        {driver.status === 'ON_LEAVE' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                            <span>Nghỉ Phép</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Nghỉ phép toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleLeave(driver)}
                            title={
                              driver.status === 'ON_LEAVE'
                                ? 'Hết nghỉ phép ➔ Đang rảnh'
                                : 'Chuyển sang nghỉ phép'
                            }
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          {/* Sửa tài xế */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditDriver(driver)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Sửa thông tin tài xế"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Xóa tài xế */}
                          <button
                            type="button"
                            onClick={() => handleDeleteDriver(driver.id, driver.name)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Xóa nhân sự"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL THÊM / SỬA ĐẦU XE */}
      {/* ============================================================== */}
      {showBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Bus className="w-5 h-5 text-[#1B5E20]" />
                <h3 className="font-black text-slate-900 text-base">
                  {editingBusId ? 'Cập Nhật Thông Tin Xe' : 'Thêm Đầu Xe Mới Vào Đội'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBusModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBus} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biển Số Xe (Kiểm soát trên đường)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 51B-888.99"
                  value={busFormData.plateNumber}
                  onChange={(e) => setBusFormData({ ...busFormData, plateNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 font-mono uppercase focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dòng Xe & Model Chi Tiết*
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hyundai Universe Express Premium"
                  value={busFormData.model}
                  onChange={(e) => setBusFormData({ ...busFormData, model: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cấu Hình Ghế & Sơ Đồ*
                  </label>
                  <select
                    value={busFormData.busType}
                    onChange={(e) =>
                      setBusFormData({ ...busFormData, busType: e.target.value as BusType })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  >
                    <option value="GIUONG_NAM_36">Giường nằm 36 chỗ (A01-A18, B01-B18)</option>
                    <option value="LIMOUSINE_22">Limousine 22 Phòng VIP (C01-C11, D01-D11)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm Sản Xuất
                  </label>
                  <input
                    type="number"
                    value={busFormData.year}
                    onChange={(e) =>
                      setBusFormData({ ...busFormData, year: parseInt(e.target.value, 10) || 2024 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hạn Kiểm Định An Toàn
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 15/12/2026"
                    value={busFormData.inspectionExpiry}
                    onChange={(e) =>
                      setBusFormData({ ...busFormData, inspectionExpiry: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày Bảo Dưỡng Gần Nhất
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 01/10/2026"
                    value={busFormData.lastMaintenance}
                    onChange={(e) =>
                      setBusFormData({ ...busFormData, lastMaintenance: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng Thái Hoạt Động
                </label>
                <select
                  value={busFormData.status}
                  onChange={(e) =>
                    setBusFormData({ ...busFormData, status: e.target.value as BusStatus })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                >
                  <option value="AVAILABLE">Sẵn Sàng (Có thể gán chạy chuyến)</option>
                  <option value="MAINTENANCE">Đang Bảo Dưỡng (Không cho gán chuyến)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBusModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white font-bold text-xs shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all"
                >
                  {editingBusId ? 'Lưu Thay Đổi' : 'Thêm Xe Vào Đội'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL THÊM / SỬA TÀI XẾ & NHÂN SỰ */}
      {/* ============================================================== */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#1B5E20]" />
                <h3 className="font-black text-slate-900 text-base">
                  {editingDriverId ? 'Cập Nhật Nhân Sự' : 'Thêm Tài Xế / Phụ Xe Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ Và Tên Nhân Sự*
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={driverFormData.name}
                  onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại Liên Hệ*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 0908.123.456"
                    value={driverFormData.phone}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vai Trò Nhân Sự*
                  </label>
                  <select
                    value={driverFormData.role}
                    onChange={(e) =>
                      setDriverFormData({
                        ...driverFormData,
                        role: e.target.value as 'MAIN_DRIVER' | 'ASSISTANT',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  >
                    <option value="MAIN_DRIVER">Tài Xế Lái Chính</option>
                    <option value="ASSISTANT">Phụ Xe / Tiếp Viên Xe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hạng Bằng Lái
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Hạng E"
                    value={driverFormData.licenseClass}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, licenseClass: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Năm Kinh Nghiệm
                  </label>
                  <input
                    type="number"
                    value={driverFormData.experienceYears}
                    onChange={(e) =>
                      setDriverFormData({
                        ...driverFormData,
                        experienceYears: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tuyến Phụ Trách Chính
                </label>
                <input
                  type="text"
                  placeholder="VD: Chuyên tuyến Sài Gòn ⇄ Đà Lạt"
                  value={driverFormData.mainRoute}
                  onChange={(e) =>
                    setDriverFormData({ ...driverFormData, mainRoute: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng Thái Hiện Tại
                </label>
                <select
                  value={driverFormData.status}
                  onChange={(e) =>
                    setDriverFormData({ ...driverFormData, status: e.target.value as DriverStatus })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                >
                  <option value="AVAILABLE">Đang Rảnh (Sẵn sàng nhận lệnh điều động)</option>
                  <option value="ON_LEAVE">Nghỉ Phép (Không gán chuyến)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white font-bold text-xs shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all"
                >
                  {editingDriverId ? 'Lưu Thay Đổi' : 'Thêm Nhân Sự Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

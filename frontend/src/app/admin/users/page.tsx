'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  UserAccount,
  UserRole,
  UserStatus,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  ROLE_LABELS,
  subscribeBookingStore,
} from '@/services/bookingStore';

export default function AdminUsersManagementPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Alert State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Form Thêm mới
  const [addForm, setAddForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'TICKET_CLERK' as UserRole,
    status: 'ACTIVE' as UserStatus,
  });
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Form Chỉnh sửa
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '', // để trống nếu không đổi
    role: 'TICKET_CLERK' as UserRole,
    status: 'ACTIVE' as UserStatus,
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Tải dữ liệu ban đầu
  const refreshUsers = () => {
    const list = getUsers();
    setUsersList(list);
    const active = getCurrentUser();
    setCurrentUser(active);
  };

  useEffect(() => {
    refreshUsers();
    const unsub = subscribeBookingStore(refreshUsers);
    return () => unsub();
  }, []);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = usersList.length;
    const admins = usersList.filter((u) => u.role === 'SUPER_ADMIN').length;
    const dispatchers = usersList.filter((u) => u.role === 'DISPATCHER').length;
    const clerks = usersList.filter((u) => u.role === 'TICKET_CLERK').length;
    const activeCount = usersList.filter((u) => u.status === 'ACTIVE').length;
    const lockedCount = usersList.filter((u) => u.status === 'LOCKED').length;

    return { total, admins, dispatchers, clerks, activeCount, lockedCount };
  }, [usersList]);

  // Bộ lọc danh sách nhân viên
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone.includes(searchTerm);

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [usersList, searchTerm, roleFilter, statusFilter]);

  // Xử lý tạo tài khoản mới
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.username.trim() || !addForm.phone.trim()) {
      triggerToast('error', 'Vui lòng điền đầy đủ Họ tên, Tên đăng nhập và Số điện thoại!');
      return;
    }
    if (!addForm.password || addForm.password.length < 6) {
      triggerToast('error', 'Mật khẩu phải từ 6 ký tự trở lên!');
      return;
    }

    const res = createUser({
      name: addForm.name,
      username: addForm.username,
      email: addForm.email || addForm.username,
      phone: addForm.phone,
      password: addForm.password,
      role: addForm.role,
      status: addForm.status,
    });

    if (res.success) {
      triggerToast('success', res.message);
      setShowAddModal(false);
      setAddForm({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'TICKET_CLERK',
        status: 'ACTIVE',
      });
      refreshUsers();
    } else {
      triggerToast('error', res.message);
    }
  };

  // Mở modal sửa
  const openEditModal = (u: UserAccount) => {
    setSelectedUser(u);
    setEditForm({
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      password: '', // giữ nguyên trừ khi nhập mới
      role: u.role,
      status: u.status,
    });
    setShowEditModal(true);
  };

  // Lưu chỉnh sửa tài khoản
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!editForm.name.trim() || !editForm.username.trim() || !editForm.phone.trim()) {
      triggerToast('error', 'Vui lòng điền đủ Họ tên, Tên đăng nhập và SĐT!');
      return;
    }

    const updates: Partial<UserAccount> = {
      name: editForm.name.trim(),
      username: editForm.username.trim(),
      email: editForm.email.trim() || editForm.username.trim(),
      phone: editForm.phone.trim(),
      role: editForm.role,
      status: editForm.status,
    };

    if (editForm.password && editForm.password.trim().length >= 6) {
      updates.password = editForm.password.trim();
    }

    const res = updateUser(selectedUser.id, updates);
    if (res.success) {
      triggerToast('success', res.message);
      setShowEditModal(false);
      refreshUsers();
    } else {
      triggerToast('error', res.message);
    }
  };

  // Khóa / Mở khóa nhanh
  const toggleUserStatus = (u: UserAccount) => {
    if (u.username === 'admin@tamnguyenthanh.vn') {
      triggerToast('error', 'Không thể khóa tài khoản Quản Trị Viên Gốc!');
      return;
    }

    const newStatus: UserStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const res = updateUser(u.id, { status: newStatus });
    if (res.success) {
      triggerToast(
        'success',
        `Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${u.name}!`
      );
      refreshUsers();
    } else {
      triggerToast('error', res.message);
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    const res = deleteUser(selectedUser.id);
    if (res.success) {
      triggerToast('success', res.message);
      setShowDeleteModal(false);
      setSelectedUser(null);
      refreshUsers();
    } else {
      triggerToast('error', res.message);
    }
  };

  // NẾU KHÔNG PHẢI SUPER_ADMIN: HIỂN THỊ KHÓA TRUY CẬP
  if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200 shadow-md">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Quyền Truy Cập Bị Giới Hạn</h2>
        <p className="text-sm text-slate-600 mt-2">
          Chỉ có <span className="font-bold text-purple-700">Tổng Giám Đốc / Super Admin</span> mới
          được quyền quản lý danh sách nhân sự và cấu hình tài khoản phân quyền RBAC.
        </p>
        <div className="mt-6">
          <a
            href="/admin"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1B5E20] text-white text-xs font-bold hover:bg-[#2E7D32] transition-colors"
          >
            <span>Quay về Trang Tổng Quan</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-500/50 shadow-emerald-950/40'
              : 'bg-red-900 text-white border-red-500/50 shadow-red-950/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Nhân Sự & Phân Quyền (RBAC)
            </h1>
            <span className="text-[10px] bg-purple-100 text-purple-700 font-black px-2 py-0.5 rounded-md border border-purple-200">
              Chỉ Dành Cho Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống phân quyền 3 cấp độ: Ban Giám Đốc, Trưởng Ca Bến Xe, Nhân Viên Bán Vé POS
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white text-xs font-bold shadow-md shadow-emerald-950/10 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Tài Khoản Mới</span>
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng nhân viên */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng Nhân Sự
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
            <span className="text-[10px] text-emerald-600 font-bold">
              {stats.activeCount} Đang hoạt động
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Super Admin */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ban Giám Đốc
            </span>
            <span className="text-2xl font-black text-purple-700 mt-1 block">{stats.admins}</span>
            <span className="text-[10px] text-slate-500 font-medium">Toàn quyền hệ thống</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Dispatcher */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Điều Hành Bến
            </span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">
              {stats.dispatchers}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Điều phối ca & In phôi A4</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* Ticket Clerks */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Nhân Viên Bán Vé
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.clerks}</span>
            <span className="text-[10px] text-slate-500 font-medium">Quầy vé POS & Tra cứu</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email, username hoặc số điện thoại..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-[#2E7D32] transition-colors"
          />
        </div>

        {/* Dropdowns Filter */}
        <div className="flex items-center space-x-2.5">
          {/* Lọc theo vai trò */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-[#2E7D32]"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="SUPER_ADMIN">Super Admin (Giám Đốc)</option>
            <option value="DISPATCHER">Điều Hành Bến</option>
            <option value="TICKET_CLERK">Nhân Viên Bán Vé</option>
          </select>

          {/* Lọc theo trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'ALL')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-[#2E7D32]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* TABLE USERS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Nhân Viên</th>
                <th className="px-4 py-3.5">Tên Đăng Nhập / Email</th>
                <th className="px-4 py-3.5">Số Điện Thoại</th>
                <th className="px-4 py-3.5">Vai Trò Phân Quyền</th>
                <th className="px-4 py-3.5">Trạng Thái</th>
                <th className="px-4 py-3.5">Lần Đăng Nhập Cuối</th>
                <th className="px-5 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Không tìm thấy nhân viên nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS.TICKET_CLERK;
                  const isRootAdmin = u.username === 'admin@tamnguyenthanh.vn';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Cột 1: Tên & Avatar */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {u.name
                              .split(' ')
                              .slice(-2)
                              .map((w) => w[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{u.name}</span>
                              {isRootAdmin && (
                                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-black border border-amber-200">
                                  Root
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">Tạo: {u.createdAt}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Username / Email */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-slate-800">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{u.username}</span>
                        </div>
                      </td>

                      {/* Cột 3: SĐT */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                      </td>

                      {/* Cột 4: Vai trò */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black border ${roleMeta.badgeClass}`}
                        >
                          {roleMeta.name}
                        </span>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>Đã khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Lần đăng nhập cuối */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{u.lastLogin || 'Chưa đăng nhập'}</span>
                        </div>
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Nút sửa */}
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Chỉnh sửa tài khoản"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Nút Khóa / Mở khóa */}
                          {!isRootAdmin && (
                            <button
                              type="button"
                              onClick={() => toggleUserStatus(u)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                u.status === 'ACTIVE'
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.status === 'ACTIVE' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                            >
                              {u.status === 'ACTIVE' ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Nút Xóa */}
                          {!isRootAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: THÊM TÀI KHOẢN MỚI */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Thêm Tài Khoản Nhân Viên</h3>
                  <p className="text-xs text-slate-500">Khởi tạo thông tin & phân quyền chức vụ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Họ và Tên Nhân Viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2E7D32]"
                />
              </div>

              {/* Grid 2 cột: Username + SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên Đăng Nhập / Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    placeholder="hung.nguyen@tamnguyenthanh.vn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2E7D32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số Điện Thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="0918.xxx.xxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2E7D32]"
                  />
                </div>
              </div>

              {/* Mật khẩu khởi tạo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mật Khẩu Khởi Tạo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2E7D32]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Chọn vai trò (Role Selector) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Chọn Vai Trò & Quyền Hạn (RBAC) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(['SUPER_ADMIN', 'DISPATCHER', 'TICKET_CLERK'] as UserRole[]).map((roleKey) => {
                    const r = ROLE_LABELS[roleKey];
                    const isSelected = addForm.role === roleKey;
                    return (
                      <label
                        key={roleKey}
                        onClick={() => setAddForm({ ...addForm, role: roleKey })}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-start space-x-3 transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addRole"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 text-[#2E7D32] focus:ring-emerald-400"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">{r.name}</span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${r.badgeClass}`}
                            >
                              {r.shortName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {r.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white text-xs font-bold shadow-md hover:from-[#1B5E20] hover:to-[#2E7D32] cursor-pointer"
                >
                  Khởi Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CẬP NHẬT / KHÓA TÀI KHOẢN */}
      {/* ========================================================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Cập Nhật Tài Khoản Nhân Viên
                  </h3>
                  <p className="text-xs text-slate-500">Mã: {selectedUser.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 mt-4">
              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Họ và Tên Nhân Viên
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2E7D32]"
                />
              </div>

              {/* Tên đăng nhập & SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên Đăng Nhập
                  </label>
                  <input
                    type="text"
                    required
                    disabled={selectedUser.username === 'admin@tamnguyenthanh.vn'}
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2E7D32] disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2E7D32]"
                  />
                </div>
              </div>

              {/* Đổi mật khẩu mới (Tùy chọn) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Đặt Mật Khẩu Mới (Để trống nếu giữ nguyên)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Nhập mật khẩu mới (nếu muốn đổi)"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-[#2E7D32]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Thay đổi vai trò */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Vai Trò & Chức Vụ
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(['SUPER_ADMIN', 'DISPATCHER', 'TICKET_CLERK'] as UserRole[]).map((roleKey) => {
                    const r = ROLE_LABELS[roleKey];
                    const isSelected = editForm.role === roleKey;
                    return (
                      <label
                        key={roleKey}
                        onClick={() => setEditForm({ ...editForm, role: roleKey })}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-start space-x-3 transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="editRole"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 text-[#2E7D32] focus:ring-emerald-400"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">{r.name}</span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${r.badgeClass}`}
                            >
                              {r.shortName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {r.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Trạng thái tài khoản (Đang hoạt động / Đã khóa) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Trạng Thái Hoạt Động Của Tài Khoản
                </span>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountStatus"
                      checked={editForm.status === 'ACTIVE'}
                      onChange={() => setEditForm({ ...editForm, status: 'ACTIVE' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-800">
                      🟢 Đang Hoạt Động (Cho phép đăng nhập)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountStatus"
                      disabled={selectedUser.username === 'admin@tamnguyenthanh.vn'}
                      checked={editForm.status === 'LOCKED'}
                      onChange={() => setEditForm({ ...editForm, status: 'LOCKED' })}
                      className="text-red-600 focus:ring-red-500 disabled:opacity-50"
                    />
                    <span className="text-xs font-bold text-red-800">
                      🔒 Đã Khóa (Chặn đăng nhập)
                    </span>
                  </label>
                </div>
                {editForm.status === 'LOCKED' && (
                  <p className="text-[11px] text-red-600 mt-2 font-medium">
                    ⚠️ Chú ý: Khi bị khóa, nhân viên này sẽ bị từ chối truy cập ngay lập tức vào Cổng
                    Quản trị TMS.
                  </p>
                )}
              </div>

              {/* Nút lưu */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white text-xs font-bold shadow-md hover:from-[#1B5E20] hover:to-[#2E7D32] cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: XÁC NHẬN XÓA TÀI KHOẢN */}
      {/* ========================================================= */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Xác Nhận Xóa Tài Khoản?</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Bạn có chắc chắn muốn xóa nhân viên{' '}
              <span className="font-bold text-slate-900">{selectedUser.name}</span> (
              {selectedUser.username}) khỏi hệ thống? Thao tác này không thể hoàn tác.
            </p>

            <div className="mt-5 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

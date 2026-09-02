import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Lock,
  Building2,
  Store,
  User,
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { fetchUsers, createUser, updateUser, deleteUser, clearSuccess } from '../redux/adminSlice';
import { RoleBadge } from '../components/common/Badge';
import { FilterBar } from '../components/common/FilterBar';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, actionLoading, successMessage } = useSelector((state) => state.admin);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'owner',
    address: '',
    phone: '',
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Metric KPI calculation
  const metrics = useMemo(() => {
    const list = users || [];
    return {
      total: list.length,
      owner: list.filter((u) => (u.role || '').toLowerCase() === 'owner').length,
      reseller: list.filter((u) => (u.role || '').toLowerCase() === 'reseller').length,
      distributor: list.filter((u) => (u.role || '').toLowerCase() === 'distributor').length,
      admin: list.filter((u) => (u.role || '').toLowerCase() === 'admin').length,
    };
  }, [users]);

  // Facet configuration with live counts
  const facets = [
    { id: 'ALL', label: 'All Accounts', count: metrics.total },
    { id: 'OWNER', label: 'Vehicle Owners', count: metrics.owner },
    { id: 'RESELLER', label: 'Resellers', count: metrics.reseller },
    { id: 'DISTRIBUTOR', label: 'Distributors', count: metrics.distributor },
    { id: 'ADMIN', label: 'Admins', count: metrics.admin },
  ];

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    let result = (users || []).filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.address && u.address.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q));

      const matchesRole =
        selectedRole === 'ALL' || (u.role || '').toLowerCase() === selectedRole.toLowerCase();

      return matchesSearch && matchesRole;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      return 0;
    });

    return result;
  }, [users, searchQuery, selectedRole, sortBy]);

  // Actions
  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', password: '', role: 'owner', address: '', phone: '' });
    setShowCreateModal(true);
  };

  const handleOpenUpdate = (user) => {
    setActiveUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'owner',
      address: user.address || '',
      phone: user.phone || '',
    });
    setShowUpdateModal(true);
  };

  const handleOpenDelete = (user) => {
    setActiveUser(user);
    setShowDeleteModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    dispatch(createUser(formData)).then((res) => {
      if (!res.error) setShowCreateModal(false);
    });
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    dispatch(
      updateUser({
        id: activeUser.id,
        userData: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          address: formData.address,
          phone: formData.phone,
        },
      })
    ).then((res) => {
      if (!res.error) setShowUpdateModal(false);
    });
  };

  const handleDeleteConfirm = () => {
    if (!activeUser) return;
    dispatch(deleteUser(activeUser.id)).then((res) => {
      if (!res.error) setShowDeleteModal(false);
    });
  };

  // Format creation timestamp
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Table Column Definitions
  const columns = [
    {
      key: 'user',
      label: 'User Profile',
      width: '28%',
      render: (row) => {
        const initials = row.name ? row.name.charAt(0).toUpperCase() : 'U';
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0 shadow-2xs">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs text-slate-900 truncate leading-tight">
                {row.name || 'Unnamed Account'}
              </div>
              <div className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-slate-400 inline" />
                {row.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      label: 'Assigned Role',
      width: '14%',
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: 'phone',
      label: 'Contact',
      width: '16%',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-slate-400" />
          {row.phone || <span className="text-slate-400 font-normal italic">No phone</span>}
        </span>
      ),
    },
    {
      key: 'address',
      label: 'Location / City',
      width: '24%',
      render: (row) => (
        <div className="text-xs font-medium text-slate-600 truncate flex items-center gap-1.5" title={row.address}>
          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">{row.address || <span className="text-slate-400 italic">Not set</span>}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined Date',
      width: '10%',
      render: (row) => (
        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      width: '8%',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenUpdate(row)}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Edit User"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            title="Delete User"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Export Handlers
  const handleExportCSV = () => {
    const headers = ['Full Name', 'Email', 'Role', 'Phone', 'Address', 'Joined Date'];
    const rows = filteredUsers.map((u) => [
      u.name || '',
      u.email || '',
      (u.role || '').toUpperCase(),
      u.phone || '',
      u.address || '',
      formatDate(u.created_at),
    ]);
    exportToCSV(`ngk_users_export_${Date.now()}.csv`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Full Name', 'Email', 'Role', 'Phone', 'Address', 'Joined Date'];
    const rows = filteredUsers.map((u) => [
      u.name || '',
      u.email || '',
      (u.role || '').toUpperCase(),
      u.phone || '',
      u.address || '',
      formatDate(u.created_at),
    ]);
    exportToPDF(`ngk_users_export_${Date.now()}.pdf`, 'NGK User Accounts Directory', headers, rows);
  };

  return (
    <div className="p-5 max-w-[1600px] mx-auto space-y-4 font-sans select-none">
      {/* Top Header & Metrics Strip */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-brand-red flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">User Directory</h1>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5 ml-9">
            Manage authenticated accounts, enterprise access roles, and customer assignments.
          </p>
        </div>

        {/* Quick KPI Chips */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-xs font-black text-slate-900">{metrics.total}</span>
          </div>
          <div className="px-3 py-1.5 bg-sky-50/60 border border-sky-200/70 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Owners</span>
            <span className="text-xs font-black text-sky-900">{metrics.owner}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50/60 border border-emerald-200/70 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Resellers</span>
            <span className="text-xs font-black text-emerald-900">{metrics.reseller}</span>
          </div>
          <div className="px-3 py-1.5 bg-amber-50/60 border border-amber-200/70 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Distributors</span>
            <span className="text-xs font-black text-amber-900">{metrics.distributor}</span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Sophisticated Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter by user name, email, phone, city or address..."
        facets={facets}
        activeFacet={selectedRole}
        onFacetSelect={setSelectedRole}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalResults={filteredUsers.length}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onClearAll={() => {
          setSearchQuery('');
          setSelectedRole('ALL');
          setSortBy('newest');
        }}
        actionButton={
          <button
            onClick={handleOpenCreate}
            className="h-9 px-3 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark text-white rounded-lg font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add User</span>
          </button>
        }
      />

      {/* High-Density Compact Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No user accounts match the selected filter criteria."
        initialPageSize={25}
      />

      {/* 1. Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User Account"
        subtitle="Provision access for vehicle owners, reseller dealers, distributors, or admins"
        icon={Plus}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe / AutoCare Sandton"
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Role Type</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-red focus:outline-none cursor-pointer"
              >
                <option value="owner">Owner</option>
                <option value="reseller">Reseller</option>
                <option value="distributor">Distributor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+27 11 000 0000"
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Physical Address / City</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 10 Main Road, Sandton, Johannesburg"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="h-8.5 px-3 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="h-8.5 px-4 bg-brand-red hover:bg-brand-red-hover text-white rounded-lg text-xs font-extrabold tracking-wide flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit User Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Edit User Profile"
        subtitle={`Updating account: ${activeUser?.email}`}
        icon={Edit2}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-red focus:outline-none cursor-pointer"
              >
                <option value="owner">Owner</option>
                <option value="reseller">Reseller</option>
                <option value="distributor">Distributor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+27..."
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Address / Location</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowUpdateModal(false)}
              className="h-8.5 px-3 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="h-8.5 px-4 bg-brand-red hover:bg-brand-red-hover text-white rounded-lg text-xs font-extrabold tracking-wide flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User Account"
        subtitle="This action is permanent and cannot be undone."
        icon={AlertTriangle}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            Are you sure you want to permanently remove{' '}
            <strong className="text-slate-900">{activeUser?.name}</strong> ({activeUser?.email})? All associated records will be purged.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="h-8.5 px-3 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="h-8.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-extrabold tracking-wide flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;

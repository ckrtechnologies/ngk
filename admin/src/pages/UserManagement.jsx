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
  Eye,
  Car,
  Bookmark,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Clock,
  FileText,
  Compass,
  XCircle,
  Hash,
} from 'lucide-react';
import {
  fetchUsers,
  fetchUserById,
  createUser,
  updateUser,
  deleteUser,
  clearSuccess,
  clearSelectedUserDetails,
} from '../redux/adminSlice';
import { RoleBadge } from '../components/common/Badge';
import { FilterBar } from '../components/common/FilterBar';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import {
  detectCurrentLocation,
  geocodeAddress,
  reverseGeocode,
  SOUTH_AFRICA_CITY_PRESETS,
} from '../utils/locationService';

const UserManagement = () => {
  const dispatch = useDispatch();
  const {
    users,
    selectedUserDetails,
    detailsLoading,
    loading,
    actionLoading,
    successMessage,
  } = useSelector((state) => state.admin);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Modal & Inspector States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab] = useState('overview'); // 'overview' | 'role_data' | 'enquiries'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoNotice, setGeoNotice] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'owner',
    address: '',
    phone: '',
    company_name: '',
    city: '',
    latitude: '',
    longitude: '',
    approval_status: 'approved',
    rejection_reason: '',
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
      pending: list.filter((u) => {
        const r = (u.role || '').toLowerCase();
        return (
          (r === 'reseller' || r === 'distributor') &&
          !u.is_approved &&
          u.approval_status !== 'approved'
        );
      }).length,
      owner: list.filter((u) => (u.role || '').toLowerCase() === 'owner').length,
      reseller: list.filter((u) => (u.role || '').toLowerCase() === 'reseller').length,
      distributor: list.filter((u) => (u.role || '').toLowerCase() === 'distributor').length,
      admin: list.filter((u) => (u.role || '').toLowerCase() === 'admin').length,
    };
  }, [users]);

  // Facet configuration with live counts
  const facets = [
    { id: 'ALL', label: 'All Accounts', count: metrics.total },
    { id: 'PENDING', label: 'Pending Approval', count: metrics.pending },
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

      const isCommercial =
        (u.role || '').toLowerCase() === 'reseller' ||
        (u.role || '').toLowerCase() === 'distributor';
      const isPending = isCommercial && !u.is_approved && u.approval_status !== 'approved';

      const matchesRole =
        selectedRole === 'ALL'
          ? true
          : selectedRole === 'PENDING'
          ? isPending
          : (u.role || '').toLowerCase() === selectedRole.toLowerCase();

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

  // Copy User ID Helper
  const handleCopyId = (id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // --- Geolocation & Address Prefetch Handlers ---
  const handleAutoDetectLocation = async () => {
    setGeoLoading(true);
    setGeoNotice(null);
    try {
      const loc = await detectCurrentLocation();
      setFormData((prev) => ({
        ...prev,
        address: loc.address,
        city: loc.city || prev.city || 'Johannesburg',
        latitude: String(loc.latitude),
        longitude: String(loc.longitude),
      }));
      setGeoNotice(`📍 Location & address acquired: ${loc.city} (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`);
    } catch (err) {
      setGeoNotice(`⚠️ ${err.message}`);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleLookupCoordsFromAddress = async () => {
    if (!formData.address || !formData.address.trim()) {
      setGeoNotice('⚠️ Please enter an address first to lookup coordinates.');
      return;
    }
    setGeoLoading(true);
    setGeoNotice(null);
    try {
      const res = await geocodeAddress(formData.address);
      setFormData((prev) => ({
        ...prev,
        latitude: String(res.latitude),
        longitude: String(res.longitude),
        address: res.formattedAddress || prev.address,
      }));
      setGeoNotice(`📍 GPS found: ${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}`);
    } catch (err) {
      setGeoNotice(`⚠️ ${err.message}`);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleReverseGeocodeFromCoords = async () => {
    if (!formData.latitude || !formData.longitude) {
      setGeoNotice('⚠️ Please enter both latitude and longitude to fetch address.');
      return;
    }
    setGeoLoading(true);
    setGeoNotice(null);
    try {
      const res = await reverseGeocode(formData.latitude, formData.longitude);
      setFormData((prev) => ({
        ...prev,
        address: res.address,
        city: res.city || prev.city,
      }));
      setGeoNotice(`📍 Address prefetched: ${res.city}`);
    } catch (err) {
      setGeoNotice(`⚠️ ${err.message}`);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSelectCityPreset = (presetName) => {
    const p = SOUTH_AFRICA_CITY_PRESETS.find((x) => x.name === presetName);
    if (p) {
      setFormData((prev) => ({
        ...prev,
        address: prev.address && prev.address.length > 5 ? prev.address : p.address,
        city: p.city,
        latitude: String(p.lat),
        longitude: String(p.lon),
      }));
      setGeoNotice(`📍 Applied preset for ${p.name}`);
    }
  };

  // --- Actions ---

  // 1. Open Master Detail Modal
  const handleOpenDetail = (user) => {
    setActiveUser(user);
    setDetailTab('overview');
    setShowDetailModal(true);
    dispatch(fetchUserById(user.id));
  };

  // 2. Open Create User Modal
  const handleOpenCreate = () => {
    setGeoNotice(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'owner',
      address: '',
      phone: '',
      company_name: '',
      city: 'Johannesburg',
      latitude: '-26.2041',
      longitude: '28.0473',
      approval_status: 'approved',
      rejection_reason: '',
    });
    setShowCreateModal(true);
  };

  // 3. Open Update User Modal
  const handleOpenUpdate = (user) => {
    setActiveUser(user);
    setGeoNotice(null);
    const isCommercial = (user.role || '').toLowerCase() === 'reseller' || (user.role || '').toLowerCase() === 'distributor';
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'owner',
      address: user.address || user.dealer?.street_address || '',
      phone: user.phone || user.dealer?.phone || '',
      company_name: user.dealer?.company_name || user.name || '',
      city: user.dealer?.city || 'Johannesburg',
      latitude: user.dealer?.latitude !== undefined && user.dealer?.latitude !== null ? String(user.dealer.latitude) : '',
      longitude: user.dealer?.longitude !== undefined && user.dealer?.longitude !== null ? String(user.dealer.longitude) : '',
      approval_status: user.approval_status || (user.is_approved ? 'approved' : isCommercial ? 'pending_approval' : 'approved'),
      rejection_reason: user.rejection_reason || '',
    });
    setShowUpdateModal(true);
  };

  // 4. Open Delete Confirmation Modal
  const handleOpenDelete = (user) => {
    setActiveUser(user);
    setShowDeleteModal(true);
  };

  // Create Submit
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const isCommercial = formData.role === 'reseller' || formData.role === 'distributor';
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      address: formData.address,
      phone: formData.phone,
    };
    if (isCommercial) {
      payload.company_name = formData.company_name || formData.name;
      payload.city = formData.city || 'Johannesburg';
      if (formData.latitude) payload.latitude = parseFloat(formData.latitude);
      if (formData.longitude) payload.longitude = parseFloat(formData.longitude);
    }

    dispatch(createUser(payload)).then((res) => {
      if (!res.error) {
        setShowCreateModal(false);
        dispatch(fetchUsers());
      }
    });
  };

  // Update Submit
  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    const isCommercial = formData.role === 'reseller' || formData.role === 'distributor';
    const updatePayload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      address: formData.address,
      phone: formData.phone,
      approval_status: formData.approval_status,
      is_approved: formData.approval_status === 'approved',
      rejection_reason: formData.approval_status === 'rejected' ? formData.rejection_reason : null,
    };

    if (formData.password && formData.password.trim().length >= 6) {
      updatePayload.password = formData.password.trim();
    }

    if (isCommercial) {
      updatePayload.company_name = formData.company_name || formData.name;
      updatePayload.city = formData.city || 'Johannesburg';
      if (formData.latitude) updatePayload.latitude = formData.latitude;
      if (formData.longitude) updatePayload.longitude = formData.longitude;
    }

    dispatch(
      updateUser({
        id: activeUser.id,
        userData: updatePayload,
      })
    ).then((res) => {
      if (!res.error) {
        setShowUpdateModal(false);
        dispatch(fetchUsers());
        if (showDetailModal && activeUser) {
          dispatch(fetchUserById(activeUser.id));
        }
      }
    });
  };

  // Delete Confirm
  const handleDeleteConfirm = () => {
    if (!activeUser) return;
    dispatch(deleteUser(activeUser.id)).then((res) => {
      if (!res.error) {
        setShowDeleteModal(false);
        setShowDetailModal(false);
      }
    });
  };

  // Toggle Approval Quick Handler
  const handleToggleApproval = (user, approve) => {
    const targetStatus = approve ? 'approved' : 'suspended';
    dispatch(
      updateUser({
        id: user.id,
        userData: {
          is_approved: approve,
          approval_status: targetStatus,
        },
      })
    ).then((res) => {
      if (!res.error) {
        dispatch(fetchUsers());
        if (showDetailModal && activeUser?.id === user.id) {
          dispatch(fetchUserById(user.id));
        }
      }
    });
  };

  // Helper to get active detailed user object
  const detailedUser = useMemo(() => {
    if (selectedUserDetails && activeUser && selectedUserDetails.id === activeUser.id) {
      return selectedUserDetails;
    }
    return activeUser || {};
  }, [selectedUserDetails, activeUser]);

  // Table Column Definitions
  const columns = [
    {
      key: 'user',
      label: 'User Profile',
      width: '26%',
      render: (row) => {
        const initials = row.name ? row.name.charAt(0).toUpperCase() : 'U';
        return (
          <div
            onClick={() => handleOpenDetail(row)}
            className="flex items-center gap-2.5 group cursor-pointer"
            title="Click to inspect complete master record"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0 shadow-2xs group-hover:bg-brand-red transition-colors">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs text-slate-900 truncate leading-tight group-hover:text-brand-red transition-colors flex items-center gap-1.5">
                <span>{row.name || 'Unnamed Account'}</span>
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
      width: '12%',
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: 'approval',
      label: 'Status / Live',
      width: '14%',
      render: (row) => {
        const role = (row.role || '').toLowerCase();
        if (role === 'owner' || role === 'admin') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              Verified User
            </span>
          );
        }
        const approved = row.is_approved === true || row.approval_status === 'approved';
        const rejected = row.approval_status === 'rejected';
        const suspended = row.approval_status === 'suspended';

        if (approved) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Live & Approved
            </span>
          );
        }
        if (suspended) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
              <XCircle className="w-3 h-3 text-slate-500" />
              Suspended
            </span>
          );
        }
        if (rejected) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Rejected
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
            Review Pending
          </span>
        );
      },
    },
    {
      key: 'phone',
      label: 'Contact',
      width: '12%',
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
      width: '16%',
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
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      width: '10%',
      render: (row) => {
        const role = (row.role || '').toLowerCase();
        const isCommercial = role === 'reseller' || role === 'distributor';
        const isApproved = row.is_approved === true || row.approval_status === 'approved';

        return (
          <div className="flex items-center justify-end gap-1">
            {/* View Master Inspect Button */}
            <button
              onClick={() => handleOpenDetail(row)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="View Complete Master Record"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {isCommercial &&
              (!isApproved ? (
                <button
                  onClick={() => handleToggleApproval(row, true)}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Approve Dealer to Go Live"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Approve
                </button>
              ) : (
                <button
                  onClick={() => handleToggleApproval(row, false)}
                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded text-[10px] font-bold cursor-pointer transition-colors border border-slate-200"
                  title="Suspend Dealer"
                >
                  Suspend
                </button>
              ))}

            <button
              onClick={() => handleOpenUpdate(row)}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Edit User Master"
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
        );
      },
    },
  ];

  // Export Handlers
  const handleExportCSV = () => {
    const headers = ['Full Name', 'Email', 'Role', 'Status', 'Phone', 'Address', 'Joined Date'];
    const rows = filteredUsers.map((u) => [
      u.name || '',
      u.email || '',
      (u.role || '').toUpperCase(),
      u.approval_status || (u.is_approved ? 'APPROVED' : 'PENDING'),
      u.phone || '',
      u.address || '',
      formatDate(u.created_at),
    ]);
    exportToCSV(`ngk_users_master_${Date.now()}.csv`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Full Name', 'Email', 'Role', 'Status', 'Phone', 'Address', 'Joined Date'];
    const rows = filteredUsers.map((u) => [
      u.name || '',
      u.email || '',
      (u.role || '').toUpperCase(),
      u.approval_status || (u.is_approved ? 'APPROVED' : 'PENDING'),
      u.phone || '',
      u.address || '',
      formatDate(u.created_at),
    ]);
    exportToPDF(`ngk_users_master_${Date.now()}.pdf`, 'NGK User Master Directory', headers, rows);
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
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">User Master Directory</h1>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5 ml-9">
            Manage authenticated accounts, enterprise access roles, customer vehicles, and commercial stockist lifecycles.
          </p>
        </div>

        {/* Quick KPI Chips */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {metrics.pending > 0 && (
            <button
              onClick={() => setSelectedRole('PENDING')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                selectedRole === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-2xs font-extrabold'
                  : 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-[10px] uppercase tracking-wider">Pending Review</span>
              <span className="text-xs font-black">{metrics.pending}</span>
            </button>
          )}
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
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

      {/* ========================================================================= */}
      {/* 1. MASTER RECORD INSPECTOR MODAL (READ / VIEW COMPLETE PROFILE)           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          dispatch(clearSelectedUserDetails());
        }}
        title="User Master Profile"
        subtitle={`ID: ${detailedUser.id || ''}`}
        icon={Eye}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          {/* Top User Hero Header */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-xl bg-slate-800 border-2 border-slate-700 text-brand-red flex items-center justify-center font-black text-xl shadow-inner">
                {detailedUser.name ? detailedUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black tracking-tight text-white">
                    {detailedUser.name || 'Unnamed Account'}
                  </h2>
                  <RoleBadge role={detailedUser.role} />
                  {detailedUser.is_approved ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Live & Approved
                    </span>
                  ) : detailedUser.approval_status === 'rejected' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Rejected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Review Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-medium">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Mail className="w-3 h-3 text-slate-500" />
                    {detailedUser.email}
                  </span>
                  {detailedUser.phone && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {detailedUser.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions in Hero */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => handleCopyId(detailedUser.id)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                title="Copy User ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenUpdate(detailedUser);
                }}
                className="px-3 py-1.5 bg-brand-red hover:bg-brand-red-hover text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setDetailTab('overview')}
              className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                detailTab === 'overview'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Master Overview</span>
            </button>

            <button
              onClick={() => setDetailTab('role_data')}
              className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                detailTab === 'role_data'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {detailedUser.role === 'owner' ? (
                <>
                  <Car className="w-3.5 h-3.5" />
                  <span>Garage & Watchlist ({detailedUser.garage?.length || 0})</span>
                </>
              ) : detailedUser.role === 'admin' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Privileges</span>
                </>
              ) : (
                <>
                  <Store className="w-3.5 h-3.5" />
                  <span>Trade & Directory Master</span>
                </>
              )}
            </button>

            <button
              onClick={() => setDetailTab('enquiries')}
              className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                detailTab === 'enquiries'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Support & Enquiries ({detailedUser.enquiries?.length || 0})</span>
            </button>
          </div>

          {/* Tab 1: Master Overview */}
          {detailTab === 'overview' && (
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Account & Security Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    Account & Credentials
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-semibold text-slate-500">Account Type:</span>
                      <span className="font-bold text-slate-900 capitalize">{detailedUser.role || 'owner'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-semibold text-slate-500">Registered Date:</span>
                      <span className="font-bold text-slate-900">{formatDateTime(detailedUser.created_at)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-semibold text-slate-500">Last Profile Update:</span>
                      <span className="font-bold text-slate-900">{formatDateTime(detailedUser.updated_at)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold text-slate-500">Approval Lifecycle:</span>
                      <span className="font-bold text-slate-900 capitalize">{detailedUser.approval_status || 'approved'}</span>
                    </div>
                  </div>
                </div>

                {/* Contact & Physical Address Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    Contact & Location Master
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-semibold text-slate-500">Phone Number:</span>
                      <span className="font-bold text-slate-900">{detailedUser.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="font-semibold text-slate-500">Official Email:</span>
                      <span className="font-bold text-slate-900">{detailedUser.email}</span>
                    </div>
                    <div className="py-1">
                      <span className="font-semibold text-slate-500 block mb-1">Physical Trading / Residential Address:</span>
                      <p className="font-semibold text-slate-800 bg-white p-2 rounded border border-slate-200 text-[11px]">
                        {detailedUser.address || detailedUser.dealer?.street_address || 'No physical address on file'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval status banner for commercial accounts */}
              {(detailedUser.role === 'reseller' || detailedUser.role === 'distributor') && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    detailedUser.is_approved
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {detailedUser.is_approved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-black">
                        {detailedUser.is_approved ? 'Verified NGK Partner (Live)' : 'Commercial Partner Awaiting Review'}
                      </div>
                      <div className="text-[11px] font-medium opacity-80">
                        {detailedUser.is_approved
                          ? 'This partner is published to the public dealer locator and can receive parts enquiries.'
                          : 'This partner is currently hidden from public maps until administrator verification.'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleApproval(detailedUser, !detailedUser.is_approved)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors whitespace-nowrap shadow-2xs ${
                      detailedUser.is_approved
                        ? 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {detailedUser.is_approved ? 'Suspend Account' : 'Approve & Go Live'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Role-Specific Master Data */}
          {detailTab === 'role_data' && (
            <div className="space-y-3.5 pt-1">
              {/* If Vehicle Owner: Garage & Watchlist */}
              {detailedUser.role === 'owner' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-brand-red" />
                      Registered Garage Vehicles
                    </h3>
                    <span className="text-[11px] font-bold text-slate-500">
                      {detailedUser.garage?.length || 0} vehicle(s)
                    </span>
                  </div>

                  {detailsLoading ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-red" />
                      Loading garage vehicles...
                    </div>
                  ) : !detailedUser.garage || detailedUser.garage.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                      <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600">No vehicles registered yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        This owner has not added any vehicles to their digital garage.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {detailedUser.garage.map((v, idx) => (
                        <div
                          key={v.id || idx}
                          className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">
                              {v.year} {v.make} {v.model}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                              {v.engine || v.engine_code || 'Standard Engine'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5 font-medium">
                            <div>
                              <span className="text-slate-400">Reg / Plate:</span>{' '}
                              <strong className="text-slate-800">{v.licensePlate || v.license_plate || 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">VIN:</span>{' '}
                              <strong className="text-slate-800">{v.vin || 'N/A'}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Watchlist Section */}
                  <div className="pt-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Bookmark className="w-4 h-4 text-sky-600" />
                      Watched Articles ({detailedUser.watchlist?.length || 0})
                    </h3>
                    {!detailedUser.watchlist || detailedUser.watchlist.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No articles saved to watchlist.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {detailedUser.watchlist.map((item, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold"
                          >
                            {item.article_no || item.product_id || item.part_number || 'Part Item'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* If Reseller or Distributor: Trade Directory Record */}
              {(detailedUser.role === 'reseller' || detailedUser.role === 'distributor') && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-600" />
                        <span>Commercial Stockist Record</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                        {detailedUser.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Trading Company Name</span>
                        <p className="font-black text-slate-900 text-xs">
                          {detailedUser.dealer?.company_name || detailedUser.name}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Trading City / Region</span>
                        <p className="font-bold text-slate-800 text-xs">
                          {detailedUser.dealer?.city || 'Johannesburg, South Africa'}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-semibold block mb-0.5">Storefront Street Address</span>
                        <p className="font-semibold text-slate-800 text-xs bg-white p-2 rounded border border-slate-200">
                          {detailedUser.dealer?.street_address || detailedUser.address || 'Address pending setup'}
                        </p>
                      </div>

                      <div className="sm:col-span-2 p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-slate-600" />
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block">
                              Geolocation Coordinates
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900">
                              Lat: {detailedUser.dealer?.latitude || '-26.2041'}, Lon:{' '}
                              {detailedUser.dealer?.longitude || '28.0473'}
                            </span>
                          </div>
                        </div>

                        {detailedUser.dealer?.latitude && detailedUser.dealer?.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${detailedUser.dealer.latitude},${detailedUser.dealer.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open in Google Maps</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If Admin: System Privileges */}
              {detailedUser.role === 'admin' && (
                <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-brand-red" />
                    <span>Administrative Privilege Level</span>
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    This account holds <strong>Super Administrator</strong> authority with complete CRUD control over
                    system users, technical support tickets, dealers directory, and TecDoc catalog synchronization.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Enquiries & Tickets */}
          {detailTab === 'enquiries' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Related Enquiries & Leads
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {detailedUser.enquiries?.length || 0} record(s)
                </span>
              </div>

              {!detailedUser.enquiries || detailedUser.enquiries.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No support enquiries found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    This user does not have any active or past parts enquiries.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {detailedUser.enquiries.map((ticket, idx) => (
                    <div
                      key={ticket.id || idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 truncate flex items-center gap-2">
                          <span className="font-mono text-brand-red font-black">
                            #{ticket.ticket_number || ticket.id?.slice(0, 8)}
                          </span>
                          <span className="truncate">{ticket.subject || 'Parts Inquiry'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Created {formatDateTime(ticket.created_at)}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          ticket.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ticket.status === 'in_progress'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ticket.status || 'open'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Master Inspector Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              onClick={() => {
                setShowDetailModal(false);
                handleOpenDelete(detailedUser);
              }}
              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete User</span>
            </button>

            <button
              onClick={() => setShowDetailModal(false)}
              className="h-8.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold tracking-wide cursor-pointer transition-colors"
            >
              Close Master
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. CREATE USER MODAL (CREATE MASTER)                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User Master"
        subtitle="Provision access for vehicle owners, reseller dealers, distributors, or admins"
        icon={Plus}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe / Sandton Spares"
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Role Type</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-red focus:outline-none cursor-pointer"
              >
                <option value="owner">Vehicle Owner</option>
                <option value="reseller">Reseller (Stockist)</option>
                <option value="distributor">Distributor</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
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
                placeholder="Min 6 chars"
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
              />
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
          </div>

          {/* Smart Location & Address Assistant Strip */}
          <div className="p-3 bg-gradient-to-br from-slate-50 to-rose-50/25 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-brand-red" />
                Smart Location & GPS Assistant
              </span>
              {geoLoading && (
                <span className="text-[10px] font-bold text-brand-red flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching location...
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={geoLoading}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-[11px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                title="Auto-detect GPS and prefetch street address"
              >
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>📍 Auto-Detect GPS & Address</span>
              </button>

              <button
                type="button"
                onClick={handleLookupCoordsFromAddress}
                disabled={geoLoading || !formData.address}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-[11px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors disabled:opacity-40"
                title="Lookup coordinates from the entered address"
              >
                <Compass className="w-3 h-3 text-sky-600" />
                <span>🔍 GPS from Address</span>
              </button>

              <button
                type="button"
                onClick={handleReverseGeocodeFromCoords}
                disabled={geoLoading || !formData.latitude || !formData.longitude}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-[11px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors disabled:opacity-40"
                title="Reverse geocode address text from coordinates"
              >
                <RefreshCw className="w-3 h-3 text-amber-600" />
                <span>🔄 Address from GPS</span>
              </button>

              <select
                onChange={(e) => {
                  if (e.target.value) handleSelectCityPreset(e.target.value);
                }}
                defaultValue=""
                className="h-6.5 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 focus:outline-none focus:border-brand-red cursor-pointer"
              >
                <option value="" disabled>🇿🇦 Quick Presets...</option>
                {SOUTH_AFRICA_CITY_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {geoNotice && (
              <div className="text-[10px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{geoNotice}</span>
                <span className="text-[9px] text-slate-400 ml-auto font-medium italic whitespace-nowrap">Editable below</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600">Physical Street Address / Location</label>
              {formData.address && (
                <button
                  type="button"
                  onClick={handleLookupCoordsFromAddress}
                  className="text-[10px] font-extrabold text-brand-red hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Compass className="w-3 h-3" /> Fetch GPS
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 10 Main Road, Sandton, Johannesburg"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none resize-none"
            />
          </div>

          {/* Commercial Specific Setup for Reseller & Distributor */}
          {(formData.role === 'reseller' || formData.role === 'distributor') && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
              <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-700" />
                Commercial Directory Setup
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Trading Company Name</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Defaults to Full Name"
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">City / Province</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Johannesburg"
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">GPS Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-26.2041"
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">GPS Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="28.0473"
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

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
              Create Master Record
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. EDIT USER MODAL (UPDATE MASTER)                                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Edit User Master Record"
        subtitle={`Updating: ${activeUser?.email}`}
        icon={Edit2}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Role Type</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-red focus:outline-none cursor-pointer"
              >
                <option value="owner">Vehicle Owner</option>
                <option value="reseller">Reseller (Stockist)</option>
                <option value="distributor">Distributor</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
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
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+27..."
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
              />
            </div>
          </div>

          {/* Password Reset Option */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Reset Password (Optional)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank to keep existing password"
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
            />
            <p className="text-[10px] text-slate-400">If filled, minimum 6 characters are required.</p>
          </div>

          {/* Approval Lifecycle Control */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className={formData.approval_status === 'rejected' ? 'col-span-1' : 'col-span-2'}>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Approval Status</label>
              <select
                value={formData.approval_status}
                onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-red focus:outline-none cursor-pointer"
              >
                <option value="approved">Live & Approved</option>
                <option value="pending_approval">Review Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {formData.approval_status === 'rejected' && (
              <div className="col-span-1">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Rejection Note</label>
                <input
                  type="text"
                  value={formData.rejection_reason}
                  onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                  placeholder="Reason for rejection"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Smart Location & Address Assistant Strip */}
          <div className="p-3 bg-gradient-to-br from-slate-50 to-rose-50/25 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-brand-red" />
                Smart Location & GPS Assistant
              </span>
              {geoLoading && (
                <span className="text-[10px] font-bold text-brand-red flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching location...
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={geoLoading}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-[11px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                title="Auto-detect GPS and prefetch street address"
              >
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>📍 Auto-Detect GPS & Address</span>
              </button>

              <button
                type="button"
                onClick={handleLookupCoordsFromAddress}
                disabled={geoLoading || !formData.address}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-[11px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors disabled:opacity-40"
                title="Lookup coordinates from the entered address"
              >
                <Compass className="w-3 h-3 text-sky-600" />
                <span>🔍 GPS from Address</span>
              </button>

              <button
                type="button"
                onClick={handleReverseGeocodeFromCoords}
                disabled={geoLoading || !formData.latitude || !formData.longitude}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-[11px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors disabled:opacity-40"
                title="Reverse geocode address text from coordinates"
              >
                <RefreshCw className="w-3 h-3 text-amber-600" />
                <span>🔄 Address from GPS</span>
              </button>

              <select
                onChange={(e) => {
                  if (e.target.value) handleSelectCityPreset(e.target.value);
                }}
                defaultValue=""
                className="h-6.5 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 focus:outline-none focus:border-brand-red cursor-pointer"
              >
                <option value="" disabled>🇿🇦 Quick Presets...</option>
                {SOUTH_AFRICA_CITY_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {geoNotice && (
              <div className="text-[10px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{geoNotice}</span>
                <span className="text-[9px] text-slate-400 ml-auto font-medium italic whitespace-nowrap">Editable below</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600">Physical Street Address / Location</label>
              {formData.address && (
                <button
                  type="button"
                  onClick={handleLookupCoordsFromAddress}
                  className="text-[10px] font-extrabold text-brand-red hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Compass className="w-3 h-3" /> Fetch GPS
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none resize-none"
            />
          </div>

          {/* Commercial Specific Fields */}
          {(formData.role === 'reseller' || formData.role === 'distributor') && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-600" />
                Commercial Directory Sync
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Company / Trade Name</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">GPS Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-26.2041"
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">GPS Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="28.0473"
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-red focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

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

      {/* ========================================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL (DELETE MASTER)                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User Master Account"
        subtitle="This action is permanent and cascades across all relations."
        icon={AlertTriangle}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            Are you sure you want to permanently remove{' '}
            <strong className="text-slate-900">{activeUser?.name}</strong> ({activeUser?.email})? All associated garage
            vehicles, watchlist entries, and dealer directory associations will be purged.
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

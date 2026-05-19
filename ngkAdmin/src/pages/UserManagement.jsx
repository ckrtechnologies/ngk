import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Search, Plus, Edit, Trash2, ShieldCheck, Mail, MapPin, X, Loader2 } from 'lucide-react';
import { fetchUsers, createUser, updateUser, deleteUser, clearSuccess, clearError } from '../redux/adminSlice';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, actionLoading, error, successMessage } = useSelector((state) => state.admin);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  // Form States
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'owner', address: '' });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', password: '', role: 'owner', address: '' });
    setShowCreateModal(true);
  };

  const handleOpenUpdate = (user) => {
    setActiveUser(user);
    setFormData({ name: user.name || '', email: user.email || '', password: '', role: user.role || 'owner', address: user.address || '' });
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
    dispatch(updateUser({ id: activeUser.id, userData: { name: formData.name, email: formData.email, role: formData.role, address: formData.address } })).then((res) => {
      if (!res.error) setShowUpdateModal(false);
    });
  };

  const handleDeleteConfirm = () => {
    dispatch(deleteUser(activeUser.id)).then((res) => {
      if (!res.error) setShowDeleteModal(false);
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || (u.role || '').toLowerCase() === selectedRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const roles = ['ALL', 'OWNER', 'RESELLER', 'DISTRIBUTOR', 'ADMIN'];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-red-50 text-[#C6122E] rounded-2xl flex items-center justify-center shadow-inner border border-red-100">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-wide">USER MANAGEMENT</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
              Manage accounts, roles, distributors, and permissions
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="h-14 px-8 bg-[#C6122E] hover:bg-red-700 active:bg-red-800 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-red-900/30 transition-all duration-200 flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          CREATE NEW USER
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <span className="text-sm font-bold tracking-wide">{successMessage}</span>
          <button onClick={() => dispatch(clearSuccess())} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        {/* Search */}
        <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-2xl w-full md:w-96 border border-gray-200 focus-within:border-[#C6122E] focus-within:bg-white transition-all duration-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold text-gray-800 w-full placeholder:text-gray-400"
          />
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-6 py-3 rounded-2xl font-black text-xs tracking-wider transition-all duration-200 ${
                selectedRole === role
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/30'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-[#C6122E] animate-spin" />
            <span className="text-sm font-bold text-gray-400 tracking-wider">LOADING USER DATABASE...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="py-5 px-8">User Profile</th>
                  <th className="py-5 px-6">Contact Email</th>
                  <th className="py-5 px-6">Assigned Role</th>
                  <th className="py-5 px-6">Physical Address</th>
                  <th className="py-5 px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-sm text-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                    {/* Name / Avatar */}
                    <td className="py-5 px-8 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-gray-100 group-hover:bg-red-50 group-hover:text-[#C6122E] flex items-center justify-center font-black text-gray-600 transition-colors duration-200">
                        {(user.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">{user.name || 'Unnamed User'}</span>
                        <span className="text-xs text-gray-400 font-semibold">ID: {user.id.slice(0, 8)}...</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email || 'No email provided'}
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-5 px-6">
                      <span className={`px-4 py-1.5 rounded-xl font-black text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5 ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        user.role === 'distributor' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        user.role === 'reseller' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {user.role || 'Owner'}
                      </span>
                    </td>

                    {/* Address */}
                    <td className="py-5 px-6 max-w-xs truncate text-gray-500">
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{user.address || 'Address not shared'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-5 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenUpdate(user)}
                          className="p-2.5 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition-all duration-200"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(user)}
                          className="p-2.5 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 transition-all duration-200"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Users className="w-12 h-12 stroke-1" />
            <span className="text-sm font-bold tracking-wider uppercase">No matching users found</span>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl border border-gray-100 space-y-6 relative animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-wide">CREATE NEW USER</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Add a new account to the enterprise database</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5 font-semibold text-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-gray-800 focus:border-[#C6122E] focus:bg-white focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-gray-800 focus:border-[#C6122E] focus:bg-white focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-gray-800 focus:border-[#C6122E] focus:bg-white focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Account Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-gray-800 focus:border-[#C6122E] focus:bg-white focus:outline-none transition-all duration-200 font-bold uppercase"
                  >
                    <option value="owner">Owner</option>
                    <option value="reseller">Reseller</option>
                    <option value="distributor">Distributor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City"
                    className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-gray-800 focus:border-[#C6122E] focus:bg-white focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-200"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-14 bg-[#C6122E] hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-red-900/30 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CONFIRM CREATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE USER MODAL */}
      {showUpdateModal && activeUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl border border-gray-100 space-y-6 relative animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-wide">UPDATE USER ACCOUNT</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Modify existing account details and permissions</p>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-5 font-semibold text-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-gray-800 focus:border-[#C6122E] focus:bg-white focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-gray-800 focus:border-[#C6122E] focus:bg-white focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Account Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-gray-800 focus:border-[#C6122E] focus:bg-white focus:outline-none transition-all duration-200 font-bold uppercase"
                  >
                    <option value="owner">Owner</option>
                    <option value="reseller">Reseller</option>
                    <option value="distributor">Distributor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City"
                    className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-gray-800 focus:border-[#C6122E] focus:bg-white focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-200"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-14 bg-[#C6122E] hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-red-900/30 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && activeUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-100 text-center space-y-6 relative animate-scale-up">
            <div className="w-16 h-16 bg-red-50 text-[#C6122E] rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-red-100">
              <Trash2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-wide">CONFIRM DELETION</h2>
              <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">
                Are you absolutely sure you want to delete <span className="font-bold text-gray-900">{activeUser.name || activeUser.email}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-200"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="flex-1 h-14 bg-[#C6122E] hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-red-900/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'DELETE USER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

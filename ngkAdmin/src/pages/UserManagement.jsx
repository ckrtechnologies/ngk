import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Search, Plus, Edit, Trash2, ShieldCheck, Mail, MapPin, X, Loader2 } from 'lucide-react';
import { fetchUsers, createUser, updateUser, deleteUser, clearSuccess } from '../redux/adminSlice';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, actionLoading, successMessage } = useSelector((state) => state.admin);

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
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-brand-red rounded-xl flex items-center justify-center border border-rose-100/55 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase">User Management</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Manage accounts, roles, distributors, and permissions
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="h-11 px-5 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark text-white rounded-xl font-bold text-xs tracking-wider uppercase shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New User
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <span className="text-xs font-semibold tracking-wide">{successMessage}</span>
          <button onClick={() => dispatch(clearSuccess())} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-premium">
        {/* Search */}
        <div className="flex items-center gap-3 bg-slate-100/50 px-4 py-2.5 rounded-xl w-full md:w-96 border border-slate-200/40 focus-within:border-brand-red focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-red/5 transition-all duration-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 w-full placeholder:text-slate-400"
          />
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all duration-200 ${
                selectedRole === role
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200/80 hover:text-slate-800'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-premium overflow-hidden">
        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            <span className="text-[10px] font-bold text-slate-400 tracking-widest">LOADING USER DATABASE...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-6">User Profile</th>
                  <th className="py-4 px-5">Contact Email</th>
                  <th className="py-4 px-5">Assigned Role</th>
                  <th className="py-4 px-5">Physical Address</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-xs text-slate-600">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/40 transition-colors duration-150 group">
                    {/* Name / Avatar */}
                    <td className="py-3.5 px-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-rose-50 group-hover:text-brand-red flex items-center justify-center font-bold text-sm text-slate-600 transition-colors duration-200 border border-slate-200/30">
                        {(user.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{user.name || 'Unnamed User'}</span>
                        <span className="text-[9px] text-slate-400 font-bold font-mono">ID: {user.id.slice(0, 8)}...</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {user.email || 'No email provided'}
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[9px] tracking-wider uppercase inline-flex items-center gap-1.5 ${
                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        user.role === 'distributor' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        user.role === 'reseller' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200/50'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        {user.role || 'Owner'}
                      </span>
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-5 max-w-xs truncate text-slate-500">
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{user.address || 'Address not shared'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenUpdate(user)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 text-slate-500 transition-all duration-200"
                          title="Edit User"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(user)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-brand-red border border-slate-100 text-slate-500 transition-all duration-200"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center gap-2.5 text-slate-400">
            <Users className="w-10 h-10 stroke-1" />
            <span className="text-xs font-bold tracking-wider uppercase">No matching users found</span>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-5 relative animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-md font-extrabold text-slate-900 tracking-wide uppercase">Create New User</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Add a new account to the enterprise database</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 font-semibold text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-xs text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-red/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-xs text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-red/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-xs text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-red/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Account Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-xs text-slate-855 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-red/5 font-bold uppercase"
                  >
                    <option value="owner">Owner</option>
                    <option value="reseller">Reseller</option>
                    <option value="distributor">Distributor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City"
                    className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-xs text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-red/5"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-11 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark disabled:opacity-50 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Creation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE USER MODAL */}
      {showUpdateModal && activeUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-5 relative animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-md font-extrabold text-slate-900 tracking-wide uppercase">Update User Account</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Modify existing account details and permissions</p>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 font-semibold text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-xs text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-red/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-xs text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-red/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Account Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-xs text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-red/5 font-bold uppercase"
                  >
                    <option value="owner">Owner</option>
                    <option value="reseller">Reseller</option>
                    <option value="distributor">Distributor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City"
                    className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-xs text-slate-800 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-red/5"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-11 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark disabled:opacity-50 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && activeUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-100 text-center space-y-5 relative animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 text-brand-red rounded-xl flex items-center justify-center mx-auto border border-rose-100/60 shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-md font-extrabold text-slate-900 tracking-wide uppercase">Confirm Deletion</h2>
              <p className="text-xs text-slate-500 font-semibold mt-2 leading-relaxed">
                Are you absolutely sure you want to delete <span className="font-bold text-slate-800">{activeUser.name || activeUser.email}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="flex-1 h-11 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark disabled:opacity-50 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

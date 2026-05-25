import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, Search, ShieldCheck, Clock, CheckCircle2, AlertCircle, MessageCircle, Send, X, Loader2, User } from 'lucide-react';
import { fetchEnquiries, updateEnquiryStatus, addEnquiryMessage, clearSuccess } from '../redux/adminSlice';

const EnquiriesManagement = () => {
  const dispatch = useDispatch();
  const { enquiries, adminUser, loading, actionLoading, successMessage } = useSelector((state) => state.admin);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State
  const [activeEnquiry, setActiveEnquiry] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (adminUser?.id) {
      dispatch(fetchEnquiries(adminUser.id));
    }
  }, [dispatch, adminUser]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const handleOpenDetails = (enquiry) => {
    setActiveEnquiry(enquiry);
    setNewMessage('');
  };

  const handleStatusChange = (newStatus) => {
    if (!activeEnquiry) return;
    dispatch(updateEnquiryStatus({
      id: activeEnquiry.id,
      status: newStatus,
      responderName: adminUser?.name || 'Administrator'
    })).then((res) => {
      if (!res.error) {
        setActiveEnquiry((prev) => ({
          ...prev,
          status: newStatus,
          messages: res.payload.vehicle?.messages || res.payload.messages
        }));
      }
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeEnquiry) return;
    dispatch(addEnquiryMessage({
      id: activeEnquiry.id,
      text: newMessage.trim(),
      senderName: adminUser?.name || 'Administrator'
    })).then((res) => {
      if (!res.error) {
        setNewMessage('');
        setActiveEnquiry((prev) => ({
          ...prev,
          messages: res.payload.vehicle?.messages || res.payload.messages
        }));
      }
    });
  };

  const filteredEnquiries = enquiries.filter((eq) => {
    const matchesSearch = (eq.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (eq.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (eq.userName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || (eq.status || 'Pending').toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const statuses = ['ALL', 'PENDING', 'IN PROGRESS', 'RESOLVED', 'CLOSED'];

  const getStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'resolved') return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3.5 py-1.5 rounded-xl font-bold text-[10px] tracking-wider uppercase inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</span>;
    if (s === 'in progress') return <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3.5 py-1.5 rounded-xl font-bold text-[10px] tracking-wider uppercase inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 animate-spin" /> In Progress</span>;
    if (s === 'closed') return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3.5 py-1.5 rounded-xl font-bold text-[10px] tracking-wider uppercase inline-flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Closed</span>;
    return <span className="bg-amber-50 text-amber-700 border border-amber-100 px-3.5 py-1.5 rounded-xl font-bold text-[10px] tracking-wider uppercase inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending</span>;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-slate-200/80 shadow-premium">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-brand-red-light text-brand-red rounded-2xl flex items-center justify-center shadow-inner border border-brand-red/10">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-wide font-display">ENQUIRIES MANAGEMENT</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
              Review technical enquiries, verify part images, and manage customer communications
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <span className="text-sm font-semibold tracking-wide">{successMessage}</span>
          <button onClick={() => dispatch(clearSuccess())} className="text-emerald-500 hover:text-emerald-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-premium">
        {/* Search */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-3.5 rounded-2xl w-full md:w-96 border border-slate-200 focus-within:border-brand-red focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-red/10 transition-all duration-200 shadow-sm">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search enquiries by title or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold text-slate-800 w-full placeholder:text-slate-400"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 ${
                selectedStatus === status
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-950/20'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80 hover:text-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries Grid */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-premium">
          <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
          <span className="text-xs font-bold text-slate-400 tracking-wider">LOADING ENQUIRIES DATABASE...</span>
        </div>
      ) : filteredEnquiries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnquiries.map((eq) => (
            <div key={eq.id} className="bg-white rounded-3xl border border-slate-200/60 shadow-premium p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 hover:border-slate-300/80 transition-all duration-300 group">
              <div className="space-y-4">
                {/* Header / Status */}
                <div className="flex items-center justify-between gap-4">
                  {getStatusBadge(eq.status)}
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {new Date(eq.enquiryDate || eq.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Title & Desc */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-red transition-colors duration-200 line-clamp-1 font-display">{eq.title}</h3>
                  <p className="text-xs font-medium text-slate-500 line-clamp-2 mt-1.5">{eq.description}</p>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 text-slate-600">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-500">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-800 block truncate">{eq.userName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold truncate block">{eq.userEmail || 'Customer'}</span>
                  </div>
                </div>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => handleOpenDetails(eq)}
                className="w-full mt-6 h-11 bg-slate-50 border border-slate-200 hover:bg-brand-red hover:border-brand-red hover:text-white text-slate-700 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-brand-red/10"
              >
                <MessageCircle className="w-4 h-4" />
                Manage Enquiry
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-premium text-slate-400">
          <FileText className="w-12 h-12 stroke-1 text-slate-300" />
          <span className="text-xs font-bold tracking-wider uppercase">No matching enquiries found</span>
        </div>
      )}

      {/* ENQUIRY DETAILS MODAL */}
      {activeEnquiry && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-5xl h-[85vh] md:h-[90vh] rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden relative animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-950 to-slate-900 text-white p-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-brand-red-hover rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                  EQ
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-wide font-display">{activeEnquiry.title}</h2>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Submitted by {activeEnquiry.userName} ({activeEnquiry.userEmail})</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {getStatusBadge(activeEnquiry.status)}
                <button onClick={() => setActiveEnquiry(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors duration-150">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - 2 Columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left Column: Details & Image */}
              <div className="lg:col-span-5 border-r border-slate-100 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Enquiry Specifications</h3>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-sm">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehicle / Part Description</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{activeEnquiry.description}</p>
                    </div>
                    {activeEnquiry.enquiryDetails && (
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer Notes</span>
                        <p className="text-sm font-semibold text-slate-700 mt-0.5">{activeEnquiry.enquiryDetails}</p>
                      </div>
                    )}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Requested Quantity</span>
                      <span className="text-sm font-bold text-brand-red">{activeEnquiry.quantity || 1} Units</span>
                    </div>
                  </div>
                </div>

                {/* Uploaded Image */}
                {activeEnquiry.imageurl && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Uploaded Reference Photo</h3>
                    <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden group hover:border-slate-300 transition-colors duration-200">
                      <img
                        source={{ uri: activeEnquiry.imageurl }}
                        src={activeEnquiry.imageurl}
                        alt="Reference Part"
                        className="w-full h-64 object-contain rounded-xl bg-slate-50"
                      />
                    </div>
                  </div>
                )}

                {/* Status Update Actions */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Update Enquiry Status</h3>
                  <div className="grid grid-cols-3 gap-3 font-bold text-[10px] uppercase tracking-wider">
                    <button
                      onClick={() => handleStatusChange('In Progress')}
                      disabled={actionLoading || activeEnquiry.status?.toLowerCase() === 'in progress'}
                      className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200/60 disabled:opacity-50 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" /> IN PROGRESS
                    </button>
                    <button
                      onClick={() => handleStatusChange('Resolved')}
                      disabled={actionLoading || activeEnquiry.status?.toLowerCase() === 'resolved'}
                      className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-200/60 disabled:opacity-50 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> RESOLVE
                    </button>
                    <button
                      onClick={() => handleStatusChange('Closed')}
                      disabled={actionLoading || activeEnquiry.status?.toLowerCase() === 'closed'}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 border border-slate-200/60 disabled:opacity-50 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> CLOSE
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Chat History & Input */}
              <div className="lg:col-span-7 flex flex-col h-full bg-white overflow-hidden">
                {/* Chat Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20">
                  {(activeEnquiry.messages || []).map((msg, index) => {
                    const isAdmin = msg.sender === 'admin' || msg.sender === 'distributor' || msg.sender === 'reseller';
                    const isSystem = msg.isSystem;

                    if (isSystem) {
                      return (
                        <div key={index} className="flex justify-center my-4">
                          <div className="bg-slate-100 border border-slate-200/80 px-4 py-2 rounded-2xl text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-red" />
                            {msg.text} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={index} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} animate-fade-in`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-extrabold text-slate-800 tracking-wide">{msg.senderName || (isAdmin ? 'Administrator' : 'Customer')}</span>
                          <span className="text-[9px] font-semibold text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-2xl font-medium text-sm shadow-sm ${
                          isAdmin
                            ? 'bg-gradient-to-br from-brand-red to-brand-red-hover text-white rounded-tr-none shadow-brand-red/10'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/60'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type an official response to the customer..."
                    className="flex-1 h-12 bg-white border border-slate-200 rounded-2xl px-5 text-slate-800 font-semibold text-sm focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 focus:outline-none shadow-sm transition-all duration-200 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !newMessage.trim()}
                    className="h-12 px-6 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark disabled:opacity-50 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-lg shadow-brand-red/20 transition-all duration-200 flex items-center justify-center gap-2 flex-shrink-0 hover:scale-[1.01]"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send</>}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiriesManagement;

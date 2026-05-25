import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, Search, ShieldCheck, Clock, CheckCircle2, AlertCircle, MessageCircle, Send, X, Loader2, Package, User } from 'lucide-react';
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
    if (s === 'resolved') return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-black text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</span>;
    if (s === 'in progress') return <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-1.5 rounded-xl font-black text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 animate-spin" /> In Progress</span>;
    if (s === 'closed') return <span className="bg-gray-100 text-gray-600 border border-gray-200 px-3.5 py-1.5 rounded-xl font-black text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Closed</span>;
    return <span className="bg-amber-100 text-amber-700 border border-amber-200 px-3.5 py-1.5 rounded-xl font-black text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending</span>;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-red-50 text-[#C6122E] rounded-2xl flex items-center justify-center shadow-inner border border-red-100">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-wide">ENQUIRIES MANAGEMENT</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
              Review technical enquiries, verify part images, and manage customer communications
            </p>
          </div>
        </div>
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
            placeholder="Search enquiries by title or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold text-gray-800 w-full placeholder:text-gray-400"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-6 py-3 rounded-2xl font-black text-xs tracking-wider transition-all duration-200 ${
                selectedStatus === status
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/30'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries Grid */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-gray-200 shadow-sm">
          <Loader2 className="w-10 h-10 text-[#C6122E] animate-spin" />
          <span className="text-sm font-bold text-gray-400 tracking-wider">LOADING ENQUIRIES DATABASE...</span>
        </div>
      ) : filteredEnquiries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnquiries.map((eq) => (
            <div key={eq.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group">
              <div className="space-y-4">
                {/* Header / Status */}
                <div className="flex items-center justify-between gap-4">
                  {getStatusBadge(eq.status)}
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {new Date(eq.enquiryDate || eq.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Title & Desc */}
                <div>
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-[#C6122E] transition-colors duration-200 line-clamp-1">{eq.title}</h3>
                  <p className="text-xs font-semibold text-gray-500 line-clamp-2 mt-1">{eq.description}</p>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 text-gray-600">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-gray-900 block truncate">{eq.userName}</span>
                    <span className="text-[11px] text-gray-400 font-semibold truncate block">{eq.userEmail || 'Customer'}</span>
                  </div>
                </div>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => handleOpenDetails(eq)}
                className="w-full mt-6 h-12 bg-gray-100 hover:bg-[#C6122E] hover:text-white text-gray-700 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                MANAGE ENQUIRY
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-gray-200 shadow-sm text-gray-400">
          <FileText className="w-12 h-12 stroke-1" />
          <span className="text-sm font-bold tracking-wider uppercase">No matching enquiries found</span>
        </div>
      )}

      {/* ENQUIRY DETAILS MODAL */}
      {activeEnquiry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden relative animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-gray-900 text-white p-6 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#C6122E] rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                  EQ
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">{activeEnquiry.title}</h2>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">Submitted by {activeEnquiry.userName} ({activeEnquiry.userEmail})</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {getStatusBadge(activeEnquiry.status)}
                <button onClick={() => setActiveEnquiry(null)} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - 2 Columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left Column: Details & Image */}
              <div className="lg:col-span-5 border-r border-gray-100 p-6 overflow-y-auto space-y-6 bg-gray-50/50">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Enquiry Specifications</h3>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-3 shadow-sm">
                    <div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase block">Vehicle / Part Description</span>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{activeEnquiry.description}</p>
                    </div>
                    {activeEnquiry.enquiryDetails && (
                      <div className="pt-3 border-t border-gray-100">
                        <span className="text-[11px] font-bold text-gray-400 uppercase block">Customer Notes</span>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{activeEnquiry.enquiryDetails}</p>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-400 uppercase">Requested Quantity</span>
                      <span className="text-sm font-black text-[#C6122E]">{activeEnquiry.quantity || 1} Units</span>
                    </div>
                  </div>
                </div>

                {/* Uploaded Image */}
                {activeEnquiry.imageurl && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Uploaded Reference Photo</h3>
                    <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden group">
                      <img
                        source={{ uri: activeEnquiry.imageurl }}
                        src={activeEnquiry.imageurl}
                        alt="Reference Part"
                        className="w-full h-64 object-contain rounded-xl bg-gray-100"
                      />
                    </div>
                  </div>
                )}

                {/* Status Update Actions */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Update Enquiry Status</h3>
                  <div className="grid grid-cols-3 gap-3 font-bold text-xs uppercase tracking-wider">
                    <button
                      onClick={() => handleStatusChange('In Progress')}
                      disabled={actionLoading || activeEnquiry.status?.toLowerCase() === 'in progress'}
                      className="py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200 disabled:opacity-50 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" /> IN PROGRESS
                    </button>
                    <button
                      onClick={() => handleStatusChange('Resolved')}
                      disabled={actionLoading || activeEnquiry.status?.toLowerCase() === 'resolved'}
                      className="py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-200 disabled:opacity-50 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> RESOLVE
                    </button>
                    <button
                      onClick={() => handleStatusChange('Closed')}
                      disabled={actionLoading || activeEnquiry.status?.toLowerCase() === 'closed'}
                      className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-800 hover:text-white text-gray-700 border border-gray-200 disabled:opacity-50 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> CLOSE
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Chat History & Input */}
              <div className="lg:col-span-7 flex flex-col h-full bg-white overflow-hidden">
                {/* Chat Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {(activeEnquiry.messages || []).map((msg, index) => {
                    const isAdmin = msg.sender === 'admin' || msg.sender === 'distributor' || msg.sender === 'reseller';
                    const isSystem = msg.isSystem;

                    if (isSystem) {
                      return (
                        <div key={index} className="flex justify-center my-4">
                          <div className="bg-gray-100 border border-gray-200/80 px-4 py-2 rounded-2xl text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#C6122E]" />
                            {msg.text} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={index} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[11px] font-extrabold text-gray-900 tracking-wide">{msg.senderName || (isAdmin ? 'Administrator' : 'Customer')}</span>
                          <span className="text-[10px] font-semibold text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-2xl font-semibold text-sm shadow-sm ${
                          isAdmin
                            ? 'bg-[#C6122E] text-white rounded-tr-none shadow-red-900/20'
                            : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200/80'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type an official response to the customer..."
                    className="flex-1 h-14 bg-white border border-gray-200 rounded-2xl px-5 text-gray-800 font-semibold text-sm focus:border-[#C6122E] focus:outline-none shadow-sm transition-all duration-200 placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !newMessage.trim()}
                    className="h-14 px-8 bg-[#C6122E] hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-red-900/30 transition-all duration-200 flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> SEND</>}
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

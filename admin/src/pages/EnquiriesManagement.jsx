import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FileText,
  Search,
  MessageSquare,
  Send,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  User,
  ShieldCheck,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  fetchEnquiries,
  updateEnquiryStatus,
  addEnquiryMessage,
  clearSuccess,
} from '../redux/adminSlice';
import { StatusBadge } from '../components/common/Badge';
import { FilterBar } from '../components/common/FilterBar';
import { DataTable } from '../components/common/DataTable';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const EnquiriesManagement = () => {
  const dispatch = useDispatch();
  const { enquiries, adminUser, loading, actionLoading, successMessage } = useSelector(
    (state) => state.admin
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Slide-Over Drawer State
  const [activeEnquiry, setActiveEnquiry] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showImageLightbox, setShowImageLightbox] = useState(false);

  useEffect(() => {
    if (adminUser?.id) {
      dispatch(fetchEnquiries(adminUser.id));
    }
  }, [dispatch, adminUser]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Keep activeEnquiry synced with Redux store updates
  useEffect(() => {
    if (activeEnquiry && enquiries) {
      const updated = enquiries.find((e) => String(e.id) === String(activeEnquiry.id));
      if (updated) {
        setActiveEnquiry(updated);
      }
    }
  }, [enquiries]);

  // Metric KPI calculation
  const metrics = useMemo(() => {
    const list = enquiries || [];
    return {
      total: list.length,
      pending: list.filter((e) => (e.status || '').toLowerCase() === 'pending').length,
      inProgress: list.filter((e) => (e.status || '').toLowerCase() === 'in progress' || (e.status || '').toLowerCase() === 'inprogress').length,
      resolved: list.filter((e) => (e.status || '').toLowerCase() === 'resolved').length,
      closed: list.filter((e) => (e.status || '').toLowerCase() === 'closed').length,
    };
  }, [enquiries]);

  const facets = [
    { id: 'ALL', label: 'All Enquiries', count: metrics.total },
    { id: 'PENDING', label: 'Pending', count: metrics.pending },
    { id: 'IN PROGRESS', label: 'In Progress', count: metrics.inProgress },
    { id: 'RESOLVED', label: 'Resolved', count: metrics.resolved },
    { id: 'CLOSED', label: 'Closed', count: metrics.closed },
  ];

  // Filtered & Sorted Enquiries
  const filteredEnquiries = useMemo(() => {
    let result = (enquiries || []).filter((eq) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (eq.title && eq.title.toLowerCase().includes(q)) ||
        (eq.description && eq.description.toLowerCase().includes(q)) ||
        (eq.userName && eq.userName.toLowerCase().includes(q)) ||
        (eq.userEmail && eq.userEmail.toLowerCase().includes(q));

      const statusVal = (eq.status || 'pending').toLowerCase();
      const matchesStatus =
        selectedStatus === 'ALL' ||
        statusVal === selectedStatus.toLowerCase() ||
        (selectedStatus === 'IN PROGRESS' && (statusVal === 'in progress' || statusVal === 'inprogress'));

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || b.enquiryDate || 0) - new Date(a.created_at || a.enquiryDate || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || a.enquiryDate || 0) - new Date(b.created_at || b.enquiryDate || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return result;
  }, [enquiries, searchQuery, selectedStatus, sortBy]);

  // Handlers
  const handleOpenDrawer = (enquiry) => {
    setActiveEnquiry(enquiry);
    setNewMessage('');
  };

  const handleStatusChange = (newStatus) => {
    if (!activeEnquiry) return;
    dispatch(
      updateEnquiryStatus({
        id: activeEnquiry.id,
        status: newStatus,
        responderName: adminUser?.name || 'Administrator',
      })
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeEnquiry) return;
    dispatch(
      addEnquiryMessage({
        id: activeEnquiry.id,
        text: newMessage.trim(),
        senderName: adminUser?.name || 'Administrator',
      })
    ).then((res) => {
      if (!res.error) setNewMessage('');
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatMessageTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Table Columns
  const columns = [
    {
      key: 'ticket',
      label: 'Ticket / Part Reference',
      width: '32%',
      render: (row) => {
        const hasImage = !!(row.imageurl || row.vehicle?.imageurl);
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-brand-red flex items-center justify-center font-bold flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs text-slate-900 truncate leading-tight flex items-center gap-1.5">
                <span>{row.title || 'Technical Enquiry'}</span>
                {hasImage && (
                  <span className="px-1.5 py-0.2 rounded-xs bg-amber-50 text-amber-700 text-[9px] font-extrabold border border-amber-200 flex items-center gap-0.5">
                    <ImageIcon className="w-2.5 h-2.5" /> Photo
                  </span>
                )}
              </div>
              <div className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                {row.description || 'Verification required'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'customer',
      label: 'Submitted By',
      width: '22%',
      render: (row) => (
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-800 truncate">{row.userName || 'Customer'}</div>
          <div className="text-[11px] text-slate-400 truncate">{row.userEmail || 'No email recorded'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '14%',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'messages',
      label: 'Thread',
      width: '12%',
      render: (row) => {
        const count = (row.messages || row.vehicle?.messages || []).length;
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
            <MessageSquare className="w-3 h-3 text-slate-400" />
            {count} message{count !== 1 ? 's' : ''}
          </span>
        );
      },
    },
    {
      key: 'date',
      label: 'Date',
      width: '12%',
      render: (row) => (
        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
          {formatDate(row.created_at || row.enquiryDate)}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      align: 'right',
      width: '8%',
      render: (row) => (
        <button
          onClick={() => handleOpenDrawer(row)}
          className="h-7 px-2.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-md font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  const activeMessages = useMemo(() => {
    if (!activeEnquiry) return [];
    return activeEnquiry.messages || activeEnquiry.vehicle?.messages || [];
  }, [activeEnquiry]);

  const activeImageUrl = activeEnquiry?.imageurl || activeEnquiry?.vehicle?.imageurl || null;

  // Export Handlers
  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Title', 'Customer Name', 'Customer Email', 'Status', 'Messages', 'Date'];
    const rows = filteredEnquiries.map((eq) => [
      `#${eq.id}`,
      eq.title || 'Technical Enquiry',
      eq.userName || '',
      eq.userEmail || '',
      (eq.status || 'Pending').toUpperCase(),
      (eq.messages || eq.vehicle?.messages || []).length,
      formatDate(eq.created_at || eq.enquiryDate),
    ]);
    exportToCSV(`ngk_enquiries_export_${Date.now()}.csv`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Ticket ID', 'Title', 'Customer Name', 'Customer Email', 'Status', 'Messages', 'Date'];
    const rows = filteredEnquiries.map((eq) => [
      `#${eq.id}`,
      eq.title || 'Technical Enquiry',
      eq.userName || '',
      eq.userEmail || '',
      (eq.status || 'Pending').toUpperCase(),
      String((eq.messages || eq.vehicle?.messages || []).length),
      formatDate(eq.created_at || eq.enquiryDate),
    ]);
    exportToPDF(`ngk_enquiries_export_${Date.now()}.pdf`, 'NGK Technical Enquiries Report', headers, rows);
  };

  return (
    <div className="p-5 max-w-[1600px] mx-auto space-y-4 font-sans select-none">
      {/* Header Strip & KPIs */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-brand-red flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Technical Enquiries
            </h1>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5 ml-9">
            Process customer technical verification tickets, evaluate part images, and coordinate with resellers.
          </p>
        </div>

        {/* KPI Strip */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-xs font-black text-slate-900">{metrics.total}</span>
          </div>
          <div className="px-3 py-1.5 bg-rose-50/70 border border-rose-200/80 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Pending</span>
            <span className="text-xs font-black text-rose-900">{metrics.pending}</span>
          </div>
          <div className="px-3 py-1.5 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">In Progress</span>
            <span className="text-xs font-black text-blue-900">{metrics.inProgress}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Resolved</span>
            <span className="text-xs font-black text-emerald-900">{metrics.resolved}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter by title, part description, customer name, email..."
        facets={facets}
        activeFacet={selectedStatus}
        onFacetSelect={setSelectedStatus}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalResults={filteredEnquiries.length}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onClearAll={() => {
          setSearchQuery('');
          setSelectedStatus('ALL');
          setSortBy('newest');
        }}
      />

      {/* High Density Table */}
      <DataTable
        columns={columns}
        data={filteredEnquiries}
        loading={loading}
        emptyMessage="No technical enquiries match the selected criteria."
        initialPageSize={25}
      />

      {/* Slide-Over Conversation & Verification Drawer */}
      {activeEnquiry && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setActiveEnquiry(null)}
          ></div>

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-10 animate-slide-in-right border-l border-slate-200">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Ticket #{activeEnquiry.id}
                  </span>
                  <StatusBadge status={activeEnquiry.status} />
                </div>
                <h2 className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
                  {activeEnquiry.title || 'Technical Enquiry'}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Status Switcher Dropdown */}
                <select
                  value={
                    (activeEnquiry.status || 'Pending').toLowerCase().replace(/[\s_-]+/g, '') === 'inprogress'
                      ? 'InProgress'
                      : activeEnquiry.status || 'Pending'
                  }
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={actionLoading}
                  className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-red cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>

                <button
                  onClick={() => setActiveEnquiry(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Customer & Vehicle Context Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-2.5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Customer
                    </span>
                    <span className="font-extrabold text-slate-900 block mt-0.5">
                      {activeEnquiry.userName || 'Customer'}
                    </span>
                    <span className="text-[11px] text-slate-500">{activeEnquiry.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assigned Reseller
                    </span>
                    <span className="font-extrabold text-slate-900 block mt-0.5">
                      {activeEnquiry.dealerName || 'Direct to NGK'}
                    </span>
                  </div>
                </div>

                {activeEnquiry.description && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Details / Requirements
                    </span>
                    <p className="text-xs font-medium text-slate-700 mt-1 leading-relaxed">
                      {activeEnquiry.description}
                    </p>
                  </div>
                )}

                {/* Uploaded Photo Attachment */}
                {activeImageUrl && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Attached Part Photo
                    </span>
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white max-w-xs">
                      <img
                        src={activeImageUrl}
                        alt="Enquiry attachment"
                        className="w-full h-36 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                        onClick={() => setShowImageLightbox(true)}
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                        <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded-md flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Zoom
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Discussion Thread */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Live Discussion Thread
                </span>

                <div className="space-y-3">
                  {activeMessages.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                      No messages yet. Send a response below.
                    </div>
                  ) : (
                    activeMessages.map((msg, mIdx) => {
                      const isSystem = msg.isSystem || msg.is_system;
                      const isAdmin = (msg.sender || msg.sender_role || '').toLowerCase() === 'admin';
                      const isOwner = (msg.sender || msg.sender_role || '').toLowerCase() === 'owner';

                      if (isSystem) {
                        return (
                          <div key={mIdx} className="text-center my-2">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              {msg.text || msg.message_text} • {formatMessageTime(msg.timestamp || msg.created_at)}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={mIdx}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[10px] font-extrabold text-slate-700">
                              {msg.senderName || msg.sender_name || (isAdmin ? 'NGK Tech Support' : 'Customer')}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {formatMessageTime(msg.timestamp || msg.created_at)}
                            </span>
                          </div>
                          <div
                            className={`p-3 rounded-xl max-w-sm text-xs font-medium leading-relaxed ${
                              isAdmin
                                ? 'bg-slate-900 text-white rounded-tr-xs'
                                : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/80'
                            }`}
                          >
                            {msg.text || msg.message_text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Message Reply Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type an official technical response..."
                  className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-red"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || actionLoading}
                  className="h-9 px-3.5 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {showImageLightbox && activeImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowImageLightbox(false)}
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img src={activeImageUrl} alt="Attachment full view" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
            <button
              onClick={() => setShowImageLightbox(false)}
              className="absolute -top-3 -right-3 p-1.5 bg-white text-slate-800 rounded-full shadow-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiriesManagement;

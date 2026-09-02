import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Search, ShieldCheck, X, CheckCheck, BellOff, Clock, UserCheck } from 'lucide-react';
import { getMyself, markNotificationsAsRead } from '../redux/adminSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const { adminUser } = useSelector((state) => state.admin);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    if (!adminUser) {
      dispatch(getMyself());
    }
  }, [dispatch, adminUser]);

  const unreadNotifications = useMemo(() => {
    if (adminUser?.notifications) {
      return adminUser.notifications.filter((notification) => notification.isRead === false);
    }
    return [];
  }, [adminUser]);

  const allNotifications = useMemo(() => {
    if (!adminUser?.notifications) return [];
    return [...adminUser.notifications].reverse();
  }, [adminUser]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  const handleMarkAllRead = () => {
    if (adminUser?.id) {
      dispatch(markNotificationsAsRead(adminUser.id));
    }
  };

  return (
    <header className="h-14 bg-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs border-b border-slate-200/80 select-none">
      {/* Search Input */}
      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg w-80 border border-slate-200 focus-within:border-brand-red focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-red/10 transition-all">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Quick search across catalog, users, tickets..."
          className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 w-full placeholder:text-slate-400"
        />
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          onClick={() => setShowNotificationModal(true)}
          className="relative p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-brand-red transition-colors border border-slate-200 cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadNotifications.length}
            </span>
          )}
        </button>

        <div className="h-4 w-[1px] bg-slate-200"></div>

        {/* User Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-extrabold shadow-2xs">
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-slate-800 leading-tight">
              {adminUser?.name || 'System Admin'}
            </span>
            <span className="text-[9px] font-extrabold text-brand-red uppercase tracking-wider">
              {adminUser?.role || 'Administrator'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications Slide-Over Panel */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setShowNotificationModal(false)}
          ></div>

          {/* Drawer */}
          <div className="relative w-full max-w-sm bg-white shadow-2xl h-full flex flex-col z-10 animate-slide-in-right border-l border-slate-200">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 rounded-lg text-brand-red">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-slate-900">Notifications</h2>
                  <p className="text-[10px] font-bold text-slate-400">
                    {unreadNotifications.length} unread
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-brand-red bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {allNotifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <BellOff className="w-8 h-8 text-slate-300 mb-2" />
                  <h3 className="text-xs font-bold text-slate-700">No Notifications</h3>
                  <p className="text-[11px] text-slate-400 mt-1">You are all caught up!</p>
                </div>
              ) : (
                allNotifications.map((notif, idx) => (
                  <div
                    key={idx}
                    className={`p-3 flex gap-2.5 hover:bg-slate-50 transition-colors ${
                      !notif.isRead ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <div className="mt-1">
                      {!notif.isRead ? (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
                        </span>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs text-slate-700 leading-snug ${
                          !notif.isRead ? 'font-bold text-slate-900' : 'font-medium'
                        }`}
                      >
                        {notif.message}
                      </p>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">
                        {formatTimestamp(notif.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

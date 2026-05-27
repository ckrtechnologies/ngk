import { useSelector, useDispatch } from 'react-redux';
import { Bell, Search, ShieldCheck, X, CheckCheck, BellOff, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getMyself, markNotificationsAsRead } from '../redux/adminSlice';
import { useEffect } from 'react';

const Navbar = () => {
  const dispatch = useDispatch();
  const { adminUser } = useSelector((state) => state.admin);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(()=>{
    if(!adminUser){
      dispatch(getMyself())
    }
  }, [dispatch])

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
    } catch (e) {
      return 'Recent';
    }
  };

  const handleMarkAllRead = () => {
    if (adminUser?.id) {
      dispatch(markNotificationsAsRead(adminUser.id));
    }
  };

  console.log(allNotifications, adminUser)


  return (
    <header className="h-20 glassmorphism px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-slate-200/50">
      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-100/60 px-4 py-2.5 rounded-2xl w-96 border border-slate-200/60 focus-within:border-brand-red focus-within:bg-white focus-within:shadow-premium focus-within:ring-4 focus-within:ring-brand-red/5 transition-all duration-200">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search global records, users, enquiries..."
          className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 w-full placeholder:text-slate-400"
        />
      </div>

      {/* Right User Profile & Badges */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setShowNotificationModal(true)}
          className="relative p-2.5 rounded-2xl bg-slate-100/80 hover:bg-rose-50 hover:text-brand-red text-slate-600 transition-all duration-200 border border-transparent hover:border-rose-100/50"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full ring-2 ring-white animate-pulse"></span>}
        </button>

        <div className="h-6 w-[1px] bg-slate-200/80"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-extrabold text-slate-900 leading-none">{adminUser?.name || 'Super Admin'}</span>
            <span className="text-[10px] font-bold text-brand-red uppercase tracking-wider mt-1">{adminUser?.role || 'Administrator'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 flex items-center justify-center text-white shadow-lg shadow-brand-red/20 ring-2 ring-rose-50">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Notifications Slide-Over Panel */}
      {showNotificationModal && (
        <div className="fixed top-0 right-0 z-50 overflow-hidden w-[100vw] h-[100vh]">
          {/* Backdrop blur with fade animation */}
          <div
            className="absolute bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowNotificationModal(false)}
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            {/* Panel with slide-in animation */}
            <div className="w-screen max-w-md transform transition-all duration-300 ease-out animate-scale-up">
              <div className="h-full flex flex-col bg-white shadow-2xl border-l border-slate-200/60">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-50 rounded-xl text-brand-red">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Notifications</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {unreadNotifications.length} unread message{unreadNotifications.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-red hover:text-brand-red-hover bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-all duration-200"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Read all</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotificationModal(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {allNotifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4 ring-8 ring-slate-50/30">
                        <BellOff className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-800">All caught up!</h3>
                      <p className="text-xs text-slate-400 font-semibold max-w-xs mt-1.5 leading-relaxed">
                        No new notifications at the moment. We'll let you know when things happen.
                      </p>
                    </div>
                  ) : (
                    allNotifications.map((notification, index) => (
                      <div
                        key={index}
                        className={`p-5 flex gap-4 transition-all duration-200 hover:bg-slate-50/70 relative group ${
                          !notification.isRead ? 'bg-rose-50/10' : ''
                        }`}
                      >
                        {/* Status Indicator */}
                        <div className="flex-shrink-0 mt-1">
                          {!notification.isRead ? (
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-red"></span>
                            </span>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold text-slate-700 leading-relaxed ${
                            !notification.isRead ? 'font-bold text-slate-900' : ''
                          }`}>
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-1.5 mt-2.5 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

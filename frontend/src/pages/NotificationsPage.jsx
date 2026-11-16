import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  FileText,
  RefreshCw,
  ShieldCheck,
  CheckCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      // quiet fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read.');
      }
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'PASS':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'APPLICATION':
        return <FileText className="w-5 h-5 text-brand-600" />;
      case 'RENEWAL':
        return <RefreshCw className="w-5 h-5 text-purple-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.isRead;
    return n.type === filter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System alerts regarding applications, pass validity warnings, and payments.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs self-start sm:self-auto transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'UNREAD', 'APPLICATION', 'PASS', 'RENEWAL', 'PAYMENT'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === t
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs font-medium">No notifications matching the selected filter.</span>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                item.isRead
                  ? 'bg-white border-slate-100 shadow-2xs'
                  : 'bg-brand-50/40 border-brand-200 shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                {getNotificationIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.message}
                </p>

                <div className="mt-3 flex items-center gap-3 text-xs">
                  {item.link && (
                    <Link
                      to={item.link}
                      onClick={() => handleMarkAsRead(item._id)}
                      className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(item._id)}
                      className="text-slate-400 hover:text-slate-600 text-[11px] font-semibold"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

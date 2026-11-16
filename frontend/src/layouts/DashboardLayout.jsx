import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Bus,
  MapPin,
  FileText,
  CreditCard,
  BarChart3,
  Users,
  ShieldCheck,
  QrCode,
  Bell,
  LogOut,
  Menu,
  X,
  Compass,
  RefreshCw,
  UserCheck,
  User,
  Settings,
  ChevronDown
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, profile, logout, isAdmin, isManager, isStudent, isDriver } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userDropdown, setUserDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchNotificationsCount = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (e) {
        // quiet ignore
      }
    };

    fetchNotificationsCount();
    const interval = setInterval(fetchNotificationsCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build role-tailored navigation items
  const navItems = [];

  if (isAdmin || isManager) {
    navItems.push(
      { label: 'Dashboard Overview', path: '/', icon: BarChart3 },
      { label: 'Route Management', path: '/routes', icon: MapPin },
      { label: 'Bus & Fleet Management', path: '/buses', icon: Bus },
      { label: 'Pass Applications', path: '/approvals', icon: FileText },
      { label: 'Issued Bus Passes', path: '/passes', icon: ShieldCheck },
      { label: 'Pass Renewals', path: '/renewals', icon: RefreshCw },
      { label: 'Fee Collection', path: '/fees', icon: CreditCard },
      { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      { label: 'Student Directory', path: '/students', icon: Users },
      { label: 'Live Trip Monitoring', path: '/trips', icon: Compass }
    );
  } else if (isStudent) {
    navItems.push(
      { label: 'Student Dashboard', path: '/', icon: BarChart3 },
      { label: 'My Official Bus Pass', path: '/pass', icon: ShieldCheck },
      { label: 'Apply for New Pass', path: '/apply', icon: FileText },
      { label: 'Renew Bus Pass', path: '/renewal', icon: RefreshCw },
      { label: 'Fee & Payment Ledger', path: '/fees', icon: CreditCard },
      { label: 'Bus Routes & Schedules', path: '/routes', icon: MapPin },
      { label: 'Notification Center', path: '/notifications', icon: Bell }
    );
  } else if (isDriver) {
    navItems.push(
      { label: 'Driver Operations', path: '/', icon: Bus },
      { label: 'QR Pass Validation', path: '/qr-scan', icon: QrCode },
      { label: 'Route Itinerary & Stops', path: '/routes', icon: MapPin },
      { label: 'Student Passenger List', path: '/roster', icon: UserCheck }
    );
  }

  // Common links
  const secondaryNavItems = [
    { label: 'My Profile & Security', path: '/profile', icon: User }
  ];

  const getRoleBadge = () => {
    if (isAdmin) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">ADMIN</span>;
    if (isManager) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">TRANSPORT MGR</span>;
    if (isDriver) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">BUS DRIVER</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">STUDENT</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Fixed Left Sidebar (Navy Blue) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-navy-900 text-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-navy-800 shadow-2xl`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight leading-none">TRANSIT PASS</div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">Route & Pass Portal</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card inside Sidebar */}
        <div className="px-5 py-4 border-b border-navy-800/60 bg-navy-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center font-bold text-brand-300 text-sm">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            {getRoleBadge()}
            {profile?.enrolmentNo && (
              <span className="text-[11px] font-mono font-medium text-slate-400">
                {profile.enrolmentNo}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 pb-2">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="pt-5 text-[11px] uppercase tracking-wider text-slate-400 font-bold px-3 pb-2">
            Preferences
          </div>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer with Project Attribution */}
        <div className="p-4 border-t border-navy-800 bg-navy-950/60">
          <div className="text-[11px] text-slate-400 font-medium">
            <span className="text-white font-semibold">ETURI BALAJI</span> (2303A51572)
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            DevOps & Full Stack Course Project
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-navy-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 text-xs font-semibold border border-navy-700 hover:border-rose-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-800 leading-tight">
                Student Transportation Pass & Route System
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Academic Session 2026–2027 • DevOps & Cloud Systems
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Button */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-brand-600 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user?.name}</div>
                  <div className="text-[10px] font-semibold text-brand-600">{user?.role}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
              </button>

              {userDropdown && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setUserDropdown(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={() => navigate('/notifications')}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span>Notifications</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

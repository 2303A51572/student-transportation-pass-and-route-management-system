import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import DriverDashboard from './pages/DriverDashboard';
import RouteManagement from './pages/RouteManagement';
import BusManagement from './pages/BusManagement';
import ApplicationPage from './pages/ApplicationPage';
import ApplicationApproval from './pages/ApplicationApproval';
import TransportationPassPage from './pages/TransportationPassPage';
import PassRenewalPage from './pages/PassRenewalPage';
import FeeCollectionPage from './pages/FeeCollectionPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import StudentDirectoryPage from './pages/StudentDirectoryPage';
import LiveTripsPage from './pages/LiveTripsPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying transportation security credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-Based Home Switcher
const RoleHome = () => {
  const { isAdmin, isManager, isDriver } = useAuth();

  if (isAdmin || isManager) {
    return <AdminDashboard />;
  }
  if (isDriver) {
    return <DriverDashboard />;
  }
  return <StudentDashboard />;
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated Dashboard Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RoleHome />} />
              <Route path="routes" element={<RouteManagement />} />
              <Route path="buses" element={<BusManagement />} />
              <Route path="apply" element={<ApplicationPage />} />
              <Route path="approvals" element={<ApplicationApproval />} />
              <Route path="passes" element={<ReportsPage />} />
              <Route path="pass" element={<TransportationPassPage />} />
              <Route path="renewal" element={<PassRenewalPage />} />
              <Route path="renewals" element={<PassRenewalPage />} />
              <Route path="fees" element={<FeeCollectionPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="students" element={<StudentDirectoryPage />} />
              <Route path="trips" element={<LiveTripsPage />} />
              <Route path="qr-scan" element={<DriverDashboard />} />
              <Route path="roster" element={<DriverDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

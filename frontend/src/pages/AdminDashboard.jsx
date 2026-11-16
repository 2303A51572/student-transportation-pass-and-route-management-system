import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import {
  Users,
  Bus,
  MapPin,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CreditCard,
  ArrowRight,
  CheckCircle,
  XCircle,
  FileText,
  BarChart2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [routeAllocation, setRouteAllocation] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transport-managers/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentApplications(res.data.recentApplications || []);
        setRouteAllocation(res.data.routeAllocationData || []);
      }
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const pieData = stats
    ? [
        { name: 'Active Passes', value: stats.activePasses, color: '#10b981' },
        { name: 'Pending Apps', value: stats.pendingApplications, color: '#f59e0b' },
        { name: 'Expired Passes', value: stats.expiredPasses, color: '#ef4444' }
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-brand-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-2 border border-brand-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Administrative Command Center • AY 2026-2027
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Transportation System Overview
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Monitor campus fleet operations, review student bus pass issuances, track route seat capacities, and reconcile semester fee revenues.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/approvals"
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Review Applications ({stats?.pendingApplications || 0})</span>
            </Link>
            <Link
              to="/reports"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm border border-white/10 transition-all flex items-center gap-1.5"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Generate Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Students"
          value={loading ? '...' : stats?.totalStudents || 0}
          subtitle="Enrolled student body"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Bus Fleet"
          value={loading ? '...' : stats?.totalBuses || 0}
          subtitle={`${stats?.totalRoutes || 0} Scheduled routes`}
          icon={Bus}
          color="emerald"
        />
        <StatCard
          title="Active Transit Passes"
          value={loading ? '...' : stats?.activePasses || 0}
          subtitle={`${stats?.expiredPasses || 0} passes expired`}
          icon={ShieldCheck}
          color="purple"
        />
        <StatCard
          title="Total Fee Collection"
          value={loading ? '...' : `₹${(stats?.totalFeeCollection || 0).toLocaleString()}`}
          subtitle="Real-time collection total"
          icon={CreditCard}
          color="amber"
          trend="100% Reconciled"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Passenger Allocation Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Route Passenger Allocation</h2>
              <p className="text-xs text-slate-500">Active students assigned across campus routes</p>
            </div>
            <Link to="/routes" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>Manage Routes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeAllocation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl">
                          <div className="font-bold">{data.routeName}</div>
                          <div className="text-brand-300 font-semibold mt-1">
                            {data.students} Allocated Students
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="students" fill="#026fc4" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass Status Breakdown Donut Chart */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pass Issuance Status</h2>
            <p className="text-xs text-slate-500">Distribution of passes & active applications</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Pass Applications</h2>
            <p className="text-xs text-slate-500">Latest student transportation enrollment requests</p>
          </div>
          <Link
            to="/approvals"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Enrolment No</th>
                <th className="px-6 py-3.5">Requested Route</th>
                <th className="px-6 py-3.5">Pickup Stop</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No transportation applications recorded yet.
                  </td>
                </tr>
              ) : (
                recentApplications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {app.student?.studentName || 'Student'}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-brand-700">
                      {app.student?.enrolmentNo || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {app.route?.routeName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{app.stopName}</td>
                    <td className="px-6 py-4">
                      <Badge status={app.status}>{app.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to="/approvals"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 font-semibold text-xs transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

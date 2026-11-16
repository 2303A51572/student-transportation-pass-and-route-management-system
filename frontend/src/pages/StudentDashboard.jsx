import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import {
  Bus,
  MapPin,
  Calendar,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  FileText,
  Clock,
  ArrowRight,
  Download,
  AlertCircle
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [passData, setPassData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        // Fetch current pass
        try {
          const passRes = await api.get('/passes/my');
          if (passRes.data.success) {
            setPassData(passRes.data.pass);
          }
        } catch (e) {
          // No active pass yet
        }

        // Fetch applications
        const appRes = await api.get('/applications/my');
        if (appRes.data.success) {
          setApplications(appRes.data.applications);
        }

        // Fetch payments
        const payRes = await api.get('/payments/my');
        if (payRes.data.success) {
          setPayments(payRes.data.payments);
        }
      } catch (err) {
        toast.error('Failed to load student dashboard details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const latestApp = applications[0];
  const activePass = passData;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-brand-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-2 border border-brand-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Student Transportation Portal • AY 2026–2027
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Enrolment No: <span className="font-mono font-bold text-white">{profile?.enrolmentNo || '2303A51572'}</span> • Department of {profile?.department || 'Computer Science and Engineering'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {activePass ? (
              <Link
                to="/pass"
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>View My Bus Pass</span>
              </Link>
            ) : (
              <Link
                to="/apply"
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Apply for Bus Pass</span>
              </Link>
            )}
            <Link
              to="/renewal"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm border border-white/10 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Pass Renewal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Student Pass Overview Card */}
      {activePass ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current Official Transit Pass
                </span>
                <Badge status={activePass.status}>{activePass.status}</Badge>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Pass ID: {activePass.passId}
              </h2>
            </div>
            <Link
              to="/pass"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Pass</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">Assigned Route</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {activePass.route?.routeName || 'Campus Route'}
                </span>
                <span className="text-xs text-brand-700 font-mono font-medium block">
                  {activePass.route?.routeCode}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">Designated Bus</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {activePass.bus?.busNumber || 'BUS-101'}
                </span>
                <span className="text-xs text-slate-500 block">
                  {activePass.bus?.registrationNumber}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">Pickup Stop</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {activePass.stopName || 'Station Stop'}
                </span>
                <span className="text-xs text-slate-500 block">
                  Daily Morning & Evening
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">Validity Expiration</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {new Date(activePass.validUntil).toLocaleDateString()}
                </span>
                <span className="text-xs text-emerald-600 font-semibold block">
                  Active Credential
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-6 sm:p-8 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-900">No Active Transportation Pass Found</h3>
            <p className="text-xs text-amber-700 mt-1 max-w-xl">
              You do not have an active bus pass for the current semester. Apply for a new transportation pass or check your application review status below.
            </p>
            <Link
              to="/apply"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <span>Apply for Bus Pass Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/routes"
          className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Browse Campus Routes</h3>
          <p className="text-xs text-slate-500 mt-1">
            Explore 5 designated university transportation routes, intermediate stops, and morning timings.
          </p>
        </Link>

        <Link
          to="/fees"
          className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Fee Payments & Receipts</h3>
          <p className="text-xs text-slate-500 mt-1">
            Review your transportation payments, pending semester balances, and download official receipts.
          </p>
        </Link>

        <Link
          to="/renewal"
          className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Pass Renewal Portal</h3>
          <p className="text-xs text-slate-500 mt-1">
            Extend your bus pass validity for upcoming semesters with one-click simulated fee settlement.
          </p>
        </Link>
      </div>

      {/* Application & History Section */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Transportation Applications</h2>
            <p className="text-xs text-slate-500">History of your pass requests and verification status</p>
          </div>
          <Link to="/apply" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>New Application</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Application Date</th>
                <th className="px-6 py-3.5">Route</th>
                <th className="px-6 py-3.5">Pickup Stop</th>
                <th className="px-6 py-3.5">Academic Session</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No transportation applications filed yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {app.route?.routeName || 'Selected Route'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{app.stopName}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {app.academicYear} • {app.semester}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={app.status}>{app.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {app.rejectionReason ? (
                        <span className="text-rose-600 font-medium">{app.rejectionReason}</span>
                      ) : app.status === 'APPROVED' ? (
                        <span className="text-emerald-600 font-medium">Pass Generated</span>
                      ) : (
                        'Under Verification'
                      )}
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

export default StudentDashboard;

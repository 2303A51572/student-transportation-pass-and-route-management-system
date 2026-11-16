import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  MapPin,
  Clock,
  Bus,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

const ApplicationPage = () => {
  const { user, profile } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState('');
  const [idProofType, setIdProofType] = useState('College ID Card');
  const [idProofNumber, setIdProofNumber] = useState(profile?.enrolmentNo || '2303A51572');
  const [academicYear, setAcademicYear] = useState('2026–2027');
  const [semester, setSemester] = useState('I Semester');
  const [loading, setLoading] = useState(false);
  const [fetchingRoutes, setFetchingRoutes] = useState(true);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setFetchingRoutes(true);
        const res = await api.get('/routes');
        if (res.data.success) {
          setRoutes(res.data.routes);
          if (res.data.routes.length > 0) {
            setSelectedRouteId(res.data.routes[0]._id);
            setSelectedRoute(res.data.routes[0]);
            if (res.data.routes[0].stops?.length > 0) {
              setSelectedStop(res.data.routes[0].stops[0].stopName);
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load campus routes.');
      } finally {
        setFetchingRoutes(false);
      }
    };

    fetchRoutes();
  }, []);

  const handleRouteChange = (e) => {
    const rId = e.target.value;
    setSelectedRouteId(rId);
    const found = routes.find((r) => r._id === rId);
    setSelectedRoute(found || null);
    if (found?.stops?.length > 0) {
      setSelectedStop(found.stops[0].stopName);
    } else {
      setSelectedStop('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRouteId || !selectedStop || !idProofNumber) {
      toast.error('Please complete all mandatory application fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/applications', {
        routeId: selectedRouteId,
        stopName: selectedStop,
        idProofType,
        idProofNumber,
        academicYear,
        semester,
        documentUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80'
      });

      if (res.data.success) {
        toast.success('Transportation pass application submitted for verification!');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  const currentStopObj = selectedRoute?.stops?.find((s) => s.stopName === selectedStop);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Apply for Transportation Pass
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit official enrollment request for designated university bus route boarding credentials.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Student Information Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Applicant Student Profile
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900 block">{user?.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Enrolment No:</span>
                <span className="font-mono font-bold text-brand-700 block">
                  {profile?.enrolmentNo || '2303A51572'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-800 block truncate">
                  {profile?.department || 'DevOps & Cloud Systems'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Route & Stop Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. Route & Station Stop Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Select Transportation Route *
                </label>
                <select
                  value={selectedRouteId}
                  onChange={handleRouteChange}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-800"
                >
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.routeCode} - {r.routeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Select Pickup & Boarding Stop *
                </label>
                <select
                  value={selectedStop}
                  onChange={(e) => setSelectedStop(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-800"
                >
                  {selectedRoute?.stops?.map((s) => (
                    <option key={s._id} value={s.stopName}>
                      {s.stopOrder}. {s.stopName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Stop Timetable Box */}
            {currentStopObj && (
              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-brand-900">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>
                    Morning Pickup: <strong>{currentStopObj.morningPickupTime}</strong> | Evening Drop: <strong>{currentStopObj.eveningDropTime}</strong>
                  </span>
                </div>
                <div className="font-bold text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-lg">
                  Fee: ₹{currentStopObj.farePerSemester?.toLocaleString() || 12000} / Semester
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Academic Session & ID Proof */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Academic Information & Identity Proof
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Semester Session
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="I Semester">I Semester</option>
                  <option value="II Semester">II Semester</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Identity Proof Type *
                </label>
                <select
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="College ID Card">College ID Card</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  ID Document Number *
                </label>
                <input
                  type="text"
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  placeholder="ID Card Number"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>

            {/* Document Upload Simulation */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Upload Scanned ID / Residence Proof
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">
                  Click to select or drag and drop verification document
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  PNG, JPG, or PDF up to 5MB (Pre-loaded university verification template active)
                </span>
              </div>
            </div>
          </div>

          {/* Declaration & Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[11px] text-slate-500 max-w-md">
              By submitting this application, I confirm adherence to campus bus rules and agree to the semester transportation tariff.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Submit Application</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationPage;

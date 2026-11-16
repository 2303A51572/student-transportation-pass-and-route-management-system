import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import {
  Bus,
  MapPin,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  CheckSquare,
  Users,
  Search,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [driverData, setDriverData] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // QR Validation State
  const [passIdInput, setPassIdInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Trip Status
  const [selectedStop, setSelectedStop] = useState('');
  const [tripActionLoading, setTripActionLoading] = useState(false);

  const toast = useToast();

  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/drivers/me');
      if (res.data.success) {
        setDriverData(res.data.driver);
        setPassengers(res.data.passengers || []);
        setCurrentTrip(res.data.currentTrip);
        if (res.data.currentTrip?.currentStop) {
          setSelectedStop(res.data.currentTrip.currentStop);
        }
      }
    } catch (err) {
      toast.error('Failed to load driver assignment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const handleValidatePass = async (idToValidate) => {
    const id = (idToValidate || passIdInput).trim();
    if (!id) {
      toast.error('Please enter a Pass ID or scan a QR payload.');
      return;
    }

    try {
      setValidating(true);
      const res = await api.post('/passes/validate-qr', { passId: id });
      setVerificationResult(res.data);
      if (res.data.isValid) {
        toast.success(`Pass ${id} is ACTIVE. Boarding authorized!`);
      } else {
        toast.warning(res.data.message || 'Pass invalid or expired.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification service error.');
    } finally {
      setValidating(false);
    }
  };

  const handleStartTrip = async (type = 'MORNING_PICKUP') => {
    try {
      setTripActionLoading(true);
      const res = await api.post('/trips/start', { tripType: type });
      if (res.data.success) {
        setCurrentTrip(res.data.trip);
        setSelectedStop(res.data.trip.currentStop || '');
        toast.success('Trip started! Passenger validations are actively tracked.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start trip.');
    } finally {
      setTripActionLoading(false);
    }
  };

  const handleUpdateStop = async () => {
    if (!currentTrip || !selectedStop) return;
    try {
      const res = await api.patch(`/trips/${currentTrip._id}/stop`, { stopName: selectedStop });
      if (res.data.success) {
        setCurrentTrip(res.data.trip);
        toast.success(`Current station updated to ${selectedStop}`);
      }
    } catch (err) {
      toast.error('Failed to update current station stop.');
    }
  };

  const handleCompleteTrip = async () => {
    if (!currentTrip) return;
    try {
      setTripActionLoading(true);
      const res = await api.patch(`/trips/${currentTrip._id}/complete`);
      if (res.data.success) {
        setCurrentTrip(null);
        toast.success('Trip completed successfully! Attendance synced.');
        fetchDriverProfile();
      }
    } catch (err) {
      toast.error('Failed to complete trip.');
    } finally {
      setTripActionLoading(false);
    }
  };

  const bus = driverData?.assignedBus;
  const route = bus?.assignedRoute;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Driver Operational Terminal • AY 2026–2027
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {driverData?.driverName || user?.name || 'Bus Driver'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Vehicle: <span className="font-bold text-white">{bus?.busNumber || 'BUS-101'}</span> ({bus?.registrationNumber || 'TS-09-UB-4021'}) • Route: {route?.routeName || 'Assigned Route'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentTrip ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                TRIP IN PROGRESS ({currentTrip.tripType})
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                Awaiting Next Departure
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Driver Controls & Trip Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Validator & Pass Scanner Box */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">QR Transit Pass Verification</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan or input student Pass ID to check live validity before boarding
              </p>
            </div>
          </div>

          {/* Input Box */}
          <div className="mt-5 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={passIdInput}
                onChange={(e) => setPassIdInput(e.target.value)}
                placeholder="Scan or enter Pass ID (e.g. PASS-2026-0001)"
                className="flex-1 px-4 py-3 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && handleValidatePass()}
              />
              <button
                onClick={() => handleValidatePass()}
                disabled={validating}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50 shrink-0"
              >
                {validating ? 'Verifying...' : 'Validate Pass'}
              </button>
            </div>

            {/* Quick Test Demo Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Test Codes:
              </span>
              <button
                type="button"
                onClick={() => {
                  setPassIdInput('PASS-2026-0001');
                  handleValidatePass('PASS-2026-0001');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 text-[11px]"
              >
                PASS-2026-0001 (Valid Active - Balaji)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPassIdInput('PASS-2026-0014');
                  handleValidatePass('PASS-2026-0014');
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 text-[11px]"
              >
                PASS-2026-0014 (Expired Pass)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPassIdInput('PASS-INVALID-99');
                  handleValidatePass('PASS-INVALID-99');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 text-[11px]"
              >
                Fake Pass ID (Invalid)
              </button>
            </div>
          </div>

          {/* Verification Result Display */}
          {verificationResult && (
            <div className="mt-6 pt-5 border-t border-slate-100 animate-in fade-in duration-200">
              {verificationResult.validationStatus === 'ACTIVE' && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-950">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold uppercase tracking-wide text-emerald-800">
                        BOARDING AUTHORIZED • ACTIVE PASS
                      </div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        {verificationResult.message}
                      </div>
                    </div>
                  </div>

                  {verificationResult.details && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-200/80 text-xs">
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">Student</span>
                        <span className="font-extrabold text-emerald-950 text-sm block">
                          {verificationResult.details.studentName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">Enrolment No</span>
                        <span className="font-mono font-bold text-emerald-900 block">
                          {verificationResult.details.enrolmentNo}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">Pickup Stop</span>
                        <span className="font-semibold text-emerald-900 block">
                          {verificationResult.details.stopName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">Valid Until</span>
                        <span className="font-semibold text-emerald-900 block">
                          {new Date(verificationResult.details.validUntil).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {verificationResult.validationStatus === 'EXPIRED' && (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 text-rose-950">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold uppercase tracking-wide text-rose-800">
                        BOARDING DENIED • EXPIRED TRANSIT PASS
                      </div>
                      <div className="text-xs text-rose-700 mt-0.5">
                        {verificationResult.message}
                      </div>
                    </div>
                  </div>

                  {verificationResult.details && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-rose-200/80 text-xs">
                      <div>
                        <span className="text-[10px] text-rose-600 font-bold uppercase block">Student</span>
                        <span className="font-bold text-rose-950 block">
                          {verificationResult.details.studentName} ({verificationResult.details.enrolmentNo})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-600 font-bold uppercase block">Expired On</span>
                        <span className="font-bold text-rose-900 block">
                          {new Date(verificationResult.details.validUntil).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-600 font-bold uppercase block">Action</span>
                        <span className="text-rose-700 font-medium block">
                          Instruct student to submit pass renewal online
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {verificationResult.validationStatus === 'INVALID' && (
                <div className="rounded-2xl bg-slate-100 border border-slate-200 p-5 text-slate-800">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-slate-500 shrink-0" />
                    <div>
                      <div className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                        INVALID PASS IDENTIFIER
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {verificationResult.message}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Trip Management Controls */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Trip Controller</h2>
              <Bus className="w-5 h-5 text-slate-400" />
            </div>

            {currentTrip ? (
              <div className="mt-4 space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Trip Type:</span>
                    <span className="font-bold text-slate-900">{currentTrip.tripType}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Started At:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(currentTrip.startedAt || currentTrip.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Boarded Passengers:</span>
                    <span className="font-bold text-brand-600">
                      {currentTrip.validatedPasses?.length || 0} students
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Current Transit Stop:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedStop}
                      onChange={(e) => setSelectedStop(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
                    >
                      <option value="">Select Station Stop</option>
                      {route?.stops?.map((s) => (
                        <option key={s._id} value={s.stopName}>
                          {s.stopOrder}. {s.stopName} ({s.morningPickupTime})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleUpdateStop}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCompleteTrip}
                  disabled={tripActionLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Mark Trip as Completed</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Ready to begin scheduled university route service. Starting a trip activates passenger boarding tracking.
                </p>
                <button
                  onClick={() => handleStartTrip('MORNING_PICKUP')}
                  disabled={tripActionLoading}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Morning Pickup Trip</span>
                </button>
                <button
                  onClick={() => handleStartTrip('EVENING_DROP')}
                  disabled={tripActionLoading}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Evening Return Trip</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Emergency Dispatch Contact: <span className="font-semibold text-slate-700">+91 98480 22334</span>
          </div>
        </div>
      </div>

      {/* Allocated Student Passengers Roster */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Allocated Student Passengers</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Approved students assigned to {bus?.busNumber || 'this bus'} ({passengers.length} Total Passengers)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Enrolment No</th>
                <th className="px-6 py-3.5">Assigned Stop</th>
                <th className="px-6 py-3.5">Department & Year</th>
                <th className="px-6 py-3.5">Contact Phone</th>
                <th className="px-6 py-3.5 text-right">Pass ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {passengers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No student passengers currently allocated to this vehicle.
                  </td>
                </tr>
              ) : (
                passengers.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {p.student?.studentName}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-purple-700">
                      {p.student?.enrolmentNo}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {p.stopName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.student?.department} • {p.student?.year}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.student?.phone}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-800 text-right">
                      {p.passId}
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

export default DriverDashboard;

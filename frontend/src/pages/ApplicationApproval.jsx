import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Bus,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const ApplicationApproval = () => {
  const [applications, setApplications] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionType, setActionType] = useState('APPROVE'); // 'APPROVE' or 'REJECT'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const fetchApplicationsData = async () => {
    try {
      setLoading(true);
      const [appRes, busRes] = await Promise.all([
        api.get('/applications'),
        api.get('/buses')
      ]);

      if (appRes.data.success) setApplications(appRes.data.applications);
      if (busRes.data.success) setBuses(busRes.data.buses);
    } catch (err) {
      toast.error('Failed to load transportation applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationsData();
  }, []);

  const handleOpenActionModal = (app, type) => {
    setSelectedApp(app);
    setActionType(type);
    setRejectionReason('');

    // Pre-select bus assigned to route
    if (app.route?.assignedBus) {
      setSelectedBusId(app.route.assignedBus);
    } else if (buses.length > 0) {
      setSelectedBusId(buses[0]._id);
    }

    setIsModalOpen(true);
  };

  const handleProcessReview = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (actionType === 'REJECT' && !rejectionReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        status: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        rejectionReason: actionType === 'REJECT' ? rejectionReason : undefined,
        busId: actionType === 'APPROVE' ? selectedBusId : undefined
      };

      const res = await api.patch(`/applications/${selectedApp._id}/review`, payload);
      if (res.data.success) {
        toast.success(
          actionType === 'APPROVE'
            ? 'Application approved! Transportation pass generated.'
            : 'Application rejected.'
        );
        setIsModalOpen(false);
        fetchApplicationsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing review');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      app.student?.studentName?.toLowerCase().includes(term) ||
      app.student?.enrolmentNo?.toLowerCase().includes(term) ||
      app.route?.routeName?.toLowerCase().includes(term) ||
      app.stopName?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Transportation Application Review
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review student boarding requests, verify identity documents, and allocate bus seats.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 self-start sm:self-auto text-xs font-semibold shadow-2xs">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by student name, enrolment number, or route..."
          className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Applicant Student</th>
                <th className="px-6 py-4">Enrolment No</th>
                <th className="px-6 py-4">Department & Year</th>
                <th className="px-6 py-4">Route & Stop</th>
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No transportation applications match the current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900">
                        {app.student?.studentName || 'Student'}
                      </div>
                      <div className="text-[11px] text-slate-500">{app.student?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-700">
                      {app.student?.enrolmentNo || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 block">
                        {app.student?.department}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {app.academicYear} • {app.semester}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">
                        {app.route?.routeName}
                      </span>
                      <span className="text-slate-600 font-medium block">
                        Stop: {app.stopName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {app.idProofType}
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {app.idProofNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={app.status}>{app.status}</Badge>
                      {app.rejectionReason && (
                        <div className="text-[10px] text-rose-600 mt-1 max-w-[140px] truncate" title={app.rejectionReason}>
                          {app.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {app.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenActionModal(app, 'APPROVE')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(app, 'REJECT')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Reviewed {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          actionType === 'APPROVE'
            ? 'Approve Transportation Application'
            : 'Reject Application'
        }
        subtitle={
          selectedApp
            ? `${selectedApp.student?.studentName} (${selectedApp.student?.enrolmentNo})`
            : ''
        }
        maxWidth="max-w-md"
      >
        <form onSubmit={handleProcessReview} className="space-y-4 text-xs">
          {actionType === 'APPROVE' ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Ready for Pass Generation</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Approving this application will generate a secure QR Transit Pass and initiate the semester fee record.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Allocate Designated Bus Vehicle *
                </label>
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                >
                  {buses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.busNumber} ({b.model} - {b.availableSeats} Seats Available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Route:</span>
                  <strong className="text-slate-800">{selectedApp?.route?.routeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Boarding Stop:</span>
                  <strong className="text-slate-800">{selectedApp?.stopName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Validity Duration:</span>
                  <strong className="text-slate-800">6 Months (Semester I)</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-rose-900 text-xs">
                Please provide an official rejection reason. This will be transmitted directly to the student portal.
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Scanned ID card illegible, incorrect residential landmark, or duplicate registration."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
                actionType === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
              }`}
            >
              {submitting ? 'Processing...' : actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ApplicationApproval;

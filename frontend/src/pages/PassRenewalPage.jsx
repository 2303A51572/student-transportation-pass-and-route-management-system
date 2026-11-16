import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  RefreshCw,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

const PassRenewalPage = () => {
  const { user, isAdmin, isManager, isStudent } = useAuth();
  const [activePass, setActivePass] = useState(null);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student Renewal Request State
  const [requestedMonths, setRequestedMonths] = useState(6);
  const [requestModal, setRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Admin Review State
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [remarks, setRemarks] = useState('');

  const toast = useToast();

  const fetchRenewalData = async () => {
    try {
      setLoading(true);

      if (isStudent) {
        // Fetch student pass and renewals
        try {
          const pRes = await api.get('/passes/my');
          if (pRes.data.success) setActivePass(pRes.data.pass);
        } catch (e) {}

        const rRes = await api.get('/renewals/my');
        if (rRes.data.success) setRenewals(rRes.data.renewals);
      } else {
        // Admin / Manager view all
        const rRes = await api.get('/renewals');
        if (rRes.data.success) setRenewals(rRes.data.renewals);
      }
    } catch (err) {
      toast.error('Failed to load pass renewal records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewalData();
  }, []);

  const handleStudentSubmitRenewal = async (e) => {
    e.preventDefault();
    if (!activePass) return;

    try {
      setSubmitting(true);
      const res = await api.post('/renewals', {
        passId: activePass._id,
        requestedPeriodMonths: requestedMonths
      });

      if (res.data.success) {
        toast.success('Pass renewal request submitted! Verification in progress.');
        setRequestModal(false);
        fetchRenewalData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting renewal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminReviewRenewal = async (e) => {
    e.preventDefault();
    if (!selectedRenewal) return;

    try {
      setSubmitting(true);
      const res = await api.patch(`/renewals/${selectedRenewal._id}/review`, {
        status: reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        remarks
      });

      if (res.data.success) {
        toast.success(
          reviewAction === 'APPROVE'
            ? 'Renewal approved! Pass validity extended.'
            : 'Renewal rejected.'
        );
        setReviewModal(false);
        fetchRenewalData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating renewal');
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedFee = requestedMonths === 12 ? 22000 : 12000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Transportation Pass Renewal Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Extend boarding credentials for upcoming academic semesters with integrated fee clearance.
          </p>
        </div>

        {isStudent && activePass && (
          <button
            onClick={() => setRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/25 transition-all self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Request Pass Renewal</span>
          </button>
        )}
      </div>

      {/* Student: Current Pass Eligibility Card */}
      {isStudent && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
          {activePass ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Active Pass
                    </span>
                    <Badge status={activePass.status}>{activePass.status}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {activePass.passId} • {activePass.route?.routeName}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Pickup Stop: <strong className="text-slate-800">{activePass.stopName}</strong> | Vehicle: <strong className="text-brand-700">{activePass.bus?.busNumber}</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Valid Until</span>
                  <span className="font-extrabold text-slate-900 block text-sm">
                    {new Date(activePass.validUntil).toLocaleDateString()}
                  </span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-400 block font-semibold">Renewal Status</span>
                  <Badge status={activePass.renewalStatus || 'NONE'}>
                    {activePass.renewalStatus || 'NONE'}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              No active pass found to renew. Please apply for a pass first.
            </div>
          )}
        </div>
      )}

      {/* Renewals Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {isStudent ? 'My Pass Renewal Requests' : 'Student Renewal Requests Roster'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of semester extension applications and payment statuses
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Student / Pass ID</th>
                <th className="px-6 py-3.5">Requested Duration</th>
                <th className="px-6 py-3.5">Extended Expiry Date</th>
                <th className="px-6 py-3.5">Fee Clearance</th>
                <th className="px-6 py-3.5">Renewal Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {renewals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No pass renewals on file.
                  </td>
                </tr>
              ) : (
                renewals.map((ren) => (
                  <tr key={ren._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {ren.student?.studentName || user?.name}
                      </div>
                      <div className="text-[11px] font-mono text-brand-700">
                        {ren.pass?.passId} ({ren.student?.enrolmentNo || 'Student'})
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {ren.requestedPeriodMonths} Months Extension
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {new Date(ren.newExpiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">₹{ren.renewalFee?.toLocaleString()}</span>
                      <span className="block text-[10px] text-emerald-600 font-semibold">
                        Simulated Demo Paid
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={ren.status}>{ren.status}</Badge>
                      {ren.remarks && (
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">
                          {ren.remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isStudent && ren.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedRenewal(ren);
                              setReviewAction('APPROVE');
                              setRemarks('Approved by transport officer');
                              setReviewModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRenewal(ren);
                              setReviewAction('REJECT');
                              setRemarks('Fee or eligibility criteria not satisfied');
                              setReviewModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {ren.approvedDate ? `Approved on ${new Date(ren.approvedDate).toLocaleDateString()}` : 'Awaiting Review'}
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

      {/* Student Request Modal */}
      <Modal
        isOpen={requestModal}
        onClose={() => setRequestModal(false)}
        title="Apply for Pass Renewal"
        subtitle="Select semester extension duration and confirm simulated demo fee"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleStudentSubmitRenewal} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-2">
              Select Extension Duration:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequestedMonths(6)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  requestedMonths === 6
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-extrabold text-sm text-slate-900">6 Months</div>
                <div className="text-[11px] text-slate-500">1 Academic Semester</div>
                <div className="mt-2 text-xs font-bold text-brand-700">₹12,000</div>
              </button>

              <button
                type="button"
                onClick={() => setRequestedMonths(12)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  requestedMonths === 12
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-extrabold text-sm text-slate-900">12 Months</div>
                <div className="text-[11px] text-slate-500">Full Academic Year</div>
                <div className="mt-2 text-xs font-bold text-emerald-700">₹22,000 (Saved ₹2k)</div>
              </button>
            </div>
          </div>

          {/* Payment Simulation Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Simulated Demo Payment Workflow</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              This will record a simulated settlement of ₹{calculatedFee.toLocaleString()} (Course Project Demonstration - No real money charged).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRequestModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/25"
            >
              {submitting ? 'Submitting...' : 'Submit Renewal Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Review Modal */}
      <Modal
        isOpen={reviewModal}
        onClose={() => setReviewModal(false)}
        title={reviewAction === 'APPROVE' ? 'Approve Pass Renewal' : 'Reject Renewal Request'}
        subtitle={`Pass: ${selectedRenewal?.pass?.passId} • ${selectedRenewal?.student?.studentName}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdminReviewRenewal} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">
              Administrative Remarks *
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReviewModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded-xl text-white font-bold ${
                reviewAction === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? 'Processing...' : 'Confirm Decision'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PassRenewalPage;

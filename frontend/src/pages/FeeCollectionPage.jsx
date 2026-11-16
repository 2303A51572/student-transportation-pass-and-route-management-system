import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  CreditCard,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const FeeCollectionPage = () => {
  const { user, isAdmin, isManager, isStudent } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalCollected: 0, totalPending: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Demo Payment Modal
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(12000);
  const [payMethod, setPayMethod] = useState('ONLINE_UPI');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptModal, setReceiptModal] = useState(false);
  const receiptRef = useRef(null);

  const toast = useToast();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        const res = await api.get('/payments/my');
        if (res.data.success) {
          setPayments(res.data.payments);
          const collected = res.data.payments.filter((p) => p.paymentStatus === 'PAID').reduce((sum, p) => sum + p.paidAmount, 0);
          setSummary({ totalCollected: collected, totalPending: 0, totalTransactions: res.data.payments.length });
        }
      } else {
        const res = await api.get('/payments');
        if (res.data.success) {
          setPayments(res.data.payments);
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      toast.error('Failed to load transportation fee records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    try {
      setSubmittingPayment(true);
      const res = await api.post('/payments/demo-pay', {
        amount: payAmount,
        paymentMethod: payMethod,
        feeType: 'SEMESTER_TRANSPORT_FEE'
      });

      if (res.data.success) {
        toast.success('Demo payment successful! Official receipt generated.');
        setPayModal(false);
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing demo payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDownloadReceiptPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'pt', 'a4');
      pdf.addImage(imgData, 'PNG', 40, 40, 515, 0);
      pdf.save(`Payment_Receipt_${selectedReceipt?.receiptNumber || 'Official'}.pdf`);
    } catch (err) {
      console.error(err);
      window.print();
    }
  };

  const filtered = payments.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.paymentStatus === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.transactionId?.toLowerCase().includes(term) ||
      p.receiptNumber?.toLowerCase().includes(term) ||
      p.student?.studentName?.toLowerCase().includes(term) ||
      p.student?.enrolmentNo?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Transportation Fee Collection & Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track student semester transport fee collections, outstanding balances, and official receipts.
          </p>
        </div>

        {isStudent && (
          <button
            onClick={() => setPayModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/25 transition-all self-start sm:self-auto"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay Semester Fee (Demo)</span>
          </button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Revenue Cleared
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹{summary.totalCollected?.toLocaleString() || 0}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 block">
            {summary.totalTransactions || 0} Settled transactions
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending Dues
          </span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            ₹{summary.totalPending?.toLocaleString() || 0}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 block">
            Awaiting student payment
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Payment Mode
          </span>
          <div className="text-base font-extrabold text-slate-900 mt-1">
            Instant UPI & Net Banking
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            Demo Sandbox Verified
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by receipt number, student, or transaction ID..."
            className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold">
          {['ALL', 'PAID', 'PENDING'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Receipt & Txn ID</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Enrolment No</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No transportation payment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr key={pay._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-900">{pay.receiptNumber}</div>
                      <div className="text-[10px] font-mono text-slate-400">{pay.transactionId}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {pay.student?.studentName || user?.name}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-brand-700">
                      {pay.student?.enrolmentNo || 'Student'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-900 text-sm">
                        ₹{pay.paidAmount?.toLocaleString()}
                      </span>
                      {pay.pendingAmount > 0 && (
                        <span className="block text-[10px] text-amber-600 font-semibold">
                          ₹{pay.pendingAmount.toLocaleString()} Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={pay.paymentStatus}>{pay.paymentStatus}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedReceipt(pay);
                          setReceiptModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-600 text-slate-600 transition-colors"
                        title="View Official Receipt"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Demo Payment Modal */}
      <Modal
        isOpen={payModal}
        onClose={() => setPayModal(false)}
        title="Simulated Transportation Fee Payment"
        subtitle="Educational demonstration checkout (No real credit card or bank credentials needed)"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSimulatePayment} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 text-brand-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-brand-800">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Simulated Instant Clearing Gateway</span>
            </div>
            <p className="text-[11px] text-brand-700">
              Demonstration environment. Clicking confirm will instantly credit the university account ledger.
            </p>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">
              Payment Amount (₹)
            </label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">
              Select Demo Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="ONLINE_UPI">Simulated UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="NET_BANKING">Simulated Net Banking</option>
              <option value="DEBIT_CREDIT_CARD">Simulated Debit / Credit Card</option>
              <option value="CAMPUS_CHALLAN">Campus Treasury Challan</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPayModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPayment}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/25"
            >
              {submittingPayment ? 'Settling...' : `Confirm Demo Payment (₹${payAmount.toLocaleString()})`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Receipt Modal */}
      <Modal
        isOpen={receiptModal}
        onClose={() => setReceiptModal(false)}
        title="Official Transportation Fee Receipt"
        subtitle="University Accounts & Treasury Division"
        maxWidth="max-w-lg"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div
              ref={receiptRef}
              className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-800"
            >
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-slate-200">
                <h3 className="text-base font-extrabold text-slate-900 uppercase">
                  University Student Transport Department
                </h3>
                <p className="text-[10px] text-slate-500">
                  Academic Session 2026–2027 • Fee Payment Receipt
                </p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                  PAYMENT STATUS: {selectedReceipt.paymentStatus}
                </div>
              </div>

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Receipt No</span>
                  <span className="font-mono font-bold text-slate-900">{selectedReceipt.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Transaction Ref</span>
                  <span className="font-mono font-bold text-slate-900">{selectedReceipt.transactionId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Student Name</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.student?.studentName || user?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Enrolment Number</span>
                  <span className="font-mono font-bold text-brand-700">{selectedReceipt.student?.enrolmentNo || 'Student'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Payment Date</span>
                  <span className="font-medium text-slate-800">
                    {new Date(selectedReceipt.paymentDate || selectedReceipt.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Method</span>
                  <span className="font-medium text-slate-800">{selectedReceipt.paymentMethod}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Total Cleared Amount:</span>
                <span className="font-extrabold text-emerald-700 text-base">
                  ₹{selectedReceipt.paidAmount?.toLocaleString()}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-2">
                This is a computer-generated university fee challan. Course Project Demonstration.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleDownloadReceiptPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Receipt</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeeCollectionPage;

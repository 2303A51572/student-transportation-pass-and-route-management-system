import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import BusPassCard from '../components/BusPassCard';
import { ShieldCheck, AlertCircle, FileText, ArrowRight, RefreshCw } from 'lucide-react';

const TransportationPassPage = () => {
  const [passData, setPassData] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchPass = async () => {
      try {
        setLoading(true);
        const res = await api.get('/passes/my');
        if (res.data.success) {
          setPassData(res.data.pass);
          setQrCodeDataUrl(res.data.qrCodeDataUrl);
        }
      } catch (err) {
        // No pass yet
      } finally {
        setLoading(false);
      }
    };

    fetchPass();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Official University Transit Pass
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized digital boarding pass with scannable cryptographic QR code. Present this pass to bus driver upon entry.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold">Generating verified pass view...</span>
        </div>
      ) : passData ? (
        <div className="py-4">
          <BusPassCard pass={passData} qrCodeDataUrl={qrCodeDataUrl} />

          {/* Verification Guidance Note */}
          <div className="max-w-md mx-auto mt-8 p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>Security & Boarding Guidelines</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
              <li>Drivers scan the QR code to check real-time ACTIVE or EXPIRED pass status.</li>
              <li>Pass is non-transferable and tied to your university enrolment number.</li>
              <li>For semester renewals or route alterations, use the renewal interface.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Active Pass Issued</h3>
            <p className="text-xs text-slate-500 mt-1">
              You do not currently hold an approved transportation pass. Please submit an application for route allocation.
            </p>
          </div>
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/25 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Apply for Bus Pass</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default TransportationPassPage;

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, ShieldCheck, Bus, Calendar, MapPin, Award } from 'lucide-react';
import Badge from './Badge';

const BusPassCard = ({ pass, qrCodeDataUrl }) => {
  const cardRef = useRef(null);

  if (!pass) return null;

  const student = pass.student || {};
  const route = pass.route || {};
  const bus = pass.bus || {};

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [105, 148] // A6 card size
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 105, 148);
      pdf.save(`University_Bus_Pass_${pass.passId || 'Student'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const qrPayload = pass.qrCodeData || JSON.stringify({
    passId: pass.passId,
    enrolmentNo: student.enrolmentNo,
    routeCode: route.routeCode,
    busNumber: bus.busNumber,
    validUntil: pass.validUntil
  });

  return (
    <div className="flex flex-col items-center">
      {/* Printable / Downloadable Pass Card (A6 aspect ratio) */}
      <div
        id="printable-pass"
        ref={cardRef}
        className="w-full max-w-[420px] bg-white rounded-3xl overflow-hidden border-2 border-brand-800 shadow-2xl relative select-none"
      >
        {/* Pass Top Banner */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-brand-900 text-white p-5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl transform translate-x-12 -translate-y-8 pointer-events-none" />
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center shadow-md">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-brand-300">
              Department of Transport
            </span>
          </div>
          <h2 className="text-sm font-extrabold tracking-tight uppercase">
            University Student Transit Pass
          </h2>
          <p className="text-[10px] text-slate-300 mt-0.5 font-medium">
            Academic Session 2026–2027 • Official Boarding Credential
          </p>
        </div>

        {/* Pass ID Stripe */}
        <div className="bg-brand-50 border-y border-brand-100 px-5 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono font-bold text-brand-900">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>ID: {pass.passId}</span>
          </div>
          <Badge status={pass.status}>{pass.status}</Badge>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-4">
          {/* Student Profile Row */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-24 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border-2 border-slate-200 flex flex-col items-center justify-center text-slate-400 font-bold overflow-hidden shadow-inner shrink-0 relative">
              <div className="w-10 h-10 rounded-full bg-brand-600/10 text-brand-600 flex items-center justify-center text-lg font-bold mb-1">
                {student.studentName ? student.studentName.charAt(0) : 'S'}
              </div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Photo</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-extrabold text-slate-900 leading-tight truncate">
                {student.studentName || 'Student Name'}
              </div>
              <div className="text-xs font-mono font-semibold text-brand-700 mt-0.5">
                ENR: {student.enrolmentNo || '2303A51572'}
              </div>
              <div className="text-[11px] text-slate-600 font-medium truncate mt-1">
                {student.department || 'Computer Science and Engineering'}
              </div>
              <div className="text-[11px] text-slate-500">
                {student.year || 'IV Year'} • {student.semester || 'I Semester'}
              </div>
            </div>
          </div>

          {/* Route & Bus Allocation Box */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Assigned Route
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {route.routeName || 'Campus Shuttle Line'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Pickup Point</span>
                <span className="font-bold text-slate-800 truncate block">
                  {pass.stopName || 'Main Terminal'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Designated Bus</span>
                <span className="font-bold text-brand-700 block">
                  {bus.busNumber || 'BUS-101'}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code & Validity */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex-1 space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Valid Through
                </span>
                <span className="font-bold text-slate-900 block text-sm">
                  {new Date(pass.validUntil).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Issued Date
                </span>
                <span className="text-slate-600 font-medium block">
                  {new Date(pass.issueDate || pass.validFrom).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* High Definition Scannable QR Code */}
            <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
              <QRCodeSVG
                value={qrPayload}
                size={96}
                level="H"
                includeMargin={false}
                fgColor="#0f172a"
              />
              <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase font-semibold">
                Scan To Verify
              </span>
            </div>
          </div>
        </div>

        {/* Official Security Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-2.5 text-center">
          <p className="text-[9px] text-slate-500 font-medium">
            Non-transferable university property. Driver validation required upon entry.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-[420px]">
        <button
          onClick={handleDownloadPDF}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-600/25 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Pass</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-sm shadow-xs transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
};

export default BusPassCard;

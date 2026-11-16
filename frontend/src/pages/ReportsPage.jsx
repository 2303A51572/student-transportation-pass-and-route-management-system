import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import {
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  Bus,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Users
} from 'lucide-react';

const ReportsPage = () => {
  const [activeReportTab, setActiveReportTab] = useState('PASS_ISSUANCE'); // 'PASS_ISSUANCE', 'ROUTE_PASSENGERS', 'RENEWAL_DUE', 'FEE_COLLECTION'
  const [reportData, setReportData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [routes, setRoutes] = useState([]);
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('');

  const toast = useToast();

  // Fetch campus routes for dropdown filtering
  useEffect(() => {
    api.get('/routes').then((res) => {
      if (res.data.success) setRoutes(res.data.routes);
    });
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      let params = {};

      if (selectedRouteFilter) params.routeId = selectedRouteFilter;
      if (searchTerm) params.search = searchTerm;

      if (activeReportTab === 'PASS_ISSUANCE') {
        endpoint = '/reports/pass-issuance';
      } else if (activeReportTab === 'ROUTE_PASSENGERS') {
        endpoint = '/reports/route-passengers';
      } else if (activeReportTab === 'RENEWAL_DUE') {
        endpoint = '/reports/renewal-due';
      } else if (activeReportTab === 'FEE_COLLECTION') {
        endpoint = '/reports/fee-collection';
      }

      const res = await api.get(endpoint, { params });
      if (res.data.success) {
        setReportData(res.data.data || []);
        setSummaryData(res.data.summary || null);
      }
    } catch (err) {
      toast.error('Failed to compile report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReportTab, selectedRouteFilter]);

  // CSV Exporter function
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast.warning('No records available to export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeReportTab === 'PASS_ISSUANCE') {
      csvContent += 'Pass ID,Student Name,Enrolment No,Department,Route,Bus No,Pickup Stop,Issue Date,Valid Until,Status\n';
      reportData.forEach((r) => {
        csvContent += `"${r.passId}","${r.studentName}","${r.enrolmentNo}","${r.department}","${r.routeName}","${r.busNumber}","${r.stopName}","${new Date(r.issueDate).toLocaleDateString()}","${new Date(r.validUntil).toLocaleDateString()}","${r.status}"\n`;
      });
    } else if (activeReportTab === 'ROUTE_PASSENGERS') {
      csvContent += 'Route Code,Route Name,Bus Number,Driver Name,Total Capacity,Allocated Students,Available Seats\n';
      reportData.forEach((r) => {
        csvContent += `"${r.routeCode}","${r.routeName}","${r.busNumber}","${r.driverName}",${r.totalCapacity},${r.totalAllocatedStudents},${r.availableSeats}\n`;
      });
    } else if (activeReportTab === 'RENEWAL_DUE') {
      csvContent += 'Pass ID,Student Name,Enrolment No,Department,Route,Bus No,Expiration Date,Days Remaining,Renewal Urgency,Renewal Status\n';
      reportData.forEach((r) => {
        csvContent += `"${r.passId}","${r.studentName}","${r.enrolmentNo}","${r.department}","${r.routeName}","${r.busNumber}","${new Date(r.expirationDate).toLocaleDateString()}",${r.daysRemaining},"${r.renewalUrgency}","${r.renewalStatus}"\n`;
      });
    } else if (activeReportTab === 'FEE_COLLECTION') {
      csvContent += 'Receipt No,Transaction ID,Student Name,Enrolment No,Route,Total Fee,Amount Paid,Pending,Date,Status\n';
      reportData.forEach((r) => {
        csvContent += `"${r.receiptNumber}","${r.transactionId}","${r.studentName}","${r.enrolmentNo}","${r.routeName}",${r.totalFee},${r.amountPaid},${r.pendingAmount},"${new Date(r.paymentDate).toLocaleDateString()}","${r.paymentStatus}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReportTab}_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report CSV exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Transportation Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time MongoDB audit registries, seat load manifests, expiry trackers, and fee ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Mandatory Report Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 bg-slate-200/60 rounded-2xl">
        <button
          onClick={() => setActiveReportTab('PASS_ISSUANCE')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeReportTab === 'PASS_ISSUANCE'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>1. Pass Issuance</span>
        </button>

        <button
          onClick={() => setActiveReportTab('ROUTE_PASSENGERS')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeReportTab === 'ROUTE_PASSENGERS'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bus className="w-4 h-4 text-emerald-600" />
          <span>2. Route-wise Passengers</span>
        </button>

        <button
          onClick={() => setActiveReportTab('RENEWAL_DUE')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeReportTab === 'RENEWAL_DUE'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-amber-600" />
          <span>3. Renewal Due Report</span>
        </button>

        <button
          onClick={() => setActiveReportTab('FEE_COLLECTION')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeReportTab === 'FEE_COLLECTION'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-purple-600" />
          <span>4. Transport Fee Collection</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReport()}
            placeholder="Search report records..."
            className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedRouteFilter}
            onChange={(e) => setSelectedRouteFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Campus Routes</option>
            {routes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.routeCode} - {r.routeName}
              </option>
            ))}
          </select>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Report 1: PASS ISSUANCE REPORT */}
      {activeReportTab === 'PASS_ISSUANCE' && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Pass Issuance Report ({reportData.length} Total Passes Recorded)
            </span>
            <span className="text-[11px] text-slate-500 font-medium">AY 2026–2027</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Pass ID</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Enrolment Number</th>
                  <th className="px-6 py-3.5">Route</th>
                  <th className="px-6 py-3.5">Bus Number</th>
                  <th className="px-6 py-3.5">Issue Date</th>
                  <th className="px-6 py-3.5">Expiry Date</th>
                  <th className="px-6 py-3.5">Pass Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3.5 font-mono font-bold text-brand-700">{r.passId}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{r.studentName}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-600">{r.enrolmentNo}</td>
                    <td className="px-6 py-3.5 text-slate-800">{r.routeName}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">{r.busNumber}</td>
                    <td className="px-6 py-3.5 text-slate-600">{new Date(r.issueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{new Date(r.validUntil).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5">
                      <Badge status={r.status}>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: ROUTE-WISE PASSENGERS REPORT */}
      {activeReportTab === 'ROUTE_PASSENGERS' && (
        <div className="space-y-4">
          {reportData.map((rt, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="p-6 bg-slate-50/60 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-brand-600 text-white font-mono font-bold text-xs">
                      {rt.routeCode}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900">{rt.routeName}</h2>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Designated Vehicle: <strong className="text-slate-800">{rt.busNumber}</strong> ({rt.busModel}) • Driver: <strong className="text-slate-800">{rt.driverName}</strong> ({rt.driverPhone})
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase">Allocated Students</span>
                    <span className="text-brand-700 font-extrabold text-sm">{rt.totalAllocatedStudents} Passengers</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase">Available Seats</span>
                    <span className="text-emerald-700 font-extrabold text-sm">{rt.availableSeats} of {rt.totalCapacity}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Pass ID</th>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Enrolment Number</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Year</th>
                      <th className="px-6 py-3">Boarding Stop</th>
                      <th className="px-6 py-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {rt.passengers?.map((p, pIdx) => (
                      <tr key={pIdx} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3 font-mono font-semibold text-brand-700">{p.passId}</td>
                        <td className="px-6 py-3 font-bold text-slate-900">{p.studentName}</td>
                        <td className="px-6 py-3 font-mono text-slate-600">{p.enrolmentNo}</td>
                        <td className="px-6 py-3 text-slate-700">{p.department}</td>
                        <td className="px-6 py-3 text-slate-500">{p.year}</td>
                        <td className="px-6 py-3 font-medium text-slate-800">{p.stopName}</td>
                        <td className="px-6 py-3 text-slate-500">{p.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report 3: RENEWAL DUE REPORT */}
      {activeReportTab === 'RENEWAL_DUE' && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Renewal Due & Expiring Passes Report ({reportData.length} Records)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Pass ID</th>
                  <th className="px-6 py-3.5">Route</th>
                  <th className="px-6 py-3.5">Expiration Date</th>
                  <th className="px-6 py-3.5">Days Remaining</th>
                  <th className="px-6 py-3.5">Urgency</th>
                  <th className="px-6 py-3.5">Renewal Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{r.studentName}</td>
                    <td className="px-6 py-3.5 font-mono font-semibold text-brand-700">{r.passId}</td>
                    <td className="px-6 py-3.5 text-slate-800">{r.routeName}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{new Date(r.expirationDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 font-bold">
                      {r.daysRemaining < 0 ? (
                        <span className="text-rose-600 font-extrabold">{Math.abs(r.daysRemaining)} days ago (Expired)</span>
                      ) : (
                        <span className="text-slate-800">{r.daysRemaining} days remaining</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.renewalUrgency === 'EXPIRED' ? 'bg-rose-100 text-rose-800' :
                        r.renewalUrgency === 'CRITICAL' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {r.renewalUrgency}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status={r.renewalStatus}>{r.renewalStatus}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: TRANSPORT FEE COLLECTION REPORT */}
      {activeReportTab === 'FEE_COLLECTION' && (
        <div className="space-y-4">
          {summaryData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                <span className="text-slate-400 font-bold text-[11px] uppercase">Total Assessed Fees</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">₹{summaryData.totalFeeAmount?.toLocaleString()}</div>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                <span className="text-slate-400 font-bold text-[11px] uppercase">Total Realized Revenue</span>
                <div className="text-xl font-extrabold text-emerald-600 mt-1">₹{summaryData.totalPaidAmount?.toLocaleString()}</div>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                <span className="text-slate-400 font-bold text-[11px] uppercase">Collection Clearance Rate</span>
                <div className="text-xl font-extrabold text-brand-600 mt-1">{summaryData.collectionRatePercentage}%</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Transport Fee Collection Registry
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Enrolment Number</th>
                    <th className="px-6 py-3.5">Total Fee</th>
                    <th className="px-6 py-3.5">Amount Paid</th>
                    <th className="px-6 py-3.5">Pending Amount</th>
                    <th className="px-6 py-3.5">Payment Date</th>
                    <th className="px-6 py-3.5">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{r.studentName}</td>
                      <td className="px-6 py-3.5 font-mono text-brand-700">{r.enrolmentNo}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">₹{r.totalFee?.toLocaleString()}</td>
                      <td className="px-6 py-3.5 font-bold text-emerald-700">₹{r.amountPaid?.toLocaleString()}</td>
                      <td className="px-6 py-3.5 font-semibold text-amber-700">₹{r.pendingAmount?.toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-slate-600">{new Date(r.paymentDate).toLocaleDateString()}</td>
                      <td className="px-6 py-3.5">
                        <Badge status={r.paymentStatus}>{r.paymentStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

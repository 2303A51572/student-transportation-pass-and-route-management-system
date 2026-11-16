import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import { Users, Search, Filter, Shield, Phone, Mail } from 'lucide-react';

const StudentDirectoryPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const toast = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students');
      if (res.data.success) {
        setStudents(res.data.students);
      }
    } catch (err) {
      toast.error('Failed to load students directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/students/${id}/status`);
      if (res.data.success) {
        toast.success(`Account status changed to ${res.data.student.status}`);
        fetchStudents();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = students.filter((s) => {
    const matchesDept = !deptFilter || s.department === deptFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      s.studentName.toLowerCase().includes(term) ||
      s.enrolmentNo.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term);

    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Registered Student Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional student records, current transit passes, and account controls.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student name, enrolment number (2303A51572)..."
            className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none self-start sm:self-auto"
        >
          <option value="">All Academic Departments</option>
          <option value="Computer Science and Engineering">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="DevOps & Cloud Systems">DevOps & Cloud Systems</option>
          <option value="Data Science">Data Science</option>
          <option value="Electronics and Communication">ECE</option>
          <option value="Mechanical Engineering">Mechanical</option>
          <option value="Civil Engineering">Civil</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Student Details</th>
                <th className="px-6 py-4">Enrolment No</th>
                <th className="px-6 py-4">Department & Year</th>
                <th className="px-6 py-4">Active Pass</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Account Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-slate-900">{s.studentName}</div>
                    <div className="text-[11px] text-slate-500">{s.email} • {s.phone}</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-brand-700">{s.enrolmentNo}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800 block">{s.department}</span>
                    <span className="text-[11px] text-slate-500 block">{s.year} • {s.semester}</span>
                  </td>
                  <td className="px-6 py-4">
                    {s.currentPass ? (
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">{s.currentPass.passId}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold block">{s.currentPass.status}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">No active pass</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={s.status}>{s.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(s._id, s.status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        s.status === 'ACTIVE'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDirectoryPage;

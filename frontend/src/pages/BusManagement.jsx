import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  Bus,
  Plus,
  Edit2,
  Trash2,
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBusId, setCurrentBusId] = useState(null);

  const [formData, setFormData] = useState({
    busNumber: '',
    registrationNumber: '',
    model: 'Tata Starbus Ultra 40S',
    capacity: 40,
    assignedRoute: '',
    assignedDriver: '',
    status: 'ACTIVE'
  });

  const { isAdmin, isManager } = useAuth();
  const toast = useToast();

  const fetchBusesData = async () => {
    try {
      setLoading(true);
      const [busRes, routeRes, driverRes] = await Promise.all([
        api.get('/buses'),
        api.get('/routes'),
        api.get('/drivers')
      ]);

      if (busRes.data.success) setBuses(busRes.data.buses);
      if (routeRes.data.success) setRoutes(routeRes.data.routes);
      if (driverRes.data.success) setDrivers(driverRes.data.drivers);
    } catch (err) {
      toast.error('Failed to load bus fleet records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusesData();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentBusId(null);
    setFormData({
      busNumber: `BUS-10${buses.length + 1}`,
      registrationNumber: `TS-09-UB-${4025 + buses.length}`,
      model: 'Tata Starbus Ultra 40S',
      capacity: 40,
      assignedRoute: '',
      assignedDriver: '',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bus) => {
    setIsEditing(true);
    setCurrentBusId(bus._id);
    setFormData({
      busNumber: bus.busNumber,
      registrationNumber: bus.registrationNumber,
      model: bus.model,
      capacity: bus.capacity,
      assignedRoute: bus.assignedRoute?._id || bus.assignedRoute || '',
      assignedDriver: bus.assignedDriver?._id || bus.assignedDriver || '',
      status: bus.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/buses/${currentBusId}`, formData);
        toast.success('Bus details updated successfully!');
      } else {
        await api.post('/buses', formData);
        toast.success('New vehicle added to campus fleet!');
      }
      setIsModalOpen(false);
      fetchBusesData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing bus details');
    }
  };

  const handleDelete = async (id, busNum) => {
    if (!window.confirm(`Are you sure you want to retire ${busNum}?`)) return;
    try {
      await api.delete(`/buses/${id}`);
      toast.success('Bus removed from fleet');
      fetchBusesData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete bus with active passengers');
    }
  };

  const filteredBuses = buses.filter((b) => {
    return (
      b.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.assignedRoute?.routeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bus & Vehicle Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain university transport fleet, track real-time seat capacities, and allocate drivers.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Bus</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by bus number (BUS-101), plate number, or route..."
          className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Bus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBuses.map((bus) => {
          const occupancyPct = Math.round(((bus.occupiedSeats || 0) / bus.capacity) * 100);
          const isNearFull = occupancyPct >= 85;

          return (
            <div
              key={bus._id}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                      <Bus className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                        {bus.busNumber}
                      </h2>
                      <span className="font-mono text-xs text-slate-500 font-semibold block mt-0.5">
                        {bus.registrationNumber}
                      </span>
                    </div>
                  </div>
                  <Badge status={bus.status}>{bus.status}</Badge>
                </div>

                {/* Model & Driver Info */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="text-slate-500 truncate">
                    Model: <strong className="text-slate-800">{bus.model}</strong>
                  </div>
                  <div className="text-slate-500 truncate">
                    Route: <strong className="text-brand-700">{bus.assignedRoute?.routeName || 'Unassigned'}</strong>
                  </div>
                  <div className="text-slate-500 truncate">
                    Driver: <strong className="text-slate-800">{bus.assignedDriver?.driverName || 'No Driver Assigned'}</strong>
                  </div>
                </div>

                {/* Capacity & Occupancy Meter */}
                <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Seat Capacity:</span>
                    <span className="text-slate-900">{bus.capacity} Total Seats</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isNearFull ? 'bg-amber-500' : 'bg-brand-600'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="font-bold text-slate-700">
                      {bus.occupiedSeats || 0} Occupied ({occupancyPct}%)
                    </span>
                    <span className="font-bold text-emerald-700">
                      {bus.availableSeats} Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  AY 2026–2027 Roster
                </span>
                <div className="flex items-center gap-1.5">
                  {(isAdmin || isManager) && (
                    <button
                      onClick={() => handleOpenEditModal(bus)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Edit Bus & Driver"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(bus._id, bus.busNumber)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Delete Bus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Bus Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Update Vehicle Details' : 'Register Vehicle in University Fleet'}
        subtitle="Manage registration number, model, capacity, and driver allocation"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Bus Code *</label>
              <input
                type="text"
                value={formData.busNumber}
                onChange={(e) => setFormData({ ...formData, busNumber: e.target.value.toUpperCase() })}
                placeholder="BUS-105"
                required
                className="w-full px-3 py-2 uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Registration Plate *</label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                placeholder="TS-09-UB-4025"
                required
                className="w-full px-3 py-2 uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Vehicle Model *</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Tata Starbus Ultra 40S"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Maximum Seat Capacity *</label>
              <input
                type="number"
                min="10"
                max="80"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Vehicle Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Assigned Route</label>
            <select
              value={formData.assignedRoute}
              onChange={(e) => setFormData({ ...formData, assignedRoute: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="">No Route Assigned</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.routeCode} - {r.routeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Assigned Driver</label>
            <select
              value={formData.assignedDriver}
              onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="">No Driver Assigned</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.driverName} ({d.phone} • {d.licenseNumber})
                </option>
              ))}
            </select>
          </div>

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
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/25"
            >
              {isEditing ? 'Save Changes' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BusManagement;

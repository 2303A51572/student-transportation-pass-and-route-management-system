import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Bus,
  Users,
  Search,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRouteId, setExpandedRouteId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRouteId, setCurrentRouteId] = useState(null);

  const [formData, setFormData] = useState({
    routeName: '',
    routeCode: '',
    startPoint: '',
    endPoint: 'University Main Campus',
    distanceKm: 25,
    estimatedDurationMin: 50,
    morningStartTime: '07:30 AM',
    eveningReturnTime: '04:45 PM',
    assignedBus: '',
    stops: [
      { stopName: '', stopOrder: 1, morningPickupTime: '07:30 AM', eveningDropTime: '05:30 PM', landmark: '', farePerSemester: 12000 }
    ]
  });

  const { isAdmin, isManager } = useAuth();
  const toast = useToast();

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const [routeRes, busRes] = await Promise.all([
        api.get('/routes'),
        api.get('/buses')
      ]);
      if (routeRes.data.success) {
        setRoutes(routeRes.data.routes);
      }
      if (busRes.data.success) {
        setBuses(busRes.data.buses);
      }
    } catch (err) {
      toast.error('Failed to load transportation routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentRouteId(null);
    setFormData({
      routeName: '',
      routeCode: `RT-0${routes.length + 1}`,
      startPoint: '',
      endPoint: 'University Main Campus',
      distanceKm: 25,
      estimatedDurationMin: 50,
      morningStartTime: '07:30 AM',
      eveningReturnTime: '04:45 PM',
      assignedBus: '',
      stops: [
        { stopName: '', stopOrder: 1, morningPickupTime: '07:30 AM', eveningDropTime: '05:30 PM', landmark: '', farePerSemester: 12000 },
        { stopName: 'University Main Campus', stopOrder: 2, morningPickupTime: '08:20 AM', eveningDropTime: '04:45 PM', landmark: 'Campus Porch', farePerSemester: 10000 }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (route) => {
    setIsEditing(true);
    setCurrentRouteId(route._id);
    setFormData({
      routeName: route.routeName,
      routeCode: route.routeCode,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      distanceKm: route.distanceKm || 25,
      estimatedDurationMin: route.estimatedDurationMin || 50,
      morningStartTime: route.morningStartTime || '07:30 AM',
      eveningReturnTime: route.eveningReturnTime || '04:45 PM',
      assignedBus: route.assignedBus?._id || route.assignedBus || '',
      stops: route.stops && route.stops.length > 0 ? route.stops : [
        { stopName: route.startPoint, stopOrder: 1, morningPickupTime: '07:30 AM', eveningDropTime: '05:30 PM', landmark: '', farePerSemester: 12000 }
      ]
    });
    setIsModalOpen(true);
  };

  const handleAddStop = () => {
    const nextOrder = formData.stops.length + 1;
    setFormData({
      ...formData,
      stops: [
        ...formData.stops,
        { stopName: '', stopOrder: nextOrder, morningPickupTime: '07:45 AM', eveningDropTime: '05:15 PM', landmark: '', farePerSemester: 11000 }
      ]
    });
  };

  const handleRemoveStop = (index) => {
    if (formData.stops.length <= 1) {
      toast.warning('A route must have at least one stop.');
      return;
    }
    const updated = formData.stops.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stopOrder: idx + 1 }));
    setFormData({ ...formData, stops: updated });
  };

  const handleStopChange = (index, field, value) => {
    const updated = [...formData.stops];
    updated[index][field] = value;
    setFormData({ ...formData, stops: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.routeName || !formData.routeCode || !formData.startPoint) {
      toast.error('Please enter route name, code, and start point.');
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/routes/${currentRouteId}`, formData);
        toast.success('Route updated successfully!');
      } else {
        await api.post('/routes', formData);
        toast.success('New route created successfully!');
      }
      setIsModalOpen(false);
      fetchRoutes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving route details');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/routes/${id}`);
      toast.success('Route deleted successfully');
      fetchRoutes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete route');
    }
  };

  const filteredRoutes = routes.filter((r) => {
    return (
      r.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.routeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.startPoint.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Transportation Route Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure bus lines, multi-stop itineraries, pickup timings, and student allocations.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Route</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by route name, code (RT-01), or station landmark..."
          className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Route Cards Grid */}
      <div className="space-y-4">
        {filteredRoutes.map((route) => {
          const isExpanded = expandedRouteId === route._id;
          return (
            <div
              key={route._id}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs transition-all hover:border-slate-200"
            >
              {/* Route Summary Row */}
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center font-extrabold text-sm shrink-0">
                    {route.routeCode}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 leading-snug">
                        {route.routeName}
                      </h2>
                      <Badge status={route.isActive ? 'ACTIVE' : 'INACTIVE'}>
                        {route.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-brand-600" />
                        {route.startPoint} <ArrowRight className="w-3 h-3 text-slate-400 mx-0.5 inline" /> {route.endPoint}
                      </span>
                      <span>{route.distanceKm} km</span>
                      <span>~{route.estimatedDurationMin} mins</span>
                      <span className="font-semibold text-slate-800">
                        Morning: {route.morningStartTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-400 font-medium">Assigned Bus</div>
                    <div className="text-xs font-bold text-brand-700">
                      {route.assignedBus?.busNumber || 'Unassigned'}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-400 font-medium">Allocated Students</div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{route.totalStudentsAllocated || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setExpandedRouteId(isExpanded ? null : route._id)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Toggle Stops Details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {(isAdmin || isManager) && (
                      <button
                        onClick={() => handleOpenEditModal(route)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                        title="Edit Route"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(route._id, route.routeName)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title="Delete Route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Multi-Stop Itinerary Details */}
              {isExpanded && (
                <div className="bg-slate-50/70 border-t border-slate-100 p-6 animate-in fade-in duration-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Intermediate Stops & Timetable ({route.stops?.length || 0} Designated Stops)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {route.stops?.map((stop, sIdx) => (
                      <div
                        key={stop._id || sIdx}
                        className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center">
                            {stop.stopOrder}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            ₹{stop.farePerSemester?.toLocaleString() || 12000}/sem
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {stop.stopName}
                        </div>
                        {stop.landmark && (
                          <div className="text-[10px] text-slate-500 truncate">
                            Near {stop.landmark}
                          </div>
                        )}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                          <span>Pickup: <strong className="text-slate-800">{stop.morningPickupTime}</strong></span>
                          <span>Drop: <strong className="text-slate-800">{stop.eveningDropTime}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Route Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Transportation Route' : 'Register New Campus Route'}
        subtitle="Manage route code, path, intermediate bus stops, and timings"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Route Name *</label>
              <input
                type="text"
                value={formData.routeName}
                onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                placeholder="e.g. Route 6: Madhapur to Tech Park"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Route Code *</label>
              <input
                type="text"
                value={formData.routeCode}
                onChange={(e) => setFormData({ ...formData, routeCode: e.target.value.toUpperCase() })}
                placeholder="e.g. RT-06"
                required
                className="w-full px-3 py-2 uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Start Origin Point *</label>
              <input
                type="text"
                value={formData.startPoint}
                onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
                placeholder="e.g. Hitec City Metro"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">End Campus Terminal *</label>
              <input
                type="text"
                value={formData.endPoint}
                onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
                placeholder="e.g. University Main Campus"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Estimated Distance (km)</label>
              <input
                type="number"
                value={formData.distanceKm}
                onChange={(e) => setFormData({ ...formData, distanceKm: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Assigned Vehicle</label>
              <select
                value={formData.assignedBus}
                onChange={(e) => setFormData({ ...formData, assignedBus: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="">No Bus Assigned</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.busNumber} ({b.model} - {b.capacity} Seats)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stops Configurator */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Route Stops & Boarding Timetable
              </span>
              <button
                type="button"
                onClick={handleAddStop}
                className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 font-semibold text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stop</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {formData.stops.map((stop, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-1 text-center font-bold text-slate-400 text-xs">
                    #{stop.stopOrder}
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Stop Name"
                      value={stop.stopName}
                      onChange={(e) => handleStopChange(idx, 'stopName', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Pickup e.g. 07:30 AM"
                      value={stop.morningPickupTime}
                      onChange={(e) => handleStopChange(idx, 'morningPickupTime', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Fare (₹)"
                      value={stop.farePerSemester}
                      onChange={(e) => handleStopChange(idx, 'farePerSemester', Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
              {isEditing ? 'Save Route Changes' : 'Create Route'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RouteManagement;

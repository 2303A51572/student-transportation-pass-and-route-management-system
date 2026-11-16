import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import { Compass, Bus, MapPin, Users, CheckCircle, Clock } from 'lucide-react';

const LiveTripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trips');
      if (res.data.success) {
        setTrips(res.data.trips);
      }
    } catch (err) {
      toast.error('Failed to load trips log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    const interval = setInterval(fetchTrips, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Live Trip Operations & Fleet Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of morning pickup & evening drop routes, stops reached, and boarded passenger tallies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trips.map((trip) => (
          <div
            key={trip._id}
            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {trip.tripType}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {trip.bus?.busNumber || 'BUS'} • {trip.route?.routeCode || 'Route'}
                </h3>
                <span className="text-xs text-slate-500 block truncate">
                  {trip.route?.routeName}
                </span>
              </div>
              <Badge status={trip.status}>{trip.status}</Badge>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Driver:</span>
                <strong className="text-slate-800">{trip.driver?.driverName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Station Stop:</span>
                <strong className="text-brand-700">{trip.currentStop || 'En route'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verified Boarded:</span>
                <strong className="text-emerald-700">{trip.validatedPasses?.length || 0} Students</strong>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Date: {new Date(trip.tripDate).toLocaleDateString()}</span>
              <span>Started: {trip.startedAt ? new Date(trip.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveTripsPage;

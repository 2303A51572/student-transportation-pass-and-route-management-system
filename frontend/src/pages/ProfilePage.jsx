import React, { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Building
} from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(profile?.emergencyContact || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const toast = useToast();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      const res = await api.put('/auth/profile', {
        name,
        phone,
        address,
        emergencyContact
      });
      if (res.data.success) {
        toast.success('Profile details updated successfully!');
        refreshProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        toast.success('Security password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Current password incorrect');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          User Profile & Security Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage institutional credentials, contact details, and account security.
        </p>
      </div>

      {/* Account Snapshot Banner */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
          {user?.name ? user.name.charAt(0) : 'U'}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <Badge status={user?.role}>{user?.role}</Badge>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{user?.email}</div>
          {profile?.enrolmentNo && (
            <div className="text-xs font-mono font-semibold text-brand-700 mt-1">
              Roll / Enrolment: {profile.enrolmentNo} • {profile.department}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <User className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            {profile && (
              <>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">Residential Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">Emergency Contact</label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-600/25 transition-all"
            >
              {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <Lock className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">
                New Password *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/25 transition-all"
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

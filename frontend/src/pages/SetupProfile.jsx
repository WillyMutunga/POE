import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api';

const SetupProfile = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.patch('/users/profile/', {
        first_name: firstName,
        last_name: lastName
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <User size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Complete Profile</h1>
            <p className="text-slate-500 font-medium">Please enter your full name to complete your registration.</p>
          </div>

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
                <CheckCircle size={48} />
              </div>
              <p className="text-xl font-bold text-slate-800">Profile Updated!</p>
              <p className="text-slate-500">Welcome to the system. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Last Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Doe"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-3">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-4 bg-[#0000FE] hover:bg-[#0000FE] text-white font-black text-lg rounded-2xl shadow-lg shadow-blue-50 transition-all mt-4"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'Complete Setup'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupProfile;

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2, ChevronRight, CheckCircle } from 'lucide-react';
import api from '../api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uidb64 = searchParams.get('uidb64') || '';
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!uidb64 || !token) {
      setError('Invalid reset link. Missing parameters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/users/password-reset/confirm/', {
        uidb64,
        token,
        new_password: newPassword,
      });
      setSuccess(response.data.detail);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F3F4F6] p-6">
      <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-[#0000FE] mb-2 tracking-tight">
              New Password
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Please enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center text-green-500 mb-2">
                <CheckCircle size={48} />
              </div>
              <div className="p-4 bg-green-50 text-green-700 text-sm font-medium rounded-2xl border border-green-100 leading-relaxed">
                {success}
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center py-4 px-6 bg-[#0000FE] hover:opacity-90 text-white font-black text-lg rounded-2xl shadow-lg transition-all active:scale-[0.98]"
              >
                <span>Go to Login</span>
                <ChevronRight size={20} className="ml-1" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!uidb64 || !token ? (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">
                  Invalid reset link. Please request a new password reset link.
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="newPassword">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="New password (min. 8 characters)"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={!uidb64 || !token}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={!uidb64 || !token}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !uidb64 || !token}
                className="w-full flex items-center justify-center py-4 px-6 bg-[#0000FE] hover:opacity-90 text-white font-black text-lg rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ChevronRight size={20} className="ml-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="bg-slate-50 py-5 px-8 text-center border-t border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            © 2024 Headway College of Professional Studies
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

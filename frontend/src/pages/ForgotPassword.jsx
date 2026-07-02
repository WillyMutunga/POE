import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/users/password-reset/', {
        email,
        frontend_url: window.location.origin
      });
      setSuccess(response.data.detail);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F3F4F6] p-6">
      <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden animate-fade-in">
        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-[#0000FE] mb-2 tracking-tight">
              Reset Password
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Enter your email address to request a password reset.
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 text-green-700 text-sm font-medium rounded-2xl border border-green-100 leading-relaxed">
                {success}
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center py-4 px-6 bg-[#0000FE] hover:opacity-90 text-white font-black text-lg rounded-2xl shadow-lg transition-all active:scale-[0.98]"
              >
                <ChevronLeft size={20} className="mr-1" />
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center py-4 px-6 bg-[#0000FE] hover:opacity-90 text-white font-black text-lg rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <span>Send Link</span>
                      <ChevronRight size={20} className="ml-1" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center py-4 px-6 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-md rounded-2xl transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
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

export default ForgotPassword;

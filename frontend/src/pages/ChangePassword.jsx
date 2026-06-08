import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../api';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  
  const navigate = useNavigate();

  const validatePassword = (pass) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    if (pass.length < minLength) return "Password must be at least 8 characters long";
    if (!hasUpper || !hasLower) return "Password must contain both uppercase and lowercase letters";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecial) return "Password must contain at least one special character";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const strengthError = validatePassword(newPassword);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.put('/users/change-password/', {
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setSuccess(true);
      setTimeout(() => navigate('/setup-profile'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0000FE] mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Security Update</h1>
            <p className="text-slate-500 font-medium">Please set a strong password to secure your account.</p>
          </div>

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
                <CheckCircle size={48} />
              </div>
              <p className="text-xl font-bold text-slate-800">Password Updated!</p>
              <p className="text-slate-500">Redirecting to profile setup...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 8 chars, 1 uppercase, 1 symbol"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0000FE] transition-colors"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0000FE] transition-colors"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Password Requirements</p>
                <ul className="text-[10px] font-bold text-slate-500 space-y-1 list-disc ml-4">
                  <li>At least 8 characters long</li>
                  <li>Mix of uppercase & lowercase</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special symbol (!@#$%)</li>
                </ul>
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
                className="w-full flex items-center justify-center py-4 bg-[#0000FE] hover:bg-[#0000FE] text-white font-black text-lg rounded-2xl shadow-lg shadow-blue-50 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'Secure My Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;

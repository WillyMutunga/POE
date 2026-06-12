import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Loader2, CheckCircle, Save, Calendar, Hash } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    registration_number: '',
    cdacc_registration_number: '',
    course_display: '',
    semester_display: '',
    intake: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile/');
        setFormData(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    try {
      await api.patch('/users/profile/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        cdacc_registration_number: formData.cdacc_registration_number
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[#0000FE]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Profile</h1>
        <p className="text-slate-500 font-medium">Manage your personal information and contact details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Academic Info (Read-only) */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-[#0000FE] rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-100">
              <User size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-1">{formData.first_name || formData.username} {formData.last_name || ''}</h2>
            <p className="text-primary-600 font-bold uppercase text-xs tracking-widest mb-6">{formData.role || 'User'}</p>
            
            <div className="space-y-4">
              {formData.role === 'STUDENT' && (
                <div className="flex items-center gap-3 text-slate-600 animate-in slide-in-from-top-2">
                  <Hash size={18} className="text-slate-400" />
                  <span className="text-sm font-bold">{formData.registration_number || 'No Reg No.'}</span>
                </div>
              )}
              {formData.role === 'STUDENT' && formData.cdacc_registration_number && (
                <div className="flex items-center gap-3 text-slate-600 animate-in slide-in-from-top-2">
                  <Hash size={18} className="text-slate-400" />
                  <span className="text-sm font-bold">CDACC: {formData.cdacc_registration_number}</span>
                </div>
              )}
              {formData.intake && (
                <div className="flex items-center gap-3 text-slate-600 animate-in slide-in-from-top-2">
                  <Calendar size={18} className="text-slate-400" />
                  <span className="text-sm font-bold">{formData.intake} Intake</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={18} className="text-slate-400" />
                <span className="text-sm font-bold truncate">{formData.email}</span>
              </div>
            </div>
          </div>

          {['STUDENT', 'INSTRUCTOR'].includes(formData.role) && (
            <div className="bg-blue-900 p-8 rounded-3xl text-white shadow-xl shadow-blue-200 animate-in zoom-in-95">
              <h3 className="text-lg font-black mb-4">Academic Context</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-1">
                    {formData.role === 'INSTRUCTOR' ? 'Primary Department' : 'Course'}
                  </p>
                  <p className="font-bold leading-tight">{formData.course_display || (formData.role === 'INSTRUCTOR' ? 'General Faculty' : 'Not Assigned')}</p>
                </div>
                {formData.role === 'STUDENT' && (
                  <div>
                    <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-1">Current Semester</p>
                    <p className="font-bold">{formData.semester_display || 'Not Assigned'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.role === 'CDACC' && (
            <div className="bg-[#0000FE] p-8 rounded-3xl text-white shadow-xl shadow-blue-200 animate-in zoom-in-95">
              <h3 className="text-lg font-black mb-4">Auditor Privileges</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs font-bold text-blue-100">Institutional Review Access</p>
                </div>
                <p className="text-[10px] text-blue-300 leading-relaxed font-medium">
                  You have active authorization to audit portfolios and institutional records across all Level 5 and 6 programs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Editable Info */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium"
                  value={formData.phone_number || ''}
                  placeholder="+254 700 000000"
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                />
              </div>
            </div>

            {formData.role === 'STUDENT' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-sm font-bold text-slate-700 ml-1">CDACC Registration Number</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium"
                    value={formData.cdacc_registration_number || ''}
                    placeholder="Optional (e.g. CDACC/001)"
                    onChange={(e) => setFormData({...formData, cdacc_registration_number: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              {success && (
                <div className="flex items-center gap-2 text-green-600 font-bold animate-in fade-in slide-in-from-left-4">
                  <CheckCircle size={20} />
                  <span>Profile updated successfully!</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto flex items-center gap-3 px-8 py-4 bg-[#0000FE] hover:bg-[#0000FE] text-white font-black rounded-2xl shadow-lg shadow-blue-50 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Update Profile</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

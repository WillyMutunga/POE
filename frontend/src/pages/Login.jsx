import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { jwtDecode } from 'jwt-decode';
import { Lock, User, Loader2, ChevronRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(username, password);

    if (result.success) {
      // Decode the token again to get the latest info
      const token = localStorage.getItem('access_token');
      const user = jwtDecode(token);

      if (password === user.username || password === user.registration_number) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F3F4F6] p-6">
      <SEO 
        title="Login | Headway College POE Portal"
        description="Login to your Headway College Portfolio of Evidence (POE) account."
        keywords="Login Headway POE, Sign In Headway College POE"
      />
      {/* Centered Login Card */}
      <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-[#0000FE] mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-slate-500 font-medium">
              Log in to the POE Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0000FE] transition-colors"
                  size={20}
                />
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0000FE] transition-colors"
                  size={20}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl focus:border-[#0000FE] focus:ring-1 focus:ring-[#0000FE] focus:outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0000FE] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <span 
                  onClick={() => navigate('/forgot-password')} 
                  className="text-xs font-bold text-[#0000FE] hover:underline cursor-pointer transition-all hover:opacity-80"
                >
                  Forgot Password?
                </span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-4 px-6 bg-[#0000FE] hover:bg-[#0000FE] text-white font-black text-lg rounded-2xl shadow-lg shadow-blue-50 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-4"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ChevronRight size={20} className="ml-1" />
                </>
              )}
            </button>
          </form>
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

export default Login;

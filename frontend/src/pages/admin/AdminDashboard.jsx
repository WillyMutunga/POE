import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  Users, 
  UserCheck, 
  School, 
  FileText, 
  ArrowRight,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    total_instructors: 0,
    total_schools: 0,
    total_courses: 0,
    total_portfolios: 0,
    pending_evaluations: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/users/analytics/');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { 
      title: 'Total Students', 
      value: stats.total_students, 
      icon: Users, 
      color: 'blue',
      path: '/admin/users?role=STUDENT',
      description: 'Enrolled across all schools'
    },
    { 
      title: 'Total Instructors', 
      value: stats.total_instructors, 
      icon: UserCheck, 
      color: 'emerald',
      path: '/admin/users?role=INSTRUCTOR',
      description: 'Active faculty members'
    },
    { 
      title: 'Total Schools', 
      value: stats.total_schools, 
      icon: School, 
      color: 'purple',
      path: '/admin/academic',
      description: 'Academic departments'
    },
    { 
      title: 'Total Portfolios', 
      value: stats.total_portfolios, 
      icon: FileText, 
      color: 'red',
      path: '/admin/portfolios',
      description: 'Total student submissions'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <SEO title="Admin Dashboard" />
      <div className="flex flex-col">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">System Overview</h1>
        <p className="text-slate-500 font-medium text-lg">Centralized analytics and institutional management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(card.path)}
            className="bg-white p-8 rounded-[40px] shadow-xl shadow-slate-200/20 border border-slate-50 cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${card.color}-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500`}></div>
            
            <div className="flex flex-col gap-6 relative z-10">
              <div className={`w-14 h-14 bg-${card.color}-50 rounded-2xl flex items-center justify-center text-${card.color}-600 shadow-inner`}>
                <card.icon size={28} />
              </div>
              
              <div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{card.title}</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-black text-slate-800">{card.value}</h2>
                  <div className="flex items-center text-emerald-500 text-[10px] font-bold">
                    <TrendingUp size={12} className="mr-1" />
                    Live
                  </div>
                </div>
                <p className="text-slate-400 text-[10px] font-bold mt-2">{card.description}</p>
              </div>
              
              <div className={`flex items-center gap-2 text-${card.color}-600 font-black text-xs uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all duration-300`}>
                Manage Data <ArrowRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity or Quick Links */}
        <div className="bg-[#0000FE] rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <Shield className="mb-6 opacity-60" size={48} />
              <h3 className="text-3xl font-black mb-2">Security Control</h3>
              <p className="text-blue-200 font-medium mb-8">Maintain system integrity by managing user roles and permissions.</p>
            </div>
            <Link 
              to="/admin/users" 
              className="bg-white text-[#0000FE] px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all inline-block w-max"
            >
              System Audit
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800">Pending Actions</h3>
              <div className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} /> Priority
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Submissions Waiting</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Requires Instructor Review</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-slate-800">{stats.pending_evaluations}</span>
              </div>
            </div>
          </div>
          <Link 
            to="/evaluation" 
            className="mt-8 flex items-center justify-center gap-2 px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all"
          >
            Monitor Evaluations <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

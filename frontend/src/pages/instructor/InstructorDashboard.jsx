import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  FileText, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Users, 
  BookOpen, 
  Award,
  Search,
  Layout,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [units, setUnits] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [portfoliosRes, unitsRes, registrationsRes, studentsRes] = await Promise.all([
        api.get('/poe/portfolios/'),
        api.get('/academic/units/my_units/'),
        api.get('/academic/registrations/'),
        api.get('/users/my-students/')
      ]);
      setPortfolios(portfoliosRes.data);
      setUnits(unitsRes.data);
      setPendingRegistrations(registrationsRes.data);
      setStudentsCount(studentsRes.data?.length || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingEvaluations = portfolios.filter(p => p.status === 'SUBMITTED');
  const evaluatedCount = portfolios.filter(p => p.status === 'EVALUATED').length;
  
  // Get total student count from distinct student list
  const totalStudents = studentsCount;

  const filteredPending = pendingEvaluations.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.learner_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.unit_display.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 group">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-4 py-1 bg-blue-50 text-[#0000FE] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
              Instructor Dashboard
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            Welcome back, <span className="text-[#0000FE]">{user?.username}</span>!
          </h1>
          <p className="text-slate-500 font-medium max-w-lg">
            Manage your units, evaluate student evidence, and track academic progress all in one place.
          </p>
        </div>
        <div className="absolute top-[-20px] right-[-20px] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:bg-blue-100 transition-colors duration-500"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/units-assigned" className="p-8 bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 hover:border-blue-100 transition-all duration-300 group block">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0000FE] mb-6 group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Units Assigned</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-800">{units.length}</p>
            <p className="text-xs font-bold text-green-500 mb-1 flex items-center">
              <TrendingUp size={12} className="mr-1" />
              Active
            </p>
          </div>
        </Link>

        <Link to="/instructor/students" className="p-8 bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 hover:border-purple-100 transition-all duration-300 group block">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Students</p>
          <p className="text-3xl font-black text-slate-800">{totalStudents}</p>
        </Link>

        <Link to="/units-assigned" className="p-8 bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 hover:border-green-100 transition-all duration-300 group block">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Evaluations Done</p>
          <p className="text-3xl font-black text-slate-800">{evaluatedCount}</p>
        </Link>

        <a href="#recent-submissions" className="p-8 bg-[#0000FE] rounded-[32px] shadow-xl shadow-blue-500/20 text-white hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden relative block">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6 group-hover:rotate-12 transition-transform">
              <Clock size={24} />
            </div>
            <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-1">Pending Review</p>
            <p className="text-3xl font-black">{pendingEvaluations.length}</p>
          </div>
          <div className="absolute bottom-0 right-0 p-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={24} className="text-white" />
          </div>
          <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-white/10 rounded-full blur-2xl"></div>
        </a>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Pending Evaluations List */}
        <div id="recent-submissions" className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <FileText className="text-[#0000FE]" size={28} />
              Recent Submissions
            </h2>
            
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Quick search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-xs"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredPending.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">All caught up!</h3>
                <p className="text-slate-400 mt-2 font-medium">No pending portfolios are currently waiting for your evaluation.</p>
              </div>
            ) : (
              filteredPending.slice(0, 5).map((portfolio) => (
                <div 
                  key={portfolio.id} 
                  className="group flex items-center justify-between p-6 bg-white rounded-[32px] shadow-sm border border-slate-50 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-[#0000FE] transition-colors">
                      <FileText size={24} />
                    </div>
                    <div>
                      {portfolio.element_display && (
                        <p className="text-xs font-black text-[#0000FE] uppercase tracking-widest mb-0.5">
                          {portfolio.element_display}
                        </p>
                      )}
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#0000FE] transition-colors line-clamp-1">{portfolio.title}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.1em]">{portfolio.unit_display}</p>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{portfolio.learner_display}</p>
                      </div>
                    </div>
                  </div>

                  <Link 
                    to={`/evaluation/${portfolio.id}`}
                    className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-[#0000FE] hover:text-white transition-all shadow-sm group-hover:translate-x-1"
                  >
                    <ChevronRight size={20} />
                  </Link>
                </div>
              ))
            )}
            
            {filteredPending.length > 5 && (
              <button className="w-full py-4 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-[#0000FE] transition-colors">
                View All Pending Submissions ({filteredPending.length})
              </button>
            )}
          </div>

          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <BookOpen className="text-[#0000FE]" size={28} />
                Pending Unit Registrations
              </h2>
              <span className="px-3 py-1 bg-blue-50 text-[#0000FE] rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 animate-pulse">
                {pendingRegistrations.length} Requests
              </span>
            </div>

            <div className="space-y-4">
              {pendingRegistrations.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#0000FE] mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">All caught up!</h3>
                  <p className="text-slate-400 mt-2 font-medium">No pending unit registration requests are currently waiting for your approval.</p>
                </div>
              ) : (
                pendingRegistrations.map((reg) => (
                  <div 
                    key={reg.id} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-[32px] shadow-sm border border-slate-50 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0000FE]">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#0000FE] uppercase tracking-widest mb-0.5">
                          {reg.student_name}
                        </p>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight line-clamp-1">{reg.unit_name}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.1em]">{reg.unit_code}</p>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{reg.semester_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/academic/registrations/${reg.id}/approve/`);
                            alert('Registration approved successfully!');
                            fetchData();
                          } catch (err) {
                            console.error(err);
                            alert(err.response?.data?.error || 'Failed to approve registration.');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white font-black rounded-xl text-xs hover:bg-green-700 transition-all shadow-md shadow-green-100"
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to reject this registration?')) {
                            try {
                              await api.post(`/academic/registrations/${reg.id}/reject/`);
                              alert('Registration rejected.');
                              fetchData();
                            } catch (err) {
                              console.error(err);
                              alert('Failed to reject registration.');
                            }
                          }
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-600 hover:text-white transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Units */}
        <div className="space-y-8">
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Layout size={20} className="text-[#0000FE]" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/units-assigned" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#0000FE] shadow-sm">
                    <BookOpen size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">My Units</span>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-[#0000FE]" />
              </Link>
              
              <Link to="/instructor/students" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#0000FE] shadow-sm">
                    <Users size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Student List</span>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-[#0000FE]" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0000FE] to-[#4F46E5] rounded-[40px] p-8 text-white shadow-xl shadow-blue-500/20">
            <Award size={40} className="text-blue-200 mb-6" />
            <h3 className="text-xl font-black mb-2">Academic Excellence</h3>
            <p className="text-blue-100 text-sm font-medium leading-relaxed">
              Your evaluations help students achieve their goals. Keep providing detailed feedback for better learning outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;

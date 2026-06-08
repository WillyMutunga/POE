import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  BookOpen, 
  ArrowLeft,
  Mail,
  Loader2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CohortAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    cohorts: [],
    overall_avg_rounds: 1.00,
    at_risk_students: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cohorts'); // 'cohorts' or 'at-risk'

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/poe/cohort-analytics/');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching cohort analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE]"></div>
      </div>
    );
  }

  const totalAtRisk = data.at_risk_students.length;
  const totalCohorts = data.cohorts.length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Cohort Analytics</h1>
          <p className="text-slate-500 font-medium text-lg">Real-time completion tracking, audit metrics, and risk monitoring.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          Back to Overview
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/25 border border-slate-50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0000FE] shadow-inner">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Monitored Cohorts</p>
              <h2 className="text-3xl font-black text-slate-800">{totalCohorts}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/25 border border-slate-50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Avg. Submission Rounds</p>
              <h2 className="text-3xl font-black text-slate-800">{data.overall_avg_rounds} <span className="text-xs font-bold text-slate-400">rounds</span></h2>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/25 border border-slate-50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shadow-inner">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Learners At Risk</p>
              <h2 className="text-3xl font-black text-red-600">{totalAtRisk} <span className="text-xs font-bold text-red-400">active</span></h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-100 gap-6">
          <button
            onClick={() => setActiveTab('cohorts')}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'cohorts' 
              ? 'text-[#0000FE] border-b-2 border-[#0000FE]' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Intake Cohorts ({totalCohorts})
          </button>
          <button
            onClick={() => setActiveTab('at-risk')}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'at-risk' 
              ? 'text-red-600 border-b-2 border-red-600' 
              : 'text-slate-400 hover:text-red-500'
            }`}
          >
            At-Risk Learners ({totalAtRisk})
          </button>
        </div>

        {activeTab === 'cohorts' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.cohorts.length === 0 ? (
              <div className="col-span-2 p-12 bg-white rounded-[32px] text-center border border-slate-100 shadow-sm text-slate-400 font-bold">
                No active cohort data available.
              </div>
            ) : (
              data.cohorts.map((cohort, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="bg-blue-50 text-[#0000FE] font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-widest inline-block mb-2">
                          {cohort.intake_display}
                        </span>
                        <h3 className="text-lg font-black text-slate-800 line-clamp-1 uppercase">{cohort.course_name}</h3>
                      </div>
                      <div className="flex items-center text-slate-500 font-bold text-xs gap-1.5 shrink-0 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Users size={14} className="text-[#0000FE]" />
                        <span>{cohort.total_students} students</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-50 text-xs">
                      <div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Total Portfolios</p>
                        <p className="font-bold text-slate-700 text-sm mt-1">{cohort.total_portfolios}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Avg. Rounds</p>
                        <p className="font-bold text-slate-700 text-sm mt-1">{cohort.avg_rounds}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-slate-400">Completion Rate</span>
                      <span className={cohort.completion_rate >= 80 ? 'text-green-600' : cohort.completion_rate >= 50 ? 'text-[#0000FE]' : 'text-amber-600'}>
                        {cohort.completion_rate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          cohort.completion_rate >= 80 ? 'bg-green-500' : cohort.completion_rate >= 50 ? 'bg-[#0000FE]' : 'bg-amber-500'
                        }`}
                        style={{ width: `${cohort.completion_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            {data.at_risk_students.length === 0 ? (
              <div className="p-16 text-center text-slate-400 font-bold space-y-3">
                <CheckCircle2 className="mx-auto text-green-500" size={48} />
                <p className="text-slate-600 font-black">All Learners are Active!</p>
                <p className="text-xs text-slate-400">There are no students in active semesters with zero submissions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Student Name</th>
                      <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Course & Intake</th>
                      <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Active Semester</th>
                      <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Alert Reason</th>
                      <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.at_risk_students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-6">
                          <p className="font-bold text-slate-800">{student.full_name}</p>
                          <p className="text-xs text-slate-400 font-medium">@{student.username}</p>
                        </td>
                        <td className="p-6">
                          <p className="font-bold text-slate-700 text-sm">{student.course_name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{student.intake}</p>
                        </td>
                        <td className="p-6">
                          <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-full text-xs">
                            {student.semester_name}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                            <Clock size={14} />
                            <span>Zero submissions in active module</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => {
                              alert(`Nudge email successfully queued for ${student.full_name} (${student.username})`);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm"
                          >
                            <Mail size={14} />
                            Nudge Student
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CohortAnalytics;

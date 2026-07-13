import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  BookOpen, 
  Lock, 
  Search, 
  ArrowUpDown, 
  ChevronRight,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import OnlineExamModal from '../../components/OnlineExamModal';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [user, setUser] = useState(null);

  // Filter & UI States
  const [activeTab, setActiveTab] = useState('All Units');
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'code', 'progress'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  const [pendingExams, setPendingExams] = useState([]);
  const [showExamModal, setShowExamModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingExams();
  }, []);

  const fetchPendingExams = async () => {
    try {
      const response = await api.get('/academic/online-exams/my-pending/');
      setPendingExams(response.data);
    } catch (err) {
      console.error('Error fetching pending exams:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [unitsRes, profileRes, portfoliosRes] = await Promise.all([
        api.get('/academic/units/'),
        api.get('/users/profile/'),
        api.get('/poe/portfolios/')
      ]);
      setUnits(unitsRes.data);
      setUser(profileRes.data);
      setPortfolios(portfoliosRes.data);
    } catch (error) {
      console.error('Error fetching student dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine status category of a unit
  const getUnitStatus = (unit) => {
    // If unit is locked
    if (unit.is_locked) {
      return 'Locked';
    }

    const unitPortfolios = portfolios.filter(p => p.unit === unit.id);
    const allEvaluated = unitPortfolios.length > 0 && unitPortfolios.every(p => p.status === 'EVALUATED');

    if (allEvaluated && unit.overall_progress === 100) {
      return 'Complete';
    }

    const hasPending = unitPortfolios.some(p => p.status === 'SUBMITTED');
    if (hasPending) {
      return 'Pending Review';
    }
    // Active (unlocked) units are considered In Progress
    return 'In Progress';
  };

  // Filter units list based on active tab, search, and session
  const getFilteredUnits = () => {
    let result = [...units];

    // Filter by Session Dropdown
    if (sessionFilter !== 'ALL') {
      result = result.filter(u => u.semester_name === sessionFilter);
    }

    // Filter by Search term
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.code.toLowerCase().includes(query)
      );
    }

    // Filter by Tab
    if (activeTab === 'In Progress') {
      result = result.filter(u => getUnitStatus(u) === 'In Progress');
    } else if (activeTab === 'Complete') {
      result = result.filter(u => getUnitStatus(u) === 'Complete');
    } else if (activeTab === 'Pending Review') {
      result = result.filter(u => getUnitStatus(u) === 'Pending Review');
    } else if (activeTab === 'Locked') {
      result = result.filter(u => getUnitStatus(u) === 'Locked');
    }

    // Sort units
    result.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (sortBy === 'progress') {
        valA = a.overall_progress || 0;
        valB = b.overall_progress || 0;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });

    return result;
  };

  const handleSortToggle = () => {
    if (sortBy === 'name') {
      setSortBy('progress');
      setSortOrder('desc'); // Sort high to low progress by default
    } else if (sortBy === 'progress') {
      setSortBy('code');
      setSortOrder('asc');
    } else {
      setSortBy('name');
      setSortOrder('asc');
    }
  };

  const filteredUnits = getFilteredUnits();

  // Tab counts
  const inProgressCount = units.filter(u => getUnitStatus(u) === 'In Progress').length;
  const completeCount = units.filter(u => getUnitStatus(u) === 'Complete').length;
  const pendingCount = units.filter(u => getUnitStatus(u) === 'Pending Review').length;
  const lockedCount = units.filter(u => getUnitStatus(u) === 'Locked').length;

  // List of unique semesters for Session filter
  const semesterNames = Array.from(new Set(units.map(u => u.semester_name))).filter(Boolean);

  const handlePoEActionClick = (unit) => {
    if (unit.is_locked) {
      alert("This unit is locked because you are not currently studying it.");
      return;
    }
    navigate(`/portfolios/new?unit=${unit.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="My Units" />

      {/* Pending Exams Banner */}
      {pendingExams && pendingExams.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[28px] text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Active Online Exam Pending!</h2>
              <p className="text-white/85 text-xs font-bold mt-1">
                You are registered for: <span className="underline font-black">{pendingExams[0].exam_title}</span> ({pendingExams[0].exam_class}). Duration: {pendingExams[0].exam_duration} mins.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowExamModal(true)}
            className="w-full md:w-auto px-6 py-3 bg-white text-blue-600 hover:bg-slate-50 font-black rounded-xl text-xs uppercase tracking-wider transition-all shrink-0 active:scale-95 shadow"
          >
            Start Exam Now
          </button>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Browse Unit</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Explore and manage your programme units</p>
        </div>
        
        {/* Session Filter Dropdown */}
        <div className="bg-white px-4 py-2 border border-slate-200 rounded-2xl flex items-center gap-2 shadow-xs shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Session</span>
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="bg-transparent font-bold text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">ALL</option>
            {semesterNames.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Curriculum Summary Header Card */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-[#0000FE] rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{user?.course_name || 'Software Development'}</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">
              Course Level: {user?.course_level_display || 'Level 6'}
            </p>
          </div>
        </div>

        {/* Search & Sort Controls Row */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
          <div className="flex-1 md:w-64 relative min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search units, codes, or elements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSortToggle}
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-all flex items-center gap-2 shrink-0 active:scale-95"
          >
            <ArrowUpDown size={14} />
            Sort
          </button>
        </div>
      </div>

      {/* Category Tabs Row */}
      <div className="bg-white p-2 rounded-[22px] border border-slate-100 shadow-sm flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('All Units')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'All Units' 
              ? 'bg-[#0000FE] text-white shadow-md shadow-blue-500/10' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          All Units ({units.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('In Progress')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'In Progress' 
              ? 'bg-[#0000FE] text-white shadow-md shadow-blue-500/10' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Complete')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Complete' 
              ? 'bg-[#0000FE] text-white shadow-md shadow-blue-500/10' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          Complete ({completeCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Pending Review')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Pending Review' 
              ? 'bg-[#0000FE] text-white shadow-md shadow-blue-500/10' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          Pending Review ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Locked')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Locked' 
              ? 'bg-[#0000FE] text-white shadow-md shadow-blue-500/10' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          Locked ({lockedCount})
        </button>
      </div>

      {/* Showing entries label */}
      <div className="flex justify-between items-center px-2">
        <span className="text-slate-400 text-xs font-bold">
          Showing {filteredUnits.length} units
        </span>
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
          Sort by: {sortBy === 'progress' ? 'Progress (High to Low)' : sortBy === 'code' ? 'Code (A-Z)' : 'Name (A-Z)'}
        </span>
      </div>

      {/* Units Grid */}
      {filteredUnits.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 shadow-inner">
            <BookOpen size={32} />
          </div>
          <h4 className="text-lg font-black text-slate-700">No Units Found</h4>
          <p className="text-slate-400 text-xs font-bold max-w-sm">
            There are no units registered or available matching this tab category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredUnits.map((unit) => {
            const isUnitLocked = unit.is_locked;
            const progressPct = unit.overall_progress || 0;

            return (
              <div 
                key={unit.id}
                className={`group bg-white rounded-[32px] p-6 shadow-sm border transition-all duration-500 relative overflow-hidden flex flex-col justify-between min-h-[340px] ${
                  isUnitLocked 
                    ? 'border-slate-100/60 opacity-95' 
                    : 'border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5'
                }`}
              >
                {/* Locked background cutout */}
                {isUnitLocked && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 shrink-0"></div>
                )}
                {!isUnitLocked && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/40 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-50 shrink-0"></div>
                )}

                <div className="relative space-y-5">
                  {/* Card top row */}
                  <div className="flex justify-between items-start">
                    <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                      <TrendingUp size={22} />
                    </div>
                    {isUnitLocked ? (
                      <span className="px-2.5 py-1 bg-red-50 text-red-500 font-bold rounded-lg text-[9px] uppercase tracking-wider border border-red-100/50 flex items-center gap-1">
                        <Lock size={10} />
                        Locked
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 font-bold rounded-lg text-[9px] uppercase tracking-wider border border-green-100/50">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Code & Name Semester */}
                  <div>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block mb-1">
                      {unit.semester_name || 'Semester'}
                    </span>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1" title={unit.code}>
                      {unit.code}
                    </h3>
                    <h4 className="text-xs font-bold text-slate-500 mt-0.5 line-clamp-2 h-8 leading-tight">
                      {unit.name}
                    </h4>
                  </div>

                  {/* Progress section */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-baseline text-[10px] font-bold uppercase">
                      <span className="text-slate-400">Overall Progress</span>
                      <span className="text-slate-700 font-black">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#0000FE] h-full rounded-full" style={{ width: `${progressPct}%` }}></div>
                    </div>
                  </div>

                  {/* Indicators stats row */}
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-4 text-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Theory</span>
                      <span className="text-xs font-black text-slate-700 block mt-0.5">{unit.theory_count || '0/0'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Practical</span>
                      <span className="text-xs font-black text-slate-700 block mt-0.5">{unit.practical_count || '0/0'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Oral</span>
                      <span className="text-xs font-black text-slate-700 block mt-0.5">{unit.oral_count || '0/0'}</span>
                    </div>
                  </div>
                </div>

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => handlePoEActionClick(unit)}
                  className={`w-full mt-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-center transition-all ${
                    isUnitLocked
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-[#0000FE] text-white hover:bg-blue-700 shadow-sm shadow-blue-500/10 active:scale-95'
                  }`}
                >
                  Upload PoE
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Online Exam Modal */}
      {showExamModal && pendingExams && pendingExams.length > 0 && (
        <OnlineExamModal
          examId={pendingExams[0].exam}
          examTitle={pendingExams[0].exam_title}
          examClass={pendingExams[0].exam_class}
          examDuration={pendingExams[0].exam_duration}
          onClose={() => {
            setShowExamModal(false);
            fetchPendingExams();
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboard;

import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  Users, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import SEO from '../../components/SEO';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_students: 0,
    total_trainees: 0,
    poe_submitted: 0,
    poe_submitted_pct: 0,
    poe_approved: 0,
    poe_approved_pct: 0,
    poe_pending_approval: 0,
    poe_pending_approval_pct: 0,
    poe_pending_submission: 0,
    poe_pending_submission_pct: 0
  });
  const [trends, setTrends] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    levels: [],
    programmes: [],
    semesters: []
  });

  // Filters State
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [series, setSeries] = useState('July/August 2026');

  // UI State
  const [expandedProgrammes, setExpandedProgrammes] = useState({});
  const [sortByProgress, setSortByProgress] = useState(false);
  const [trendDays, setTrendDays] = useState(30); // 7, 30

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDepartment, selectedLevel, selectedProgramme, searchTerm]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedLevel) params.level = selectedLevel;
      if (selectedProgramme) params.course = selectedProgramme;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/poe/poe-management-analytics/', { params });
      const { stats, trends, albums, programmes, filter_options } = response.data;
      
      setStats(stats);
      setTrends(trends);
      setAlbums(albums);
      setProgrammes(programmes);
      if (filter_options) {
        setFilterOptions({
          departments: filter_options.departments || [],
          levels: filter_options.levels || [],
          programmes: filter_options.programmes || [],
          semesters: filter_options.semesters || []
        });

        const sems = filter_options.semesters || [];
        if (sems.length > 0) {
          const names = sems.map(s => s.name);
          if (series === 'July/August 2026' && !names.includes('July/August 2026')) {
            setSeries(sems[0].name);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedDepartment('');
    setSelectedLevel('');
    setSelectedProgramme('');
    setSearchTerm('');
  };

  const toggleExpandProgramme = (id) => {
    setExpandedProgrammes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExpandAll = () => {
    const allExpanded = {};
    programmes.forEach(p => {
      allExpanded[p.id] = true;
    });
    setExpandedProgrammes(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedProgrammes({});
  };

  // Sort programmes
  const displayedProgrammes = [...programmes].sort((a, b) => {
    if (sortByProgress) {
      return b.progress - a.progress;
    }
    return a.name.localeCompare(b.name);
  });

  // Calculate chart metrics for Line Chart
  const activeTrends = trends.slice(-trendDays);
  const maxTrendVal = Math.max(...activeTrends.map(t => Math.max(t.Submitted, t.Approved, t.Pending)), 10);

  // SVG Line Chart dimension parameters
  const chartW = 550;
  const chartH = 180;
  const paddingX = 40;
  const paddingY = 20;

  const getCoordinates = (points, key) => {
    if (points.length === 0) return '';
    return points.map((p, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * (chartW - 2 * paddingX);
      const y = chartH - paddingY - (p[key] / maxTrendVal) * (chartH - 2 * paddingY);
      return `${x},${y}`;
    }).join(' ');
  };

  // SVG Doughnut Chart parameters
  const totalAlbumPortfolios = albums.reduce((sum, item) => sum + item.count, 0);
  const colors = ['#0000FE', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#6366F1'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SEO title="POE Management" />

      {/* Header View */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">POE Management</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage Portfolios of Evidence across all programmes</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0000FE]/20 cursor-pointer"
          >
            {filterOptions.semesters && filterOptions.semesters.length > 0 ? (
              filterOptions.semesters.map(sem => (
                <option key={sem.id} value={sem.name}>{sem.name}</option>
              ))
            ) : (
              <>
                <option value="July/August 2026">July/August 2026</option>
                <option value="Jan/Feb 2026">Jan/Feb 2026</option>
                <option value="May/June 2026">May/June 2026</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Filters View Row */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 mr-2">
          <SlidersHorizontal size={18} />
          <span className="text-xs font-black uppercase tracking-wider">Filters</span>
        </div>

        {/* Department Dropdown */}
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="flex-1 min-w-[160px] px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
        >
          <option value="">Select Department</option>
          {filterOptions.departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Level Dropdown */}
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="flex-1 min-w-[140px] px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
        >
          <option value="">Select Level</option>
          {filterOptions.levels.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        {/* Programme Dropdown */}
        <select
          value={selectedProgramme}
          onChange={(e) => setSelectedProgramme(e.target.value)}
          className="flex-1 min-w-[160px] px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
        >
          <option value="">Select Programme</option>
          {filterOptions.programmes.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Search Input */}
        <div className="flex-2 min-w-[240px] relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search programmes and Albums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs focus:outline-none"
          />
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleResetFilters}
          className="px-4 py-3 text-slate-500 hover:text-[#0000FE] font-black text-xs transition-all flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Reset Filters
        </button>
      </div>

      {/* Overview stats cards Group */}
      <div className="bg-slate-50/50 p-6 rounded-[36px] border border-slate-100 space-y-6">
        <div>
          <span className="text-[10px] font-black text-[#0000FE] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
            Series - 2025/2026
          </span>
          <h2 className="text-xl font-black text-slate-800 tracking-tight mt-3">Overview</h2>
          <p className="text-slate-400 text-xs font-bold">Global statistics across all programmes and Albums</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Card 1: All Students */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">All Students</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.total_students || stats.total_trainees}</h3>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0000FE]">
                <Users size={18} />
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0000FE] h-full w-full rounded-full"></div>
            </div>
          </div>

          {/* Card 2: POE Submitted */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">POE Submitted</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-black text-slate-800">{stats.poe_submitted}</h3>
                  <span className="text-xs font-black text-emerald-600">{stats.poe_submitted_pct}%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <FileText size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.poe_submitted_pct}%` }}></div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">submission rate</p>
            </div>
          </div>

          {/* Card 3: POE Approved */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">POE Approved</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-black text-slate-800">{stats.poe_approved}</h3>
                  <span className="text-xs font-black text-emerald-600">{stats.poe_approved_pct}%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.poe_approved_pct}%` }}></div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">approval rate</p>
            </div>
          </div>

          {/* Card 4: POE Pending Approval */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">POE Pending Approval</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-black text-slate-800">{stats.poe_pending_approval}</h3>
                  <span className="text-xs font-black text-amber-600">{stats.poe_pending_approval_pct}%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                <Clock size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.poe_pending_approval_pct}%` }}></div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">processing time</p>
            </div>
          </div>

          {/* Card 5: POE Pending Submission */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">POE Pending Submission</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-black text-slate-800">{stats.poe_pending_submission}</h3>
                  <span className="text-xs font-black text-red-600">{stats.poe_pending_submission_pct}%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${stats.poe_pending_submission_pct}%` }}></div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">not submitted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1 & 2: Submission Trends Line Chart */}
        <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-800">Submission Trends</h3>
              <p className="text-slate-400 text-xs font-bold">PoE generation and approval activity over time</p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setTrendDays(7)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  trendDays === 7 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setTrendDays(30)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  trendDays === 30 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                30D
              </button>
            </div>
          </div>

          <div className="relative">
            {activeTrends.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-slate-300 font-bold text-xs italic">
                No trend data available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto select-none">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                    const y = paddingY + val * (chartH - 2 * paddingY);
                    const gridLabel = Math.round(maxTrendVal * (1 - val));
                    return (
                      <g key={idx}>
                        <line 
                          x1={paddingX} 
                          y1={y} 
                          x2={chartW - paddingX} 
                          y2={y} 
                          stroke="#F1F5F9" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4"
                        />
                        <text 
                          x={paddingX - 10} 
                          y={y + 4} 
                          textAnchor="end" 
                          fill="#94A3B8" 
                          fontSize="9" 
                          fontWeight="bold"
                        >
                          {gridLabel}
                        </text>
                      </g>
                    );
                  })}

                  {/* Trend Lines */}
                  <polyline
                    fill="none"
                    stroke="#0000FE"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getCoordinates(activeTrends, 'Submitted')}
                  />
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getCoordinates(activeTrends, 'Approved')}
                  />
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getCoordinates(activeTrends, 'Pending')}
                  />

                  {/* Date labels under chart */}
                  {activeTrends.filter((_, i) => i % (trendDays === 30 ? 6 : 1) === 0).map((t, idx, arr) => {
                    // Find actual index in original points array
                    const originalIdx = trends.slice(-trendDays).indexOf(t);
                    const x = paddingX + (originalIdx / (activeTrends.length - 1)) * (chartW - 2 * paddingX);
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={chartH - 2}
                        textAnchor="middle"
                        fill="#94A3B8"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {t.date}
                      </text>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Legend Row */}
          <div className="flex gap-6 justify-center pt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#0000FE] rounded-full"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase">Submitted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#10B981] rounded-full"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#F59E0B] rounded-full"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase">Pending</span>
            </div>
          </div>
        </div>

        {/* Column 3: Albums Distribution Doughnut Chart */}
        <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">Albums Distribution</h3>
            <p className="text-slate-400 text-xs font-bold">PoE counts segmented by programme/course</p>
          </div>

          <div className="relative flex justify-center py-4">
            {albums.length === 0 ? (
              <div className="h-[140px] flex items-center justify-center text-slate-300 font-bold text-xs italic">
                No album distribution data.
              </div>
            ) : (
              <svg width="150" height="150" viewBox="0 0 120 120" className="select-none">
                {/* Segmented Circles */}
                {(() => {
                  let accumPercentage = 0;
                  return albums.map((item, idx) => {
                    const pct = (item.count / totalAlbumPortfolios) * 100;
                    const r = 45;
                    const C = 2 * Math.PI * r;
                    const strokeLen = (pct / 100) * C;
                    const strokeOffset = C - strokeLen + (accumPercentage / 100) * C;
                    accumPercentage += pct;

                    return (
                      <circle
                        key={idx}
                        cx="60"
                        cy="60"
                        r={r}
                        fill="transparent"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="16"
                        strokeDasharray={`${strokeLen} ${C - strokeLen}`}
                        strokeDashoffset={-strokeOffset}
                        transform="rotate(-90 60 60)"
                      />
                    );
                  });
                })()}
                {/* Inner white cutout circle to make it a doughnut */}
                <circle cx="60" cy="60" r="30" fill="white" />
                <text x="60" y="62" textAnchor="middle" fill="#1E293B" fontSize="9" fontWeight="black">
                  {totalAlbumPortfolios}
                </text>
                <text x="60" y="72" textAnchor="middle" fill="#94A3B8" fontSize="7" fontWeight="bold" className="uppercase">
                  PoEs
                </text>
              </svg>
            )}
          </div>

          {/* Custom Legends list */}
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {albums.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                  <span className="font-bold text-slate-600 truncate">{item.name}</span>
                </div>
                <span className="font-black text-slate-800 ml-3">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Programme Overview Accordion List */}
      <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-xl font-black text-slate-800">Programme Overview</h3>
            <p className="text-slate-400 text-xs font-bold">Progress tracking and status metrics per course and unit</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSortByProgress(!sortByProgress)}
              className={`px-4 py-2 border rounded-xl text-xs font-black transition-all ${
                sortByProgress 
                  ? 'bg-[#0000FE] border-[#0000FE] text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Sort by Progress
            </button>
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all"
            >
              Collapse All
            </button>
          </div>
        </div>

        {displayedProgrammes.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <BookOpen className="mx-auto text-slate-200 mb-4" size={48} />
            <h4 className="text-lg font-bold text-slate-700">No Programmes Found</h4>
            <p className="text-slate-400 text-sm mt-1">No programmes match the selected filters or search terms.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedProgrammes.map(prog => {
              const isExpanded = !!expandedProgrammes[prog.id];

              return (
                <div 
                  key={prog.id} 
                  className={`border rounded-2xl transition-all duration-300 ${
                    isExpanded ? 'border-blue-200 bg-blue-50/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Header Row */}
                  <div 
                    onClick={() => toggleExpandProgramme(prog.id)}
                    className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 cursor-pointer select-none"
                  >
                    <div className="flex-1 space-y-1">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded text-[9px] uppercase tracking-wider">
                        {prog.level || 'Level'}
                      </span>
                      <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">{prog.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">Students enrolled: <span className="font-bold text-slate-700">{prog.total_trainees}</span></p>
                    </div>

                    {/* Progress Bar Column */}
                    <div className="w-full lg:w-48 space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase">
                        <span className="text-slate-400">Approved</span>
                        <span className="text-[#0000FE]">{prog.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#0000FE] h-full rounded-full" style={{ width: `${prog.progress}%` }}></div>
                      </div>
                    </div>

                    {/* Numbers Breakdown */}
                    <div className="flex flex-wrap gap-4 text-xs font-black uppercase text-slate-500">
                      <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-100/50">
                        <span className="text-slate-400 text-[9px] block">Submitted</span>
                        <span className="text-slate-800 text-sm">{prog.submitted}</span>
                      </div>
                      <div className="px-3.5 py-2 bg-emerald-50 rounded-xl border border-emerald-100/30">
                        <span className="text-emerald-500 text-[9px] block">Approved</span>
                        <span className="text-emerald-700 text-sm">{prog.approved}</span>
                      </div>
                      <div className="px-3.5 py-2 bg-amber-50 rounded-xl border border-amber-100/30">
                        <span className="text-amber-500 text-[9px] block">Pending App</span>
                        <span className="text-amber-700 text-sm">{prog.pending_approval}</span>
                      </div>
                      <div className="px-3.5 py-2 bg-red-50 rounded-xl border border-red-100/30">
                        <span className="text-red-500 text-[9px] block">Pending Sub</span>
                        <span className="text-red-700 text-sm">{prog.pending_submission}</span>
                      </div>
                    </div>

                    <div className="text-slate-400 shrink-0">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Expanded Content: Units List */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-slate-100/50 pt-4 bg-slate-50/20 rounded-b-2xl">
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 ml-1">Units breakdown</h5>
                      <div className="space-y-3">
                        {prog.units.length === 0 ? (
                          <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl text-center">No units assigned to this curriculum yet.</p>
                        ) : (
                          prog.units.map(unit => (
                            <div key={unit.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                              <div className="min-w-0 flex-1">
                                <h6 className="text-xs font-black text-slate-800 leading-tight">{unit.name}</h6>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{unit.code} • {unit.semester_name}</p>
                              </div>

                              {/* Unit metrics breakdown */}
                              <div className="flex gap-4 text-[10px] font-bold shrink-0">
                                <div className="text-slate-500">
                                  Total: <span className="font-black text-slate-800">{unit.total}</span>
                                </div>
                                <div className="text-slate-500">
                                  Submitted: <span className="font-black text-slate-800">{unit.submitted}</span>
                                </div>
                                <div className="text-slate-500">
                                  Approved: <span className="font-black text-green-600">{unit.approved}</span>
                                </div>
                                <div className="text-slate-500">
                                  Pending App: <span className="font-black text-amber-600">{unit.pending_approval}</span>
                                </div>
                                <div className="text-slate-500">
                                  Pending Sub: <span className="font-black text-red-500">{unit.pending_submission}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => window.location.assign(`/admin/academic#unit-${unit.id}`)}
                                className="px-3.5 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-[#0000FE] border border-slate-200/60 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all"
                              >
                                View Unit
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

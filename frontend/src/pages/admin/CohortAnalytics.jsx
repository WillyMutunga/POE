import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  Folder, 
  CheckCircle2, 
  Menu, 
  XCircle, 
  Search, 
  Download, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

const CohortAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data from backend
  const [metrics, setMetrics] = useState({
    total_reports: 0,
    approved_reports: 0,
    pending_workflow: 0,
    declined_reports: 0
  });
  const [allReports, setAllReports] = useState([]);
  
  // UI & Filtering state
  const [activeTab, setActiveTab] = useState('All Files');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSession, setFilterSession] = useState('');

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/poe/reports-analytics/');
      setMetrics(response.data.metrics);
      setAllReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter reports
  const getFilteredReports = () => {
    let result = [...allReports];

    // Filter by Tab
    if (activeTab === 'Approved') {
      result = result.filter(r => r.status === 'EVALUATED');
    } else if (activeTab === 'Declined') {
      result = result.filter(r => r.status === 'REDO');
    } else if (activeTab === 'In Work Flow') {
      result = result.filter(r => r.status === 'SUBMITTED');
    } else if (['Attendance Registers', 'Course per Candidature per Unit Reports'].includes(activeTab)) {
      // Placeholders / Empty tabs matching TVET platform
      return [];
    }

    // Filter by Search term (Admission Number, Name, Title, Programme)
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.admission_number.toLowerCase().includes(query) ||
        r.assessment_number.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.title.toLowerCase().includes(query) ||
        r.programme.toLowerCase().includes(query) ||
        r.unit.toLowerCase().includes(query)
      );
    }

    // Filter by sidebar panel options
    if (filterDepartment) {
      result = result.filter(r => r.department === filterDepartment);
    }
    if (filterSession) {
      result = result.filter(r => r.session === filterSession);
    }

    return result;
  };

  const filteredReports = getFilteredReports();

  // Pagination calculations
  const totalPages = Math.max(Math.ceil(filteredReports.length / pageSize), 1);
  const indexOfLastRow = currentPage * pageSize;
  const indexOfFirstRow = indexOfLastRow - pageSize;
  const currentRows = filteredReports.slice(indexOfFirstRow, indexOfLastRow);

  // List of unique departments and sessions for filters dropdown
  const departmentsList = Array.from(new Set(allReports.map(r => r.department))).filter(Boolean);
  const sessionsList = Array.from(new Set(allReports.map(r => r.session))).filter(Boolean);

  // Export to CSV Functionality
  const handleExportCSV = () => {
    if (filteredReports.length === 0) {
      alert("No report data available to export.");
      return;
    }

    const headers = [
      "Admission Number",
      "Assessment Number",
      "Name",
      "Department",
      "Title",
      "Category",
      "Status",
      "Unit",
      "Programme",
      "Session"
    ];

    const csvRows = [headers.join(",")];

    filteredReports.forEach(r => {
      const row = [
        `"${r.admission_number}"`,
        `"${r.assessment_number}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.department.replace(/"/g, '""')}"`,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        `"${r.status}"`,
        `"${r.unit.replace(/"/g, '""')}"`,
        `"${r.programme.replace(/"/g, '""')}"`,
        `"${r.session}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `poe_reports_${activeTab.toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    'All Files',
    'Approved',
    'Declined',
    'In Work Flow',
    'Attendance Registers',
    'Course per Candidature per Unit Reports'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SEO title="POE Reports" />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 transition-all active:scale-95"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">POE Reports</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm ml-10">Manage, review and monitor submitted portfolio evidence reports.</p>
        </div>
        
        <div className="flex items-center gap-3 ml-10 md:ml-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0000FE]/5 hover:bg-[#0000FE]/10 text-[#0000FE] font-black rounded-xl text-xs transition-all border border-blue-50"
          >
            <Download size={14} />
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all border ${
              showFiltersPanel 
                ? 'bg-slate-800 border-slate-800 text-white shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>
      </div>

      {/* Secondary filter options panel */}
      {showFiltersPanel && (
        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100/50 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departmentsList.map((d, i) => (
                <option key={i} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session / Intake</label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
            >
              <option value="">All Sessions</option>
              {sessionsList.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Summary KPI Cards Row (4 Columns matching screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Reports */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner shrink-0">
            <Folder size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 leading-none">{metrics.total_reports}</h3>
            <p className="text-slate-400 text-xs font-bold mt-1.5">Total Reports</p>
          </div>
        </div>

        {/* Card 2: Approved Reports */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-inner shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-green-600 leading-none">{metrics.approved_reports}</h3>
            <p className="text-slate-400 text-xs font-bold mt-1.5">Approved Reports</p>
          </div>
        </div>

        {/* Card 3: Pending Workflow */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner shrink-0">
            <Menu size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-amber-500 leading-none">{metrics.pending_workflow}</h3>
            <p className="text-slate-400 text-xs font-bold mt-1.5">Pending Workflow</p>
          </div>
        </div>

        {/* Card 4: Declined Reports */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-inner shrink-0">
            <XCircle size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-red-500 leading-none">{metrics.declined_reports}</h3>
            <p className="text-slate-400 text-xs font-bold mt-1.5">Declined Reports</p>
          </div>
        </div>
      </div>

      {/* Tab Selectors Row */}
      <div className="bg-white p-2 rounded-[22px] border border-slate-100 shadow-sm flex flex-wrap gap-2">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab 
                ? 'bg-[#0000FE] text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & entries control Row */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="w-full sm:w-64 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {currentRows.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-inner">
                <Folder size={32} />
              </div>
              <h4 className="text-lg font-black text-slate-700">No Reports Found</h4>
              <p className="text-slate-400 text-xs font-bold max-w-sm">
                There are currently no portfolio evidence reports available matching the filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Admission Number</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Assessment Number</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Name</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Department</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Title</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Category</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Unit</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Programme</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Session</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {currentRows.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/portfolios/${row.id}`)}
                  >
                    <td className="p-4 font-mono font-bold text-[#0000FE]">{row.admission_number}</td>
                    <td className="p-4 font-mono font-bold text-slate-600">{row.assessment_number}</td>
                    <td className="p-4 font-bold text-slate-800">{row.name}</td>
                    <td className="p-4 font-bold text-slate-500">{row.department}</td>
                    <td className="p-4 font-bold text-slate-700 truncate max-w-[120px]" title={row.title}>{row.title}</td>
                    <td className="p-4 font-bold text-slate-500">{row.category}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 font-bold rounded-lg text-[9px] uppercase tracking-wider border ${
                        row.status === 'EVALUATED' ? 'bg-green-50 text-green-700 border-green-100' :
                        row.status === 'SUBMITTED' ? 'bg-blue-50 text-[#0000FE] border-blue-100 animate-pulse' :
                        row.status === 'REDO' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {row.status === 'EVALUATED' ? 'Approved' : row.status === 'REDO' ? 'Declined' : row.status === 'SUBMITTED' ? 'In Workflow' : row.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-600 truncate max-w-[120px]" title={row.unit}>{row.unit}</td>
                    <td className="p-4 font-bold text-slate-600 truncate max-w-[120px]" title={row.programme}>{row.programme}</td>
                    <td className="p-4 font-bold text-slate-500">{row.session}</td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/portfolios/${row.id}`);
                        }}
                        className="px-3 py-1.5 bg-[#0000FE]/5 hover:bg-[#0000FE]/10 text-[#0000FE] font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Pagination row */}
        {filteredReports.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 pt-5 text-xs text-slate-400 font-bold">
            <p>
              Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredReports.length)} of {filteredReports.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white active:scale-95 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                    currentPage === i + 1 
                      ? 'bg-[#0000FE] text-white shadow-sm shadow-blue-500/10' 
                      : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white active:scale-95 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CohortAnalytics;

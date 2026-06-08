import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import { 
  FileText, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Users, 
  Plus, 
  UserMinus,
  Search,
  Layout,
  Download
} from 'lucide-react';

const UnitPortfolios = () => {
  const { unitId } = useParams();
  const [portfolios, setPortfolios] = useState([]);
  const [unit, setUnit] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolios'); // 'portfolios' or 'students'
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const fetchData = async () => {
    try {
      const [portfoliosRes, unitRes, usersRes] = await Promise.all([
        api.get(`/poe/portfolios/?unit=${unitId}`),
        api.get(`/academic/units/${unitId}/`),
        api.get('/users/list-all/')
      ]);
      setPortfolios(portfoliosRes.data);
      setUnit(unitRes.data);
      
      // Filter unit students from all users
      const unitStudentIds = unitRes.data.students || [];
      const enrolled = usersRes.data.filter(u => unitStudentIds.includes(u.id));
      const others = usersRes.data.filter(u => u.role === 'STUDENT' && !unitStudentIds.includes(u.id));
      
      setStudents(enrolled);
      setAllStudents(others);
    } catch (error) {
      console.error('Error fetching unit portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unitId]);

  const handleEnroll = async (studentId) => {
    try {
      await api.post(`/academic/units/${unitId}/enroll_students/`, {
        student_ids: [studentId]
      });
      fetchData();
    } catch (error) {
      alert('Failed to enroll student');
    }
  };

  const handleRemove = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the unit?')) return;
    try {
      await api.post(`/academic/units/${unitId}/remove_student/`, {
        student_id: studentId
      });
      fetchData();
    } catch (error) {
      alert('Failed to remove student');
    }
  };

  const handleDownload = async (portfolioId, registrationNumber) => {
    try {
      const response = await api.get(`/poe/portfolios/${portfolioId}/download_pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${registrationNumber || 'Portfolio'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/units-assigned" className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-600 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {unit?.code}: {unit?.name}
            </h1>
            <p className="text-slate-500 font-medium">Manage portfolios and student enrollments.</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('portfolios')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'portfolios' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Portfolios
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'students' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Students ({unit?.student_count})
          </button>
        </div>
      </div>

      {activeTab === 'portfolios' ? (
        <div className="space-y-4">
          {portfolios.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <FileText className="mx-auto text-slate-200 mb-6" size={64} />
              <h3 className="text-2xl font-bold text-slate-800">No Portfolios Found</h3>
              <p className="text-slate-400 mt-2">Students haven't started creating portfolios for this unit yet.</p>
            </div>
          ) : (
            portfolios.map((portfolio) => (
              <div 
                key={portfolio.id} 
                className="flex items-center justify-between p-8 bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    portfolio.status === 'EVALUATED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#0000FE]'
                  }`}>
                    <FileText size={28} />
                  </div>
                  <div>
                    {portfolio.element_display && (
                      <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-0.5">
                        {portfolio.element_display}
                      </p>
                    )}
                    <h3 className="text-xl font-bold text-slate-800">{portfolio.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        REG: {portfolio.learner_registration_number || 'N/A'} 
                        <span className="ml-2 text-slate-300 font-medium">({portfolio.learner_display})</span>
                      </p>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        portfolio.status === 'SUBMITTED' ? 'bg-red-50 text-red-600' : 
                        portfolio.status === 'EVALUATED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {portfolio.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right mr-4 hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence</p>
                    <p className="text-lg font-black text-slate-800">{portfolio.evidence_count} Files</p>
                  </div>
                  
                  <button 
                    onClick={() => handleDownload(portfolio.id, portfolio.learner_registration_number)}
                    className="p-3 bg-white text-slate-400 hover:text-[#0000FE] rounded-xl border border-slate-100 hover:border-blue-100 transition-all group/dl shadow-sm"
                    title="Download Transcript PDF"
                  >
                    <Download size={20} className="group-hover/dl:scale-110 transition-transform" />
                  </button>

                  {portfolio.status === 'SUBMITTED' ? (
                    <Link 
                      to={`/evaluation/${portfolio.id}`}
                      className="px-6 py-3 bg-[#0000FE] text-white font-black rounded-xl hover:bg-[#0000FE] transition-all flex items-center gap-2"
                    >
                      Evaluate
                      <ChevronRight size={18} />
                    </Link>
                  ) : (
                    <Link 
                      to={`/portfolios/${portfolio.id}`}
                      className="px-6 py-3 bg-slate-50 text-slate-600 font-black rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2"
                    >
                      View Details
                      <ChevronRight size={18} />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enrolled Students */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 ml-2">
              <Users size={20} className="text-primary-600" />
              Enrolled Students
            </h3>
            {students.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-[32px] border border-slate-100">
                <p className="text-slate-400 font-bold">No students enrolled in this unit yet.</p>
              </div>
            ) : (
              students.map(student => (
                <div key={student.id} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black">
                      {student.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{student.username}</p>
                      <p className="text-xs text-slate-400 font-medium">{student.registration_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/portfolios/new?unit=${unitId}&learner=${student.id}&learner_name=${student.username}`}
                      className="px-4 py-2 bg-slate-50 text-[#0000FE] text-xs font-black rounded-lg hover:bg-blue-50 transition-all border border-slate-100 flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Create POE
                    </Link>
                    <button 
                      onClick={() => handleRemove(student.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <UserMinus size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Enroll New Students */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/20 border border-slate-100 h-fit sticky top-32">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Plus size={20} className="text-primary-600" />
                Enroll Students
              </h3>
              
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {allStudents
                  .filter(s => s.username.toLowerCase().includes(searchTerm.toLowerCase()) || s.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(student => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{student.username}</p>
                        <p className="text-[10px] font-medium text-slate-400">{student.registration_number || 'No Registration No.'}</p>
                      </div>
                      <button 
                        onClick={() => handleEnroll(student.id)}
                        className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))
                }
                {allStudents.length === 0 && (
                  <p className="text-center text-xs text-slate-400 font-medium py-4">No more students available to enroll.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitPortfolios;

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  FileText, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck,
  User,
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen
} from 'lucide-react';

const CDACCStudentGlobalPortfolios = () => {
  const { studentId, unitId } = useParams();
  const [portfolios, setPortfolios] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch portfolios for this student, optionally filtered by unit
        const url = unitId 
          ? `/poe/portfolios/?learner=${studentId}&unit=${unitId}`
          : `/poe/portfolios/?learner=${studentId}`;
        const response = await api.get(url);
        setPortfolios(response.data);
        
        // Fetch student details (assuming we can get it from a user endpoint or extract from portfolios)
        if (response.data.length > 0) {
          // Use learner info from the first portfolio
          setStudent({
            name: response.data[0].learner_display,
            registration_number: response.data[0].learner_registration_number,
            course_name: response.data[0].course_display
          });
        } else {
          // If no portfolios, we might need another way to get student info, 
          // but for now let's try to get it from a generic user detail if possible
          try {
            const userRes = await api.get(`/users/${studentId}/`);
            setStudent({
                name: `${userRes.data.first_name} ${userRes.data.last_name}`,
                registration_number: userRes.data.registration_number,
                course_name: userRes.data.course_display
            });
          } catch (e) {
            console.error("Could not fetch user details", e);
          }
        }
      } catch (error) {
        console.error('Error fetching student global portfolios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  // Group portfolios by unit
  const groupedPortfolios = portfolios.reduce((acc, p) => {
    const unitName = p.unit_name || 'Other Units';
    if (!acc[unitName]) acc[unitName] = [];
    acc[unitName].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[#0000FE] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <User size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-blue-500" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    {unitId ? 'Unit-Specific Portfolios' : 'Global Learner Portfolio'}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                  {student?.name || 'Student Portfolios'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student?.registration_number}</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span className="text-xs font-bold text-slate-400">{student?.course_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(groupedPortfolios).length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
          <FileText className="mx-auto text-slate-100 mb-6" size={80} />
          <h3 className="text-2xl font-bold text-slate-800">No Portfolios Found</h3>
          <p className="text-slate-400 mt-2">This student hasn't submitted any portfolios yet.</p>
        </div>
      ) : (
        Object.entries(groupedPortfolios).map(([unitName, unitPortfolios]) => (
          <div key={unitName} className="space-y-6">
            <div className="flex items-center gap-3 ml-4">
              <BookOpen size={18} className="text-blue-500" />
              <h2 className="text-lg font-black text-slate-700 uppercase tracking-tight">{unitName}</h2>
              <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-400 rounded-full">{unitPortfolios.length} Submissions</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {unitPortfolios.map((portfolio) => (
                <div key={portfolio.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <FileText size={28} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      portfolio.status === 'EVALUATED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {portfolio.status}
                    </span>
                  </div>

                  {portfolio.element_display && (
                    <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">
                      {portfolio.element_display}
                    </p>
                  )}
                  <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 min-h-[3.5rem]">{portfolio.title}</h3>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar size={14} className="text-slate-300" />
                      <span className="font-medium">Submitted {new Date(portfolio.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link 
                    to={`/portfolios/${portfolio.id}`}
                    className="w-full py-5 bg-slate-50 text-[#0000FE] font-black text-sm rounded-2xl hover:bg-[#0000FE] hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-100 shadow-sm"
                  >
                    View Portfolio
                    <ExternalLink size={18} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CDACCStudentGlobalPortfolios;

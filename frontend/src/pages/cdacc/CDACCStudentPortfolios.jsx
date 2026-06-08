import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Clock
} from 'lucide-react';

const CDACCStudentPortfolios = () => {
  const { unitId, studentId } = useParams();
  const [portfolios, setPortfolios] = useState([]);
  const [unit, setUnit] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portfoliosRes, unitRes] = await Promise.all([
          api.get(`/poe/portfolios/?unit=${unitId}&learner=${studentId}`),
          api.get(`/academic/units/${unitId}/`)
        ]);
        setPortfolios(portfoliosRes.data);
        setUnit(unitRes.data);
        
        // Find student in unit detail
        const studentInfo = unitRes.data.students_detail?.find(s => s.id === parseInt(studentId));
        setStudent(studentInfo);
      } catch (error) {
        console.error('Error fetching student portfolios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [unitId, studentId]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link to={`/cdacc/units/${unitId}/students`} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <User size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-blue-500" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Learner Portfolio Case</span>
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                  {student?.first_name} {student?.last_name || student?.username}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student?.registration_number}</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span className="text-xs font-bold text-slate-400">{unit?.code}: {unit?.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submissions</p>
              <p className="text-xl font-black text-slate-800">{portfolios.length}</p>
            </div>
            <div className="px-6 py-4 bg-green-50 rounded-2xl border border-green-100 text-center">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Evaluated</p>
              <p className="text-xl font-black text-green-700">
                {portfolios.filter(p => p.status === 'EVALUATED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {portfolios.map((portfolio) => (
          <div key={portfolio.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
            {portfolio.status === 'EVALUATED' && (
              <div className="absolute top-0 right-0 p-4">
                <CheckCircle className="text-green-500" size={20} />
              </div>
            )}
            
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
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={14} className="text-slate-300" />
                <span className="font-medium">{portfolio.evidence_count} Evidence Documents</span>
              </div>
            </div>

            <Link 
              to={`/portfolios/${portfolio.id}`}
              className="w-full py-5 bg-[#0000FE] text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#0000FE] transition-all flex items-center justify-center gap-2"
            >
              Review Full Portfolio
              <ExternalLink size={18} />
            </Link>
          </div>
        ))}

        {portfolios.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="text-slate-200" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">No Portfolios Found</h3>
            <p className="text-slate-400 mt-2 max-w-xs mx-auto">This student hasn't submitted any evidence for this unit yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CDACCStudentPortfolios;

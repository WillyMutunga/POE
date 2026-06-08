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
  Download
} from 'lucide-react';

const CDACCPortfolioList = () => {
  const { unitId } = useParams();
  const [portfolios, setPortfolios] = useState([]);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portfoliosRes, unitRes] = await Promise.all([
          api.get(`/poe/portfolios/?unit=${unitId}`),
          api.get(`/academic/units/${unitId}/`)
        ]);
        setPortfolios(portfoliosRes.data);
        setUnit(unitRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [unitId]);

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
      <div className="flex items-center justify-between bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-blue-500" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">CDACC Auditor View</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {unit?.code}: {unit?.name}
            </h1>
            <p className="text-slate-500 font-medium">Reviewing {portfolios.length} student submissions.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {portfolios.map((portfolio) => (
          <div key={portfolio.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
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
            <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{portfolio.title}</h3>
            
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                <User size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{portfolio.learner_display}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{portfolio.learner_registration_number}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="text-xs font-bold text-slate-400">
                {portfolio.evidence_count} Documents
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleDownload(portfolio.id, portfolio.learner_registration_number)}
                  className="p-2 text-slate-400 hover:text-[#0000FE] transition-colors"
                  title="Download PDF"
                >
                  <Download size={18} />
                </button>
                <Link 
                  to={`/portfolios/${portfolio.id}`}
                  className="flex items-center gap-2 text-blue-600 font-black text-sm hover:underline"
                >
                  View
                  <ExternalLink size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {portfolios.length === 0 && (
          <div className="col-span-full py-32 text-center">
            <FileText className="mx-auto text-slate-100 mb-6" size={80} />
            <h3 className="text-2xl font-bold text-slate-800">No Submissions Found</h3>
            <p className="text-slate-400 mt-2">There are no student portfolios for this unit yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CDACCPortfolioList;

import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User,
  GraduationCap,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminPortfolioList = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await api.get('/poe/portfolios/');
        setPortfolios(response.data);
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolios();
  }, []);

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

  const filteredPortfolios = portfolios.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.learner_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.learner_registration_number && p.learner_registration_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.unit_display && p.unit_display.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === '' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'EVALUATED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'DRAFT': return 'bg-slate-50 text-slate-400 border-slate-100';
      case 'REDO': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUBMITTED': return <Clock size={14} />;
      case 'EVALUATED': return <CheckCircle2 size={14} />;
      case 'DRAFT': return <FileText size={14} />;
      case 'REDO': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Institutional Portfolios</h1>
          <p className="text-slate-500 font-medium">Monitoring all student submissions and academic progress.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by student name, reg no, or unit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-sm"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-bold text-sm text-slate-600"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="EVALUATED">Evaluated</option>
            <option value="REDO">Redo Request</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student & Registration</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Unit & Title</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPortfolios.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-slate-400 font-bold">
                    No portfolios found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPortfolios.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0000FE] font-black">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.learner_display}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {p.learner_registration_number || 'No Reg No.'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-bold text-slate-700">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <GraduationCap size={12} className="text-slate-300" />
                          <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{p.unit_display}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(p.status)}`}>
                        {getStatusIcon(p.status)}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <Link 
                          to={`/evaluation/${p.id}`}
                          className="flex items-center gap-2 text-[#0000FE] font-black text-[10px] uppercase tracking-widest hover:underline"
                        >
                          <Eye size={16} /> Details
                        </Link>
                        <button 
                          onClick={() => handleDownload(p.id, p.learner_registration_number)}
                          className="text-slate-400 hover:text-[#0000FE] transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPortfolioList;

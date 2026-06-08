import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FileText, ChevronRight, Clock, CheckCircle2, AlertCircle, ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyPortfolios = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

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

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  const statusColors = {
    'DRAFT': 'bg-slate-100 text-slate-600',
    'SUBMITTED': 'bg-blue-100 text-[#0000FE]',
    'EVALUATED': 'bg-green-100 text-green-700',
    'REDO': 'bg-red-100 text-red-700'
  };

  // Group portfolios by unit
  const groupedPortfolios = portfolios.reduce((acc, portfolio) => {
    const unitId = portfolio.unit;
    const unitName = portfolio.unit_display;
    if (!acc[unitId]) {
      acc[unitId] = {
        id: unitId,
        name: unitName,
        portfolios: []
      };
    }
    acc[unitId].portfolios.push(portfolio);
    return acc;
  }, {});

  const units = Object.values(groupedPortfolios);
  const selectedUnit = selectedUnitId ? groupedPortfolios[selectedUnitId] : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {selectedUnitId && (
            <button 
              onClick={() => setSelectedUnitId(null)}
              className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-600 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {selectedUnitId ? selectedUnit.name : 'My Portfolios'}
            </h1>
            <p className="text-slate-500 font-medium">
              {selectedUnitId 
                ? `Viewing portfolios for this unit.` 
                : 'All your created Practical Evidence folders grouped by unit.'}
            </p>
          </div>
        </div>
      </div>

      {!selectedUnitId ? (
        /* Units Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {units.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <FileText size={40} />
              </div>
              <p className="text-slate-400 font-bold text-xl">You haven't created any portfolios yet.</p>
              <Link to="/units" className="text-primary-600 font-bold mt-4 inline-flex items-center gap-2 hover:underline text-lg">
                Go to My Units to start one
                <ChevronRight size={20} />
              </Link>
            </div>
          ) : (
            units.map((unit) => (
              <button
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
                className="group text-left bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
                
                <div className="relative">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                    <BookOpen size={28} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">{unit.name}</h3>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {unit.portfolios.length} {unit.portfolios.length === 1 ? 'Portfolio' : 'Portfolios'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 text-[#0000FE] font-bold text-sm">
                    <span>View Portfolios</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        /* Portfolios List View (within selected unit) */
        <div className="grid grid-cols-1 gap-4">
          {selectedUnit.portfolios.map((portfolio) => (
            <div 
              key={portfolio.id} 
              className="group flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors shrink-0">
                  <FileText size={28} />
                </div>
                <div>
                  {portfolio.element_display && (
                    <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">
                      {portfolio.element_display}
                    </p>
                  )}
                  <h3 className="text-xl font-bold text-slate-800">{portfolio.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[portfolio.status]}`}>
                      {portfolio.status === 'REDO' ? 'Redo Required' : portfolio.status}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Updated {new Date(portfolio.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Evidence</p>
                  <p className="text-sm font-black text-slate-700">{portfolio.evidence_count || 0} Files</p>
                </div>
                
                <Link 
                  to={`/portfolios/${portfolio.id}`}
                  className="px-6 py-3 bg-slate-50 text-[#0000FE] font-black rounded-xl hover:bg-[#0000FE] hover:text-white transition-all flex items-center gap-2 text-sm"
                >
                  View Details
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPortfolios;


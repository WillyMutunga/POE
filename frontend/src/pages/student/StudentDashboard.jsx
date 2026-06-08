import React, { useEffect, useState } from 'react';
import api from '../../api';
import { BookOpen, Clock, ChevronRight, FilePlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const [units, setUnits] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsRes, profileRes] = await Promise.all([
          api.get('/academic/units/'),
          api.get('/users/profile/')
        ]);
        setUnits(unitsRes.data);
        setUser(profileRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  const groupedUnits = units.reduce((acc, unit) => {
    const semName = unit.registered_semester?.name || unit.semester_name || 'Unassigned Module';
    if (!acc[semName]) {
      acc[semName] = [];
    }
    acc[semName].push(unit);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-primary-600 font-black text-xs uppercase tracking-[0.2em] mb-2">{user?.school_name || 'School'}</p>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Welcome, {user?.first_name || user?.username}!</h1>
              <p className="text-slate-500 font-medium">Currently enrolled in <span className="text-slate-800 font-bold">{user?.course_name || 'your course'}</span></p>
            </div>
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Number</p>
              <p className="text-lg font-black text-[#0000FE]">{user?.registration_number}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end ml-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Units</h2>
          <p className="text-slate-500 font-medium text-sm">Approved units grouped by target module/semester.</p>
        </div>
      </div>

      {Object.keys(groupedUnits).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
          <p className="text-slate-400 font-bold">No registered units found. Please go to Unit Registration to request units.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedUnits).map(([semName, semUnits]) => (
            <div key={semName} className="space-y-6">
              <div className="flex items-center gap-4 ml-4">
                <h3 className="text-xl font-black text-[#0000FE] tracking-tight uppercase border-b-2 border-[#0000FE] pb-1">
                  {semName}
                </h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-150 px-2.5 py-1 rounded-full">
                  {semUnits.length} {semUnits.length === 1 ? 'Unit' : 'Units'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {semUnits.map((unit) => (
                  <div 
                    key={unit.id} 
                    className="group bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                    
                    <div className="relative">
                      <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-6">
                        <BookOpen size={28} />
                      </div>

                      <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{unit.name}</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">{unit.code}</p>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock size={16} />
                          <span className="text-sm font-bold">In Progress</span>
                        </div>
                        
                        <Link 
                          to={`/portfolios/new?unit=${unit.id}`}
                          className="flex items-center gap-2 text-[#0000FE] font-bold text-sm hover:underline"
                        >
                          Create POE
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

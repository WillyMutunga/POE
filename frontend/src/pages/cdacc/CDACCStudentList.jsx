import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import { 
  GraduationCap, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck,
  User,
  Search,
  FileText
} from 'lucide-react';

const CDACCStudentList = () => {
  const { unitId } = useParams();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/academic/units/${unitId}/`);
        setUnit(response.data);
      } catch (error) {
        console.error('Error fetching student list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [unitId]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  const students = unit?.students_detail || [];
  const filteredStudents = students.filter(s => 
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-blue-500" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Registered Learners</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {unit?.code}: {unit?.name}
            </h1>
            <p className="text-slate-500 font-medium">{students.length} students enrolled in this unit.</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <User size={28} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {student.first_name} {student.last_name || student.username}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.registration_number}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-t border-slate-50">
                <span className="text-slate-400 font-medium">Intake</span>
                <span className="font-bold text-slate-700">{student.intake || 'N/A'}</span>
              </div>
              
              <Link 
                to={`/cdacc/units/${unitId}/students/${student.id}/portfolios`}
                className="w-full py-4 bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                <FileText size={16} />
                View Portfolios
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <GraduationCap className="mx-auto text-slate-100 mb-4" size={64} />
            <p className="text-slate-400 font-bold">No students found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CDACCStudentList;

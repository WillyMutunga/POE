import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  Users, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  ShieldCheck,
  BookOpen,
  GraduationCap,
  FileText,
  User,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CDACCStudentsView = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState({}); // { courseId: true }
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-expand courses when searching for students
  useEffect(() => {
    if (searchTerm.length > 1) {
      const newExpanded = { ...expandedCourses };
      courses.forEach(course => {
        const hasMatchingStudent = course.students_detail?.some(student => 
          student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (hasMatchingStudent) {
          newExpanded[course.id] = true;
        }
      });
      setExpandedCourses(newExpanded);
    }
  }, [searchTerm, courses]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/academic/courses/');
        // Filter for CDACC relevant courses (Level 4, 5 & 6)
        const filtered = response.data.filter(c => 
          ['LEVEL_4', 'LEVEL_5', 'LEVEL_6', '4', '5', '6'].includes(c.level)
        );
        setCourses(filtered);
      } catch (error) {
        console.error('Error fetching courses for CDACC students view:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-[#0000FE] rounded-xl">
              <Users size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Learner Directory</h1>
          </div>
          <p className="text-slate-500 font-medium">Review students grouped by their courses.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search students or courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
          />
        </div>
      </div>

      <div className="space-y-6">
        {courses
          .filter(course => 
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.students_detail?.some(student => 
              student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
              student.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
            )
          )
          .map(course => (
            <div key={course.id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
              <div 
                onClick={() => setExpandedCourses(prev => ({ ...prev, [course.id]: !prev[course.id] }))}
                className={`p-8 flex items-center justify-between cursor-pointer transition-all ${expandedCourses[course.id] ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">{course.name}</h2>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{course.level_display}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Learners</p>
                    <p className="text-lg font-black text-slate-800 leading-none">{course.students_detail?.filter(s => s.role === 'STUDENT').length || 0}</p>
                  </div>
                  {expandedCourses[course.id] ? <ChevronDown size={24} className="text-slate-300" /> : <ChevronRight size={24} className="text-slate-300" />}
                </div>
              </div>

              {expandedCourses[course.id] && (
                <div className="p-8 border-t border-slate-100 bg-slate-50/20 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {course.students_detail?.filter(s => s.role === 'STUDENT').map(student => (
                      <div key={student.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <User size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{student.first_name} {student.last_name || student.username}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.registration_number}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs py-2 border-t border-slate-50">
                            <span className="text-slate-400 font-medium italic">Available Portfolios</span>
                            <ArrowRight size={14} className="text-slate-300" />
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {/* For CDACC, we show portfolios from all units in this course for this student */}
                            <Link 
                              to={`/cdacc/students/${student.id}/portfolios`}
                              className="w-full py-4 bg-blue-50 text-blue-700 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
                            >
                              <FileText size={14} />
                              Open Portfolios
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!course.students_detail || course.students_detail.length === 0) && (
                      <div className="col-span-full py-10 text-center">
                        <GraduationCap className="mx-auto text-slate-200 mb-4" size={48} />
                        <p className="text-slate-400 font-bold italic">No students registered in this course.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default CDACCStudentsView;

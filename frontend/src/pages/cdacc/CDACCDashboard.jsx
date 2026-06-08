import React, { useEffect, useState } from 'react';
import api from '../../api';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  ShieldCheck,
  Building,
  GraduationCap,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CDACCDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({}); // Track expanded folders: { 'course-1': true, 'unit-5': true }
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCDACCData = async () => {
      try {
        // Fetch courses filtered by level 5 and 6
        const response = await api.get('/academic/courses/');
        const filteredCourses = response.data.filter(c =>
          ['LEVEL_5', 'LEVEL_6', '5', '6'].includes(c.level)
        );
        setCourses(filteredCourses);
      } catch (error) {
        console.error('Error fetching CDACC data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCDACCData();
  }, []);

  // Auto-expand folders when searching
  useEffect(() => {
    if (searchTerm.length > 1) {
      const newExpanded = { ...expanded };
      courses.forEach(course => {
        const matchesCourse = course.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStudent = course.students_detail?.some(s => 
          s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesUnit = course.semesters.some(sem => 
          sem.units.some(u => 
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.code.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );

        if (matchesCourse || matchesStudent || matchesUnit) {
          newExpanded[`course-${course.id}`] = true;
          if (matchesUnit) {
            course.semesters.forEach(sem => {
              if (sem.units.some(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.code.toLowerCase().includes(searchTerm.toLowerCase()))) {
                newExpanded[`sem-folder-${sem.id}`] = true;
                newExpanded[`units-wrapper-${sem.id}`] = true;
              }
            });
          }
        }
      });
      setExpanded(newExpanded);
    }
  }, [searchTerm, courses]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">CDACC Review Portal</h1>
          </div>
          <p className="text-slate-500 font-medium">View Students and their Portfolios.</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search courses or units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-black text-slate-700 uppercase tracking-widest text-xs">Academic Hierarchy</h2>
          <span className="px-3 py-1 bg-white rounded-full border border-slate-200 text-[10px] font-black text-slate-400 uppercase">Level 5 & 6</span>
        </div>

        <div className="p-8 space-y-6">
          {(() => {
            const filteredCourses = courses.filter(course =>
              course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.students_detail?.some(s => 
                s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
              ) ||
              course.semesters.some(sem =>
                sem.units.some(unit => unit.name.toLowerCase().includes(searchTerm.toLowerCase()) || unit.code.toLowerCase().includes(searchTerm.toLowerCase()))
              )
            );

            if (filteredCourses.length === 0) {
              return (
                <div className="text-center py-20">
                  <Folder className="mx-auto text-slate-100 mb-4" size={64} />
                  <p className="text-slate-400 font-bold">No matching courses found.</p>
                </div>
              );
            }

            // Group by school_name
            const grouped = {};
            filteredCourses.forEach(course => {
              const school = course.school_name || 'Other Departments / Schools';
              if (!grouped[school]) {
                grouped[school] = [];
              }
              grouped[school].push(course);
            });

            return Object.entries(grouped).map(([schoolName, schoolCourses]) => (
              <div key={schoolName} className="space-y-4 bg-slate-50/30 p-6 rounded-[32px] border border-slate-100/50">
                {/* School Accordion Header */}
                <div 
                  onClick={() => toggleExpand(`school-${schoolName}`)}
                  className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-2xl cursor-pointer transition-all border border-slate-100/80 shadow-xs group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-[#0000FE] bg-blue-50/50 p-2.5 rounded-xl border border-blue-50 group-hover:scale-105 transition-all">
                      <Building size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 tracking-tight text-sm md:text-base">{schoolName}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{schoolCourses.length} {schoolCourses.length === 1 ? 'Course' : 'Courses'}</p>
                    </div>
                  </div>
                  {expanded[`school-${schoolName}`] !== false ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                </div>

                {/* School Courses List */}
                {expanded[`school-${schoolName}`] !== false && (
                  <div className="space-y-3 pl-2 md:pl-4 border-l border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    {schoolCourses.map(course => (
                      <div key={course.id} className="space-y-2">
                        {/* Level 1: Course */}
                        <div
                          onClick={() => toggleExpand(`course-${course.id}`)}
                          className="flex items-center justify-between p-5 bg-white hover:bg-blue-50/50 rounded-2xl cursor-pointer transition-all group border border-slate-100/80 hover:border-blue-100"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-blue-600 transition-transform group-hover:scale-110">
                              {expanded[`course-${course.id}`] ? <FolderOpen size={24} /> : <Folder size={24} />}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 text-sm md:text-base">{course.name}</h3>
                              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{course.level_display}</p>
                            </div>
                          </div>
                          {expanded[`course-${course.id}`] ? <ChevronDown size={20} className="text-slate-300" /> : <ChevronRight size={20} className="text-slate-300" />}
                        </div>

                        {/* Level 2: Semesters */}
                        {expanded[`course-${course.id}`] && (
                          <div className="ml-6 md:ml-12 pl-4 border-l-2 border-slate-100 space-y-2 animate-in slide-in-from-top-2 duration-200">
                            {course.semesters.map(semester => (
                              <div key={semester.id} className="space-y-2">
                                <div
                                  onClick={() => toggleExpand(`sem-folder-${semester.id}`)}
                                  className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl cursor-pointer transition-all border border-slate-100"
                                >
                                  <div className="flex items-center gap-3">
                                    <Clock className="text-slate-400" size={20} />
                                    <span className="font-bold text-slate-700 text-xs md:text-sm">{semester.name}</span>
                                  </div>
                                  {expanded[`sem-folder-${semester.id}`] ? <ChevronDown size={18} className="text-slate-300" /> : <ChevronRight size={18} className="text-slate-300" />}
                                </div>

                                {/* Level 3: Units Folder inside Semester */}
                                {expanded[`sem-folder-${semester.id}`] && (
                                  <div className="ml-6 md:ml-8 pl-4 border-l border-slate-100 space-y-2">
                                    <div
                                      onClick={() => toggleExpand(`units-wrapper-${semester.id}`)}
                                      className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-lg cursor-pointer transition-all border border-slate-100/50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Folder className="text-slate-400" size={18} />
                                        <span className="text-xs font-bold text-slate-500">Units</span>
                                      </div>
                                    </div>

                                    {/* Level 4: Individual Units */}
                                    {expanded[`units-wrapper-${semester.id}`] && (
                                      <div className="ml-6 md:ml-8 space-y-2">
                                        {semester.units.map(unit => (
                                          <div key={unit.id} className="space-y-2">
                                            <div
                                              onClick={() => toggleExpand(`unit-final-${unit.id}`)}
                                              className="flex items-center justify-between p-3 bg-white hover:bg-blue-50/30 rounded-xl cursor-pointer transition-all border border-slate-100/50 group"
                                            >
                                              <div className="flex items-center gap-3">
                                                <Building className="text-blue-400" size={18} />
                                                <span className="text-xs md:text-sm font-bold text-slate-600">{unit.code}: {unit.name}</span>
                                              </div>
                                            </div>

                                            {/* Level 5: Link to Students and Portfolios */}
                                            {expanded[`unit-final-${unit.id}`] && (
                                              <div className="ml-6 md:ml-8 space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unit Instructors</h5>
                                                    <div className="space-y-2">
                                                      {unit.instructors_detail?.map(inst => (
                                                        <div key={inst.id} className="flex items-center gap-2">
                                                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                            {inst.first_name?.[0]}{inst.last_name?.[0]}
                                                          </div>
                                                          <span className="text-xs font-bold text-slate-700">{inst.first_name} {inst.last_name}</span>
                                                        </div>
                                                      ))}
                                                      {(!unit.instructors_detail || unit.instructors_detail.length === 0) && (
                                                        <p className="text-[10px] text-slate-400 italic">No instructors assigned.</p>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <Link
                                                    to={`/cdacc/units/${unit.id}/students`}
                                                    className="flex flex-col justify-center p-4 bg-white text-blue-700 rounded-2xl hover:shadow-md transition-all border border-blue-100 group/link"
                                                  >
                                                    <div className="flex items-center gap-3 mb-1">
                                                      <GraduationCap size={16} className="text-blue-500" />
                                                      <span className="text-xs font-black uppercase tracking-tight">Registered Students</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold ml-7">{unit.student_count} Learners enrolled</p>
                                                    <div className="flex items-center gap-1 mt-2 ml-7 text-blue-600 opacity-0 group-hover/link:opacity-100 transition-all">
                                                      <span className="text-[10px] font-black uppercase">View List</span>
                                                      <ChevronRight size={12} />
                                                    </div>
                                                  </Link>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default CDACCDashboard;

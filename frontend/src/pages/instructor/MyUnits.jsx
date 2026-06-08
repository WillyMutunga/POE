import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { BookOpen, Users, FileCheck, Layers, ChevronDown, ChevronUp, Filter, Plus, Trash2, Eye } from 'lucide-react';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const romanToInt = (s) => {
  const roman = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let num = 0;
  const str = s.toUpperCase();
  for (let i = 0; i < str.length; i++) {
    if (i > 0 && roman[str[i]] > roman[str[i - 1]]) {
      num += roman[str[i]] - 2 * roman[str[i - 1]];
    } else {
      num += roman[str[i]];
    }
  }
  return num;
};

const getSemesterSortKey = (name) => {
  if (!name) return [2, ""];
  const nameUpper = name.toUpperCase();
  
  const numMatch = nameUpper.match(/\b\d+\b/);
  if (numMatch) {
    return [0, parseInt(numMatch[0], 10)];
  }
  
  const romanMatch = nameUpper.match(/\b[IVXLCDM]+\b/);
  if (romanMatch) {
    try {
      const val = romanToInt(romanMatch[0]);
      return [0, val];
    } catch (e) {}
  }
  
  return [1, nameUpper];
};

const compareSemesters = (a, b) => {
  const keyA = getSemesterSortKey(a);
  const keyB = getSemesterSortKey(b);
  
  if (keyA[0] !== keyB[0]) {
    return keyA[0] - keyB[0];
  }
  if (typeof keyA[1] === 'number' && typeof keyB[1] === 'number') {
    return keyA[1] - keyB[1];
  }
  return String(keyA[1]).localeCompare(String(keyB[1]));
};

const MyUnits = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSemesters, setExpandedSemesters] = useState({});
  const [courseFilter, setCourseFilter] = useState('All');
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedUnitDetails, setSelectedUnitDetails] = useState(null);

  // Add modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [coursesList, setCoursesList] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [semestersList, setSemestersList] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [elements, setElements] = useState(['']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMyUnits = async () => {
      try {
        const response = await api.get('/academic/units/my_units/');
        setUnits(response.data);
        
        // Auto-expand the first semester
        if (response.data.length > 0) {
          const firstSem = `${response.data[0].course_name} - ${response.data[0].semester_name}`;
          setExpandedSemesters({ [firstSem]: true });
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyUnits();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/academic/courses/');
        if (profile?.school) {
          // Filter courses under instructor's school
          const mySchoolCourses = response.data.filter(c => c.school === profile.school);
          setCoursesList(mySchoolCourses);
        } else {
          setCoursesList(response.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    if (profile) {
      fetchCourses();
    }
  }, [profile]);

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    const course = coursesList.find(c => c.id === parseInt(courseId));
    if (course) {
      setSemestersList(course.semesters || []);
    } else {
      setSemestersList([]);
    }
    setSelectedSemesterId('');
  };

  const handleAddElementField = () => {
    setElements(prev => [...prev, '']);
  };

  const handleRemoveElementField = (index) => {
    setElements(prev => prev.filter((_, i) => i !== index));
  };

  const handleElementChange = (index, value) => {
    setElements(prev => {
      const copy = [...prev];
      copy[index] = value.toUpperCase();
      return copy;
    });
  };

  const handleAddUnitSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedSemesterId || !newUnitCode || !newUnitName) {
      alert('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      // Create unit
      const unitPayload = {
        name: newUnitName.toUpperCase(),
        code: newUnitCode.toUpperCase(),
        course: parseInt(selectedCourseId),
        semester: parseInt(selectedSemesterId)
      };
      const unitResponse = await api.post('/academic/units/', unitPayload);
      const newUnitId = unitResponse.data.id;

      // Create elements
      for (const elementName of elements) {
        if (elementName.trim()) {
          await api.post('/academic/elements/', {
            name: elementName.toUpperCase(),
            unit: newUnitId
          });
        }
      }

      alert('Unit and elements submitted successfully. They will reflect in the dashboards once approved by the administrator.');
      
      // Reset form
      setSelectedCourseId('');
      setSelectedSemesterId('');
      setNewUnitCode('');
      setNewUnitName('');
      setElements(['']);
      setIsAddModalOpen(false);
      
      // Refresh list
      const response = await api.get('/academic/units/my_units/');
      setUnits(response.data);
    } catch (error) {
      console.error('Error submitting unit & elements:', error);
      let errorMsg = 'Failed to submit unit & elements.';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMsg = Object.entries(error.response.data)
            .map(([field, msgs]) => {
              const fieldName = field === 'non_field_errors' ? '' : `${field}: `;
              return `${fieldName}${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
            })
            .join('\n');
        } else if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        }
      }
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Group units by Course and Semester
  const groupedUnits = units.reduce((acc, unit) => {
    const key = `${unit.course_name} - ${unit.semester_name}`;
    if (!acc[key]) acc[key] = {
      course: unit.course_name,
      semester: unit.semester_name,
      units: []
    };
    acc[key].units.push(unit);
    return acc;
  }, {});

  const courses = ['All', ...new Set(units.map(u => u.course_name))];

  const toggleSemester = (key) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">My Assigned Units</h1>
          <p className="text-slate-500 font-medium mt-1">Academic units categorized by academic period.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#0000FE] text-white font-black rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-sm"
          >
            <Plus size={18} />
            Add Unit & Elements
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm font-bold text-slate-600 cursor-pointer"
            >
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
          <BookOpen className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">No Units Assigned</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">You haven't been assigned to any academic units yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedUnits)
            .filter(([key, group]) => courseFilter === 'All' || group.course === courseFilter)
            .sort((a, b) => compareSemesters(a[1].semester, b[1].semester))
            .map(([key, group]) => (
            <div key={key} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
              <button 
                onClick={() => toggleSemester(key)}
                className="w-full flex items-center justify-between p-8 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0000FE]">
                    <Layers size={28} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{group.semester}</h2>
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">{group.course}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest">
                    {group.units.length} Units
                  </span>
                  {expandedSemesters[key] ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                </div>
              </button>

              {expandedSemesters[key] && (
                <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {group.units.map((unit) => (
                      <div 
                        key={unit.id} 
                        onClick={() => setSelectedUnitDetails(unit)}
                        className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group cursor-pointer hover:bg-white"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-white px-3 py-1 rounded-full border border-primary-100">
                            {unit.code}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-black text-slate-800 leading-tight h-12 line-clamp-2">{unit.name}</h3>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">{unit.student_count || 0} Students</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUnitDetails(unit);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                              title="View Unit Details"
                            >
                              <Eye size={20} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/units/${unit.id}/portfolios`);
                              }}
                              className="p-2 text-[#0000FE] hover:bg-slate-100 rounded-lg transition-all"
                              title="View Portfolios"
                            >
                              <FileCheck size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Unit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Unit & Elements"
      >
        <form onSubmit={handleAddUnitSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Course *</label>
            <select
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold text-slate-700"
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              required
            >
              <option value="">Select Course</option>
              {coursesList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Semester *</label>
            <select
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold text-slate-700"
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              disabled={!selectedCourseId}
              required
            >
              <option value="">Select Semester</option>
              {semestersList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit Code *</label>
              <input 
                type="text"
                placeholder="e.g. JRN101"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold uppercase"
                value={newUnitCode}
                onChange={(e) => setNewUnitCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit Name *</label>
              <input 
                type="text"
                placeholder="e.g. Introduction to Journalism"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold uppercase"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit Elements (Divisions)</label>
              <button
                type="button"
                onClick={handleAddElementField}
                className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Element
              </button>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {elements.map((element, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={`e.g. PRACTICAL TASK ${index + 1}`}
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all font-bold text-sm uppercase"
                    value={element}
                    onChange={(e) => handleElementChange(index, e.target.value.toUpperCase())}
                  />
                  {elements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveElementField(index)}
                      className="p-3 text-slate-400 hover:text-red-500 transition-all bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-5 bg-[#0000FE] disabled:bg-blue-300 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            {submitting ? 'Submitting...' : 'Submit for Admin Approval'}
          </button>
        </form>
      </Modal>

      {selectedUnitDetails && (
        <Modal
          isOpen={!!selectedUnitDetails}
          onClose={() => setSelectedUnitDetails(null)}
          title={`Unit Details: ${selectedUnitDetails.name}`}
        >
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/65 grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Unit Code</span>
                <span className="text-slate-800 text-sm font-black">{selectedUnitDetails.code}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Semester/Module</span>
                <span className="text-slate-800 text-sm font-black">{selectedUnitDetails.semester_name || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Course</span>
                <span className="text-slate-800 text-sm font-black">{selectedUnitDetails.course_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Enrolled Students</span>
                <span className="text-[#0000FE] text-sm font-black">{selectedUnitDetails.student_count || 0} Students</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit Elements (Divisions)</h4>
              {!selectedUnitDetails.elements || selectedUnitDetails.elements.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">No elements defined for this unit.</p>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 max-h-60 overflow-y-auto space-y-2">
                  {selectedUnitDetails.elements.map((el, idx) => (
                    <div key={el.id || idx} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-[#0000FE] flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                      <span className="text-xs font-black text-slate-800 leading-tight">{el.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="button"
              onClick={() => setSelectedUnitDetails(null)}
              className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs border border-slate-200"
            >
              Close Details
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyUnits;

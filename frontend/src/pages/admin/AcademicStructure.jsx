import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  BookOpen, 
  GraduationCap, 
  School as SchoolIcon, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  Edit3,
  Layers,
  Layout,
  Search,
  Users,
  ClipboardList,
  CheckCircle,
  Download,
  FileText,
  UserPlus
} from 'lucide-react';
import Modal from '../../components/Modal';

const AcademicStructure = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedSchool, setExpandedSchool] = useState(null);
  const [expandedSemester, setExpandedSemester] = useState(null);
  const [expandedUnit, setExpandedUnit] = useState(null);

  // Modal States
  const [modals, setModals] = useState({
    school: false,
    course: false,
    semester: false,
    unit: false,
    element: false,
    courseDetail: false,
    bulkUpload: false,
    bulkUnitUpload: false
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningSessionSemester, setAssigningSessionSemester] = useState(null); // { id, name, units }
  const [assignInstructorId, setAssignInstructorId] = useState('');
  const [selectedUnitsForInstructor, setSelectedUnitsForInstructor] = useState({}); // { [unitId]: boolean }
  const [isAssigningInstructors, setIsAssigningInstructors] = useState(false);

  // Grading & Component States
  const [selectedCourseForGrading, setSelectedCourseForGrading] = useState(null);
  const [gradingSystem, setGradingSystem] = useState(null);
  const [loadingGrading, setLoadingGrading] = useState(false);
  const [gradingSystemModal, setGradingSystemModal] = useState(false);
  const [newRange, setNewRange] = useState({ min_score: '', max_score: '', grade: '', description: '' });

  const [selectedUnitForComponents, setSelectedUnitForComponents] = useState(null);
  const [unitComponents, setUnitComponents] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [unitComponentsModal, setUnitComponentsModal] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    school: { name: '' },
    course: { name: '', school: '', level: 'LEVEL_6', instructor: '' },
    semester: { name: '', course: '' },
    unit: { name: '', code: '', semester: '', instructors: [] },
    element: { name: '', unit: '' },
    bulkUnit: { course: '', data: '' }
  });

  const [editingItem, setEditingItem] = useState({ type: null, id: null });
  const [instructors, setInstructors] = useState([]);

  const courseSchoolId = formData.course.school;
  const filteredCourseInstructors = instructors.filter(inst => 
    !courseSchoolId || (inst.school && inst.school.toString() === courseSchoolId.toString())
  );
  const courseInstructorsToDisplay = filteredCourseInstructors.length > 0 ? filteredCourseInstructors : instructors;

  const unitCourseId = formData.unit.course;
  const filteredUnitInstructors = instructors.filter(inst => 
    !unitCourseId || (inst.course && inst.course.toString() === unitCourseId.toString())
  );
  const unitInstructorsToDisplay = filteredUnitInstructors.length > 0 ? filteredUnitInstructors : instructors;

  const fetchInstructors = async () => {
    try {
      const response = await api.get('/users/list-all/?role=INSTRUCTOR');
      setInstructors(response.data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const handleManageGradingSystem = async (course) => {
    setSelectedCourseForGrading(course);
    setGradingSystemModal(true);
    setLoadingGrading(true);
    try {
      const response = await api.get(`/academic/grading-systems/?course=${course.id}`);
      if (response.data.length > 0) {
        setGradingSystem(response.data[0]);
      } else {
        const createRes = await api.post('/academic/grading-systems/', {
          name: `${course.name} Grading System`,
          course: course.id
        });
        setGradingSystem(createRes.data);
      }
    } catch (error) {
      console.error('Error fetching/creating grading system:', error);
      alert('Failed to initialize grading system.');
    } finally {
      setLoadingGrading(false);
    }
  };

  const handleAddRange = async () => {
    if (!newRange.min_score || !newRange.max_score || !newRange.grade) {
      alert('Please fill in min, max and grade code.');
      return;
    }
    try {
      await api.post(`/academic/grading-systems/${gradingSystem.id}/add_range/`, {
        ...newRange,
        min_score: parseInt(newRange.min_score),
        max_score: parseInt(newRange.max_score)
      });
      const reload = await api.get(`/academic/grading-systems/?course=${selectedCourseForGrading.id}`);
      if (reload.data.length > 0) {
        setGradingSystem(reload.data[0]);
      }
      setNewRange({ min_score: '', max_score: '', grade: '', description: '' });
    } catch (error) {
      console.error('Error adding range:', error);
      alert(error.response?.data?.error || 'Failed to add grade range.');
    }
  };

  const handleDeleteRange = async (rangeId) => {
    if (!window.confirm('Delete this grade range?')) return;
    try {
      await api.post(`/academic/grading-systems/${gradingSystem.id}/delete_range/`, { range_id: rangeId });
      const reload = await api.get(`/academic/grading-systems/?course=${selectedCourseForGrading.id}`);
      if (reload.data.length > 0) {
        setGradingSystem(reload.data[0]);
      }
    } catch (error) {
      console.error('Error deleting range:', error);
      alert('Failed to delete grade range.');
    }
  };

  const handleManageUnitComponents = async (unit) => {
    setSelectedUnitForComponents(unit);
    setUnitComponentsModal(true);
    setLoadingComponents(true);
    try {
      const response = await api.get(`/academic/units/${unit.id}/get_components/`);
      setUnitComponents(response.data);
    } catch (error) {
      console.error('Error fetching unit components:', error);
    } finally {
      setLoadingComponents(false);
    }
  };

  const handleAddComponentField = () => {
    setUnitComponents(prev => [...prev, { name: '', weight: '' }]);
  };

  const handleRemoveComponentField = (index) => {
    setUnitComponents(prev => prev.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index, field, value) => {
    setUnitComponents(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveComponents = async () => {
    const totalWeight = unitComponents.reduce((sum, c) => sum + parseInt(c.weight || 0), 0);
    if (totalWeight !== 100 && unitComponents.length > 0) {
      alert(`Total weight must be exactly 100%. Current: ${totalWeight}%`);
      return;
    }

    try {
      await api.post(`/academic/units/${selectedUnitForComponents.id}/save_components/`, {
        components: unitComponents.map(c => ({
          name: c.name.toUpperCase(),
          weight: parseInt(c.weight)
        }))
      });
      alert('Component weights saved successfully!');
      setUnitComponentsModal(false);
      fetchStructure();
    } catch (error) {
      console.error('Error saving unit components:', error);
      alert(error.response?.data?.error || 'Failed to save component weights.');
    }
  };

  useEffect(() => {
    fetchStructure();
    fetchInstructors();
  }, []);

  const handleDownload = async (type, id, name) => {
    try {
      let url = '';
      let filename = '';
      let mimeType = 'text/csv';
      
      if (type === 'course-units') {
        url = `/academic/courses/${id}/export_units/`;
        filename = `${name}_units.csv`;
      } else if (type === 'course-comprehensive') {
        url = `/academic/courses/${id}/export_comprehensive_structure/`;
        filename = `${name}_comprehensive_structure.csv`;
      } else if (type === 'course-students') {
        url = `/academic/courses/${id}/export_students/`;
        filename = `${name}_students.csv`;
      } else if (type === 'course-units-pdf') {
        url = `/academic/courses/${id}/export_units_pdf/`;
        filename = `${name}_structure.pdf`;
        mimeType = 'application/pdf';
      } else if (type === 'course-comprehensive-pdf') {
        url = `/academic/courses/${id}/export_comprehensive_structure_pdf/`;
        filename = `${name}_comprehensive_structure.pdf`;
        mimeType = 'application/pdf';
      } else if (type === 'course-students-pdf') {
        url = `/academic/courses/${id}/export_students_pdf/`;
        filename = `${name}_students.pdf`;
        mimeType = 'application/pdf';
      }
      
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const fetchStructure = async () => {
    try {
      const response = await api.get('/academic/schools/');
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching academic structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModal = (type, parentId = null, existingData = null, courseId = null) => {
    setModals({ ...modals, [type]: !modals[type] });
    if (existingData) {
      setEditingItem({ type, id: existingData.id });
      let dataToSet = existingData;
      if (type === 'element') {
        const cleanName = existingData.name.replace(/^Element \d+:\s*/i, '');
        dataToSet = { ...existingData, name: cleanName };
      }
      setFormData({ ...formData, [type]: dataToSet });
    } else {
      setEditingItem({ type: null, id: null });
      if (parentId) {
        if (type === 'course') setFormData({ ...formData, course: { ...formData.course, school: parentId, name: '', level: 'LEVEL_6', instructor: '' } });
        if (type === 'semester') setFormData({ ...formData, semester: { ...formData.semester, course: parentId, name: '' } });
        if (type === 'unit') setFormData({ ...formData, unit: { ...formData.unit, semester: parentId, course: courseId || '', name: '', code: '', instructors: [] } });
        if (type === 'element') setFormData({ ...formData, element: { ...formData.element, unit: parentId, name: '' } });
        if (type === 'bulkUnitUpload') setFormData({ ...formData, bulkUnit: { course: parentId, data: '' } });
      }
    }
  };

  const handleViewCourseDetails = async (course) => {
    setSelectedCourse(course);
    setModals({ ...modals, courseDetail: true });
    setLoadingStudents(true);
    try {
      const response = await api.get(`/users/list-all/?course=${course.id}&role=STUDENT`);
      setCourseStudents(response.data);
    } catch (error) {
      console.error('Error fetching course students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const refreshCourseDetails = async (courseId) => {
    try {
      const response = await api.get('/academic/schools/');
      setSchools(response.data);
      
      let updatedCourse = null;
      for (const school of response.data) {
        const found = school.courses?.find(c => c.id === courseId);
        if (found) {
          updatedCourse = found;
          break;
        }
      }
      if (updatedCourse) {
        setSelectedCourse(updatedCourse);
      }
    } catch (error) {
      console.error('Error refreshing course details:', error);
    }
  };

  const handleSubmit = async (type) => {
    try {
      const endpoint = {
        school: '/academic/schools/',
        course: '/academic/courses/',
        semester: '/academic/semesters/',
        unit: '/academic/units/',
        element: '/academic/elements/'
      }[type];

      if (editingItem.id) {
        await api.patch(`${endpoint}${editingItem.id}/`, formData[type]);
      } else {
        await api.post(endpoint, formData[type]);
      }
      
      toggleModal(type);
      fetchStructure();
      // Reset form
      setFormData({
        ...formData,
        [type]: type === 'course' ? { name: '', school: '', level: 'LEVEL_6', instructor: '' } :
                type === 'unit' ? { name: '', code: '', semester: '', instructors: [] } :
                type === 'element' ? { name: '', unit: '' } :
                { name: '', [type === 'semester' ? 'course' : '']: '' }
      });
    } catch (error) {
      console.error(`Error creating/updating ${type}:`, error);
      let errorMsg = `Failed to save ${type}.`;
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
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone and may delete all related data (semesters, units, etc).`)) {
      return;
    }

    try {
      const endpoint = {
        school: '/academic/schools/',
        course: '/academic/courses/',
        semester: '/academic/semesters/',
        unit: '/academic/units/',
        element: '/academic/elements/'
      }[type];

      await api.delete(`${endpoint}${id}/`);
      fetchStructure();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}. It may be in use.`);
    }
  };

  const handleBulkUnitSubmit = async () => {
    const lines = formData.bulkUnit.data.split('\n').filter(l => l.trim());
    const units = lines.map(line => {
      const [code, name] = line.split(',').map(s => s.trim());
      return { code: code.toUpperCase(), name: name.toUpperCase() };
    });

    try {
      await api.post('/academic/units/bulk_create/', {
        course: formData.bulkUnit.course,
        units
      });
      alert('Units uploaded successfully!');
      toggleModal('bulkUnitUpload');
      fetchStructure();
    } catch (error) {
      console.error('Error bulk uploading units:', error);
      alert('Failed to upload units. Check format and duplicates.');
    }
  };

  const handleAssignSemester = async (unitId, semesterId) => {
    try {
      await api.post(`/academic/units/${unitId}/assign_semester/`, {
        semester_id: semesterId
      });
      fetchStructure();
    } catch (error) {
      console.error('Error assigning semester:', error);
      alert(error.response?.data?.error || 'Failed to assign semester.');
    }
  };

  const handleApproveUnit = async (unitId) => {
    try {
      await api.patch(`/academic/units/${unitId}/`, { is_approved: true });
      fetchStructure();
    } catch (error) {
      console.error('Error approving unit:', error);
      alert('Failed to approve unit.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Academic Structure</h1>
          <p className="text-slate-500 font-medium">Manage schools, courses, and unit assignments.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search courses or units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm"
            />
          </div>
          <button 
            onClick={() => toggleModal('school')}
            className="flex items-center gap-2 px-6 py-3 bg-[#0000FE] text-white font-black rounded-xl shadow-lg shadow-blue-100 hover:bg-[#0000FE] transition-all"
          >
            <Plus size={20} />
            Add New School
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {schools
          .filter(school => {
            if (!searchTerm) return true;
            return school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   school.courses?.some(course => 
                     course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     course.semesters?.some(sem => 
                       sem.units?.some(unit => 
                         unit.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         unit.code.toLowerCase().includes(searchTerm.toLowerCase())
                       )
                     )
                   );
          })
          .map((school) => (
          <div key={school.id} className="bg-white rounded-[40px] shadow-xl shadow-slate-200/20 border border-slate-100 overflow-hidden transition-all duration-500">
            <div 
              onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
              className={`p-10 flex items-center justify-between cursor-pointer transition-all duration-300 ${expandedSchool === school.id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${expandedSchool === school.id ? 'bg-blue-600 text-white rotate-12' : 'bg-blue-50 text-blue-600 shadow-inner'}`}>
                  <SchoolIcon size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{school.name}</h2>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SCH-{school.id.toString().padStart(3, '0')}</p>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <p className="text-xs font-bold text-primary-600">{school.courses?.length || 0} Registered Courses</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="hidden md:flex gap-8 border-r border-slate-100 pr-8">
                  <div className="text-center">
                    <p className="text-xl font-black text-slate-800 tracking-tighter">
                      {school.courses?.reduce((acc, c) => acc + (c.semesters?.length || 0), 0)}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semesters</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-slate-800 tracking-tighter">
                      {school.courses?.reduce((acc, c) => acc + (c.unassigned_units?.length || 0) + (c.semesters?.reduce((sum, s) => sum + (s.units?.length || 0), 0) || 0), 0)}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleModal('course', school.id);
                    }}
                    className="px-6 py-3 bg-white text-primary-600 font-bold rounded-xl hover:bg-primary-600 hover:text-white shadow-sm border border-slate-100 transition-all flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Course
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleModal('school', null, school);
                    }}
                    className="p-3 text-slate-400 hover:text-blue-600 transition-all bg-white rounded-xl border border-slate-100 shadow-sm"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete('school', school.id);
                    }}
                    className="p-3 text-slate-400 hover:text-red-500 transition-all bg-white rounded-xl border border-slate-100 shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className={`transition-transform duration-500 ${expandedSchool === school.id ? 'rotate-180' : ''}`}>
                  <ChevronDown size={28} className="text-slate-300" />
                </div>
              </div>
            </div>

            {expandedSchool === school.id && (
              <div className="p-10 border-t border-slate-100 bg-slate-50/20 space-y-8 animate-in slide-in-from-top-4 fade-in duration-500">
                <div className="grid grid-cols-1 gap-6">
              {school.courses?.filter(course => {
                if (!searchTerm) return true;
                return course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       course.semesters.some(sem => 
                         sem.units.some(unit => 
                           unit.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           unit.code.toLowerCase().includes(searchTerm.toLowerCase())
                         )
                       );
              }).map((course) => (
                <div key={course.id} className="border border-slate-50 rounded-[32px] overflow-hidden transition-all">
                  <div 
                    onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                    className={`p-6 flex items-center justify-between cursor-pointer transition-all ${expandedCourse === course.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{course.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.level_display}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-bold text-slate-400">{course.semesters?.length || 0} Semesters</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCourseDetails(course);
                        }}
                        className="px-4 py-2 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-all border border-slate-100"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManageGradingSystem(course);
                        }}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                      >
                        Grading
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModal('bulkUpload', null, course);
                        }}
                        className="p-2 text-slate-300 hover:text-emerald-600 transition-all"
                        title="Bulk Upload Students"
                      >
                        <Users size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModal('bulkUnitUpload', course.id);
                        }}
                        className="p-2 text-slate-300 hover:text-indigo-600 transition-all"
                        title="Bulk Upload Units"
                      >
                        <ClipboardList size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModal('course', null, course);
                        }}
                        className="p-2 text-slate-300 hover:text-blue-600 transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete('course', course.id);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload('course-units', course.id, course.name);
                          }}
                          className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-100"
                          title="Download Units (CSV)"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload('course-units-pdf', course.id, course.name);
                          }}
                          className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                          title="Download Units (PDF)"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload('course-comprehensive', course.id, course.name);
                          }}
                          className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-sm border border-purple-100"
                          title="Download Comprehensive Structure (CSV)"
                        >
                          <Layers size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload('course-comprehensive-pdf', course.id, course.name);
                          }}
                          className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                          title="Download Comprehensive Structure (PDF)"
                        >
                          <BookOpen size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload('course-students', course.id, course.name);
                          }}
                          className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm border border-slate-100"
                          title="Download Students (CSV)"
                        >
                          <Users size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload('course-students-pdf', course.id, course.name);
                          }}
                          className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100"
                          title="Download Students (PDF)"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                      {expandedCourse === course.id ? <ChevronDown size={20} className="text-slate-300" /> : <ChevronRight size={20} className="text-slate-300" />}
                    </div>
                  </div>

                  {expandedCourse === course.id && (
                    <div className="p-8 bg-slate-50/30 border-t border-slate-100 space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Semesters & Units</h4>
                        <button 
                          onClick={() => toggleModal('semester', course.id)}
                          className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Semester
                        </button>
                      </div>

                      {/* Unassigned Units Section */}
                      {course.unassigned_units?.length > 0 && (
                        <div className="bg-amber-50/50 p-6 rounded-[24px] border border-amber-100/50 mb-6">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-bold text-amber-800 flex items-center gap-2">
                              <ClipboardList size={16} className="text-amber-600" />
                              Unassigned Units
                            </h5>
                            <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-full uppercase">
                              {course.unassigned_units.length} Pending Assignment
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {course.unassigned_units.map(unit => (
                              <div key={unit.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{unit.name}</p>
                                    <p className="text-[10px] font-medium text-slate-400">{unit.code}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => toggleModal('unit', null, unit)}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-all bg-slate-50 rounded-lg"
                                      title="Edit Unit"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete('unit', unit.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 transition-all bg-slate-50 rounded-lg"
                                      title="Delete Unit"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                                <select 
                                  className="text-[10px] font-bold p-2 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-primary-100"
                                  onChange={(e) => handleAssignSemester(unit.id, e.target.value)}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Assign to Semester...</option>
                                  {course.semesters?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {course.semesters?.map((sem) => (
                          <div key={sem.id} className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden transition-all">
                            <div 
                              onClick={() => setExpandedSemester(expandedSemester === sem.id ? null : sem.id)}
                              className={`p-6 flex justify-between items-center cursor-pointer transition-all ${expandedSemester === sem.id ? 'bg-blue-50/20' : 'hover:bg-slate-50/50'}`}
                            >
                              <h5 className="font-bold text-slate-800 flex items-center gap-2">
                                <Layers size={16} className={`transition-colors duration-300 ${expandedSemester === sem.id ? 'text-blue-600' : 'text-blue-400'}`} />
                                {sem.name}
                                <span className="ml-2 px-2 py-0.5 bg-slate-100 text-[10px] text-slate-500 rounded-full">{sem.units?.length || 0} Units</span>
                              </h5>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleModal('semester', null, sem);
                                  }}
                                  className="w-8 h-8 bg-white text-slate-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"
                                  title="Edit Semester"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleModal('unit', sem.id, null, course.id);
                                  }}
                                  className="w-8 h-8 bg-white text-slate-400 rounded-lg flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 transition-all border border-slate-100 shadow-sm"
                                  title="Add Unit"
                                >
                                  <Plus size={16} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete('semester', sem.id);
                                  }}
                                  className="w-8 h-8 bg-white text-slate-300 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 shadow-sm"
                                  title="Delete Semester"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <ChevronRight size={16} className={`text-slate-300 transition-transform duration-300 ${expandedSemester === sem.id ? 'rotate-90' : ''}`} />
                              </div>
                            </div>
                            
                            {expandedSemester === sem.id && (
                              <div className="p-6 bg-slate-50/30 border-t border-slate-100 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                {sem.units?.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic py-2">No units assigned yet.</p>
                                ) : (
                                  sem.units.map(unit => (
                                    <div key={unit.id} className="flex flex-col bg-white rounded-xl border border-slate-100 transition-all overflow-hidden mb-2 shadow-sm">
                                      <div 
                                        onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-all"
                                      >
                                        <div className="flex items-center gap-3">
                                          <ChevronRight size={14} className={`text-slate-400 transition-transform duration-300 ${expandedUnit === unit.id ? 'rotate-90 text-[#0000FE]' : ''}`} />
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <p className="text-xs font-bold text-slate-800">{unit.name}</p>
                                              {!unit.is_approved && (
                                                <span className="px-2 py-0.5 bg-amber-50 text-[9px] text-amber-600 font-bold border border-amber-200 rounded-full animate-pulse uppercase tracking-wider">
                                                  Pending Approval
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-400">{unit.code}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                          {!unit.is_approved && (
                                            <button 
                                              onClick={() => handleApproveUnit(unit.id)}
                                              className="px-2.5 py-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 transition-all bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-1 text-[10px] font-bold"
                                              title="Approve Unit"
                                            >
                                              <CheckCircle size={12} />
                                              Approve
                                            </button>
                                          )}
                                          <button 
                                            onClick={() => toggleModal('unit', null, unit, course.id)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-all bg-slate-50 rounded-lg border border-slate-100"
                                            title="Edit Unit"
                                          >
                                            <Edit3 size={14} />
                                          </button>
                                          <button 
                                            onClick={() => toggleModal('element', unit.id)}
                                            className="p-1.5 text-slate-400 hover:text-primary-600 transition-all bg-slate-50 rounded-lg border border-slate-100"
                                            title="Add Element"
                                          >
                                            <Plus size={14} />
                                          </button>
                                          <button 
                                            onClick={() => handleManageUnitComponents(unit)}
                                            className="p-1.5 text-slate-400 hover:text-[#0000FE] transition-all bg-slate-50 rounded-lg border border-slate-100"
                                            title="Manage Component Weights"
                                          >
                                            <ClipboardList size={14} />
                                          </button>
                                          <Trash2 
                                            size={14} 
                                            className="text-slate-300 hover:text-red-500 cursor-pointer animate-in fade-in" 
                                            onClick={() => handleDelete('unit', unit.id)}
                                            title="Delete Unit"
                                          />
                                        </div>
                                      </div>
                                      
                                      {expandedUnit === unit.id && (
                                        <div className="px-6 pb-4 pt-2 bg-slate-50/50 border-t border-slate-100/50 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Divisions (Elements)</span>
                                            <button 
                                              onClick={() => toggleModal('element', unit.id)}
                                              className="text-[10px] font-bold text-[#0000FE] hover:underline"
                                            >
                                              + Add Element
                                            </button>
                                          </div>
                                          {!unit.elements || unit.elements.length === 0 ? (
                                            <p className="text-[10px] text-slate-400 italic py-1">No elements created. Portfolios cannot be submitted without an element.</p>
                                          ) : (
                                            <div className="space-y-1.5">
                                              {unit.elements.map(el => (
                                                <div key={el.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100/60 shadow-sm text-[11px] font-semibold text-slate-700">
                                                  <span>{el.name}</span>
                                                  <div className="flex items-center gap-2">
                                                    <Edit3 
                                                      size={12} 
                                                      className="text-slate-300 hover:text-blue-500 cursor-pointer transition-colors"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleModal('element', null, el);
                                                      }}
                                                      title="Edit Element"
                                                    />
                                                    <Trash2 
                                                      size={12} 
                                                      className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors" 
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete('element', el.id);
                                                      }}
                                                      title="Delete Element"
                                                    />
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>

      {/* MODALS */}
      <Modal 
        isOpen={modals.school} 
        onClose={() => toggleModal('school')} 
        title={editingItem.id ? "Edit School" : "Add New School"}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">School Name</label>
            <input 
              type="text"
              placeholder="e.g. School of Computing"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold"
              value={formData.school.name}
              onChange={(e) => setFormData({ ...formData, school: { ...formData.school, name: e.target.value.toUpperCase() } })}
            />
          </div>
          <button 
            onClick={() => handleSubmit('school')}
            className="w-full py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#0000FE] transition-all"
          >
            {editingItem.id ? 'Save Changes' : 'Create School'}
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={modals.course} 
        onClose={() => toggleModal('course')} 
        title={editingItem.id ? "Edit Course" : "Add New Course"}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Course Name</label>
            <input 
              type="text"
              placeholder="e.g. Bachelor of Commerce"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold"
              value={formData.course.name}
              onChange={(e) => setFormData({ ...formData, course: { ...formData.course, name: e.target.value.toUpperCase() } })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Level</label>
            <select 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold"
              value={formData.course.level}
              onChange={(e) => setFormData({ ...formData, course: { ...formData.course, level: e.target.value } })}
            >
              <option value="GRADE_I">Grade I</option>
              <option value="GRADE_II">Grade II</option>
              <option value="GRADE_III">Grade III</option>
              <option value="LEVEL_3">Level 3</option>
              <option value="LEVEL_4">Level 4</option>
              <option value="LEVEL_5">Level 5</option>
              <option value="LEVEL_6">Level 6</option>
              <option value="HEADWAY">Headway</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Course Instructor</label>
            <select 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold text-slate-700"
              value={formData.course.instructor || ''}
              onChange={(e) => setFormData({ ...formData, course: { ...formData.course, instructor: e.target.value ? parseInt(e.target.value) : '' } })}
            >
              <option value="">Select Instructor</option>
              {courseInstructorsToDisplay.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.first_name || inst.last_name ? `${inst.first_name} ${inst.last_name}`.trim() : inst.username}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => handleSubmit('course')}
            className="w-full py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#0000FE] transition-all"
          >
            {editingItem.id ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={modals.semester} 
        onClose={() => toggleModal('semester')} 
        title={editingItem.id ? "Edit Semester" : "Add Semester"}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Semester Name</label>
            <input 
              type="text"
              placeholder="e.g. Semester 1"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold"
              value={formData.semester.name}
              onChange={(e) => setFormData({ ...formData, semester: { ...formData.semester, name: e.target.value.toUpperCase() } })}
            />
          </div>
          <button 
            onClick={() => handleSubmit('semester')}
            className="w-full py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#0000FE] transition-all"
          >
            {editingItem.id ? 'Save Changes' : 'Add Semester'}
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={modals.unit} 
        onClose={() => toggleModal('unit')} 
        title={editingItem.id ? "Edit Unit" : "Add New Unit"}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit Code</label>
            <input 
              type="text"
              placeholder="e.g. BUS101"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold"
              value={formData.unit.code}
              onChange={(e) => setFormData({ ...formData, unit: { ...formData.unit, code: e.target.value.toUpperCase() } })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit Name</label>
            <input 
              type="text"
              placeholder="e.g. Principles of Management"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold"
              value={formData.unit.name}
              onChange={(e) => setFormData({ ...formData, unit: { ...formData.unit, name: e.target.value.toUpperCase() } })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit Instructor</label>
            <select 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold text-slate-700"
              value={(() => {
                if (!formData.unit.instructors || formData.unit.instructors.length === 0) return '';
                const first = formData.unit.instructors[0];
                return (typeof first === 'object' && first !== null) ? first.id : first;
              })()}
              onChange={(e) => setFormData({ 
                ...formData, 
                unit: { 
                  ...formData.unit, 
                  instructors: e.target.value ? [parseInt(e.target.value)] : [] 
                } 
              })}
            >
              <option value="">Select Instructor</option>
              {unitInstructorsToDisplay.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.first_name || inst.last_name ? `${inst.first_name} ${inst.last_name}`.trim() : inst.username}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => handleSubmit('unit')}
            className="w-full py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#0000FE] transition-all"
          >
            {editingItem.id ? 'Save Changes' : 'Assign Unit'}
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={modals.element} 
        onClose={() => toggleModal('element')} 
        title={editingItem.id ? "Edit Element" : "Add New Element"}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Element Name</label>
            <input 
              type="text"
              placeholder="e.g. Practical Task 1: Portfolio Building"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold"
              value={formData.element.name}
              onChange={(e) => setFormData({ ...formData, element: { ...formData.element, name: e.target.value.toUpperCase() } })}
            />
          </div>
          <button 
            onClick={() => handleSubmit('element')}
            className="w-full py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#0000FE] transition-all"
          >
            {editingItem.id ? 'Save Changes' : 'Create Element'}
          </button>
        </div>
      </Modal>

      {/* Course Details Modal (Student List) */}
      <Modal 
        isOpen={modals.courseDetail} 
        onClose={() => setModals({ ...modals, courseDetail: false })} 
        title={`Course Details: ${selectedCourse?.name}`}
        size="xxl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-h-[75vh] overflow-y-auto lg:overflow-hidden lg:h-[70vh]">
          {/* Left Column: Academic Structure Tree */}
          <div className="flex flex-col lg:h-full lg:overflow-hidden border-r border-slate-100 pr-6">
            <div className="mb-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Metadata</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/60 grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">School</span>
                  <span className="text-slate-800">{selectedCourse?.school_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Level</span>
                  <span className="text-slate-800">{selectedCourse?.level_display || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Semesters</span>
                  <span className="text-slate-800">{selectedCourse?.semesters?.length || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Units</span>
                  <span className="text-slate-800">
                    {(selectedCourse?.semesters?.reduce((acc, sem) => acc + (sem.units?.length || 0), 0) || 0) + (selectedCourse?.unassigned_units?.length || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Active Intake Sessions</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/60 space-y-4">
                {['JANUARY', 'MAY', 'SEPTEMBER'].map((intakeKey) => {
                  const intakeDisplay = intakeKey.charAt(0) + intakeKey.slice(1).toLowerCase() + " Intake";
                  const activeSession = selectedCourse?.sessions?.find(s => s.intake === intakeKey && s.is_active);
                  return (
                    <div key={intakeKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{intakeDisplay}</span>
                        <span className={`text-xs font-extrabold ${activeSession ? 'text-[#0000FE]' : 'text-slate-500'}`}>
                          {activeSession ? `Active: ${activeSession.semester_name}` : 'Locked / Not Started'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeSession && (
                          <button
                            type="button"
                            onClick={() => {
                              const semObj = selectedCourse.semesters.find(s => s.id === activeSession.semester);
                              if (semObj) {
                                setAssigningSessionSemester({
                                  id: semObj.id,
                                  name: semObj.name,
                                  units: semObj.units || []
                                });
                                setAssignInstructorId('');
                                setSelectedUnitsForInstructor(
                                  (semObj.units || []).reduce((acc, u) => {
                                    acc[u.id] = false;
                                    return acc;
                                  }, {})
                                );
                              }
                            }}
                            className="px-2 py-1.5 bg-[#0000FE]/5 hover:bg-[#0000FE]/10 text-[#0000FE] font-black rounded-lg text-[10px] transition-all flex items-center gap-1"
                            title="Assign instructors to units in this active session"
                          >
                            <UserPlus size={12} />
                            Assign Instructors
                          </button>
                        )}
                        <select
                          className="text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-100"
                          value={activeSession?.semester || ''}
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (val) {
                              try {
                                await api.post('/academic/sessions/', {
                                  course: selectedCourse.id,
                                  semester: parseInt(val),
                                  intake: intakeKey,
                                  is_active: true
                                });
                                alert(`Successfully unlocked session for ${intakeDisplay}!`);
                                
                                // Open the instructor assignment popup with checklist of units
                                const semObj = selectedCourse.semesters.find(s => s.id === parseInt(val));
                                if (semObj) {
                                  setAssigningSessionSemester({
                                    id: semObj.id,
                                    name: semObj.name,
                                    units: semObj.units || []
                                  });
                                  setAssignInstructorId('');
                                  setSelectedUnitsForInstructor(
                                    (semObj.units || []).reduce((acc, u) => {
                                      acc[u.id] = false;
                                      return acc;
                                    }, {})
                                  );
                                }
                                
                                refreshCourseDetails(selectedCourse.id);
                              } catch (err) {
                                console.error(err);
                                alert('Failed to unlock session.');
                              }
                            } else {
                              if (window.confirm(`Are you sure you want to lock the session for ${intakeDisplay}? Enrolled students will be set to no active semester.`)) {
                                try {
                                  await api.post('/academic/sessions/lock_session/', {
                                    course: selectedCourse.id,
                                    intake: intakeKey
                                  });
                                  alert(`Successfully locked ${intakeDisplay}.`);
                                  refreshCourseDetails(selectedCourse.id);
                                } catch (err) {
                                  console.error(err);
                                  alert('Failed to lock session.');
                                }
                              }
                            }
                          }}
                        >
                          <option value="">Locked / Inactive</option>
                          {selectedCourse?.semesters?.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Course Structure Tree</h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {/* Semesters & Units Breakdown */}
              {selectedCourse?.semesters?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No semesters defined for this course yet.</p>
              ) : (
                selectedCourse?.semesters?.map(sem => (
                  <div key={sem.id} className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm space-y-3">
                    <h5 className="font-extrabold text-sm text-[#0000FE] flex items-center justify-between gap-2 w-full">
                      <span className="flex items-center gap-2">
                        <Layers size={14} />
                        {sem.name}
                        <span className="text-[9px] font-black bg-blue-50 text-[#0000FE] px-2 py-0.5 rounded-full">{sem.units?.length || 0} Units</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningSessionSemester({
                            id: sem.id,
                            name: sem.name,
                            units: sem.units || []
                          });
                          setAssignInstructorId('');
                          setSelectedUnitsForInstructor(
                            (sem.units || []).reduce((acc, u) => {
                              acc[u.id] = false;
                              return acc;
                            }, {})
                          );
                        }}
                        className="px-2 py-1 bg-slate-50 hover:bg-[#0000FE]/5 border border-slate-200 hover:border-[#0000FE]/20 text-slate-500 hover:text-[#0000FE] font-bold rounded-lg text-[10px] transition-all flex items-center gap-1"
                      >
                        <UserPlus size={11} />
                        Assign Instructors
                      </button>
                    </h5>
                    
                    {sem.units?.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic pl-6">No units assigned to this semester.</p>
                    ) : (
                      <div className="space-y-3 pl-4 border-l border-slate-100">
                        {sem.units.map(unit => (
                          <div key={unit.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-800">{unit.code} - {unit.name}</p>
                              {!unit.is_approved && (
                                <span className="px-2 py-0.5 bg-amber-50 text-[9px] text-amber-600 font-bold border border-amber-200 rounded-full uppercase tracking-wider scale-90">
                                  Pending
                                </span>
                              )}
                            </div>
                            
                            {/* Elements list under this unit */}
                            <div className="pl-4 space-y-1">
                              {!unit.elements || unit.elements.length === 0 ? (
                                <p className="text-[9px] text-slate-400 italic">No elements defined.</p>
                              ) : (
                                unit.elements.map(el => (
                                  <div key={el.id} className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>{el.name}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Unassigned Units breakdown */}
              {selectedCourse?.unassigned_units?.length > 0 && (
                <div className="border border-amber-100 rounded-2xl p-4 bg-amber-50/20 shadow-sm space-y-3">
                  <h5 className="font-extrabold text-sm text-amber-800 flex items-center gap-2">
                    <ClipboardList size={14} />
                    Unassigned Units
                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{selectedCourse.unassigned_units.length} Units</span>
                  </h5>
                  <div className="space-y-2 pl-4 border-l border-amber-100">
                    {selectedCourse.unassigned_units.map(unit => (
                      <div key={unit.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800">{unit.code} - {unit.name}</p>
                          {!unit.is_approved && (
                            <span className="px-2 py-0.5 bg-amber-50 text-[9px] text-amber-600 font-bold border border-amber-200 rounded-full uppercase tracking-wider scale-90">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="pl-4 space-y-1">
                          {!unit.elements || unit.elements.length === 0 ? (
                            <p className="text-[9px] text-slate-400 italic">No elements defined.</p>
                          ) : (
                            unit.elements.map(el => (
                              <div key={el.id} className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>{el.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Enrolled Students List */}
          <div className="flex flex-col lg:h-full lg:overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Enrolled Students</h4>
              <span className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-black text-[#0000FE]">
                {courseStudents.length} {courseStudents.length === 1 ? 'Student' : 'Students'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-4">
              {loadingStudents ? (
                <div className="py-10 text-center animate-pulse text-slate-400 font-bold">Loading students...</div>
              ) : courseStudents.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No students enrolled in this course yet.
                </div>
              ) : (
                courseStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black shadow-sm uppercase">
                        {student.first_name ? student.first_name[0] : student.username[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {student.first_name || student.last_name ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : student.username}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400">
                          College Reg: <span className="font-bold text-slate-600">{student.username}</span>
                          {student.cdacc_registration_number && (
                            <>
                              {" | "}CDACC Reg: <span className="font-bold text-slate-600">{student.cdacc_registration_number}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                      {student.intake}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-4 border-t border-slate-50">
              <button 
                onClick={() => setModals({ ...modals, courseDetail: false })}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal 
        isOpen={modals.bulkUpload} 
        onClose={() => toggleModal('bulkUpload')} 
        title={`Bulk Enroll: ${formData.bulkUpload?.name}`}
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="text-sm font-black text-[#0000FE] mb-2 uppercase tracking-tight">Format Guide</h4>
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              Paste a list of students. Each line should be: <br/>
              <code className="bg-white/50 px-1 rounded">Username, Email, RegistrationNumber</code>
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Student List</label>
            <textarea 
              rows={8}
              placeholder="Juma, juma@example.com, STU/001/2024&#10;Muli, muli@example.com, STU/002/2024"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-mono text-sm"
              onChange={(e) => setFormData({ ...formData, bulkData: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intake</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                onChange={(e) => setFormData({ ...formData, bulkIntake: e.target.value })}
              >
                <option value="JANUARY">January</option>
                <option value="MAY">May</option>
                <option value="SEPTEMBER">September</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semester</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                onChange={(e) => setFormData({ ...formData, bulkSemester: e.target.value })}
              >
                <option value="">Select Semester</option>
                {formData.bulkUpload?.semesters?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={async () => {
              const lines = formData.bulkData?.split('\n').filter(l => l.trim()) || [];
              const students = lines.map(line => {
                const [username, email, registration_number] = line.split(',').map(s => s.trim());
                return { username, email, registration_number: registration_number?.toUpperCase() };
              });

              try {
                await api.post('/users/bulk-enroll/', {
                  students,
                  course: formData.bulkUpload.id,
                  semester: formData.bulkSemester,
                  intake: formData.bulkIntake || 'JANUARY'
                });
                alert('Students enrolled successfully!');
                toggleModal('bulkUpload');
              } catch (error) {
                alert('Error enrolling students. Check format and duplicates.');
              }
            }}
            className="w-full py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#0000FE] transition-all"
          >
            Process Bulk Enrollment
          </button>
        </div>
      </Modal>

      {/* Bulk Unit Upload Modal */}
      <Modal 
        isOpen={modals.bulkUnitUpload} 
        onClose={() => toggleModal('bulkUnitUpload')} 
        title="Bulk Upload Units"
      >
        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h4 className="text-sm font-black text-indigo-800 mb-2 uppercase tracking-tight">Unit Import Guide</h4>
            <p className="text-xs text-indigo-700 font-medium leading-relaxed">
              Paste a list of units. Each line should be: <br/>
              <code className="bg-white/50 px-1 rounded">UnitCode, UnitName</code>
              <br/>Example: <code className="bg-white/50 px-1 rounded">BIT101, Introduction to IT</code>
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Unit List</label>
            <textarea 
              rows={10}
              placeholder="BUS101, Principles of Management&#10;ACC202, Financial Accounting"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-mono text-sm"
              value={formData.bulkUnit.data}
              onChange={(e) => setFormData({ ...formData, bulkUnit: { ...formData.bulkUnit, data: e.target.value } })}
            />
          </div>

          <button 
            onClick={handleBulkUnitSubmit}
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            Upload and Save Units
          </button>
        </div>
      </Modal>

      {assigningSessionSemester && (
        <Modal
          isOpen={true}
          onClose={() => setAssigningSessionSemester(null)}
          title={`Assign Instructors: ${assigningSessionSemester.name}`}
        >
          <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">
              Choose an instructor and check the units they will teach for this active module session.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Instructor</label>
              <select 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold text-slate-700"
                value={assignInstructorId}
                onChange={(e) => setAssignInstructorId(e.target.value)}
              >
                <option value="">Choose Instructor...</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.first_name || inst.last_name ? `${inst.first_name} ${inst.last_name}`.trim() : inst.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Units in this Module</label>
              {assigningSessionSemester.units.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 bg-slate-50 p-4 rounded-xl text-center">No units defined in this semester.</p>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 max-h-60 overflow-y-auto space-y-2">
                  {assigningSessionSemester.units.map(unit => (
                    <label key={unit.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox"
                        checked={!!selectedUnitsForInstructor[unit.id]}
                        onChange={(e) => setSelectedUnitsForInstructor({
                          ...selectedUnitsForInstructor,
                          [unit.id]: e.target.checked
                        })}
                        className="w-4 h-4 rounded border-slate-300 text-[#0000FE] focus:ring-[#0000FE]"
                      />
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-tight">{unit.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{unit.code}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={async () => {
                  if (!assignInstructorId) {
                    alert('Please select an instructor first.');
                    return;
                  }
                  const checkedUnitIds = Object.keys(selectedUnitsForInstructor).filter(id => selectedUnitsForInstructor[id]);
                  if (checkedUnitIds.length === 0) {
                    alert('Please select at least one unit to assign.');
                    return;
                  }
                  
                  setIsAssigningInstructors(true);
                  try {
                    for (const unitId of checkedUnitIds) {
                      await api.patch(`/academic/units/${unitId}/`, {
                        instructors: [parseInt(assignInstructorId)]
                      });
                    }
                    
                    alert('Instructors assigned successfully to selected units!');
                    
                    // Reset checkbox selections
                    setSelectedUnitsForInstructor(
                      assigningSessionSemester.units.reduce((acc, u) => {
                        acc[u.id] = false;
                        return acc;
                      }, {})
                    );
                    setAssignInstructorId('');
                    setAssigningSessionSemester(null);
                    
                    refreshCourseDetails(selectedCourse.id);
                  } catch (error) {
                    console.error(error);
                    alert('Failed to assign instructors.');
                  } finally {
                    setIsAssigningInstructors(false);
                  }
                }}
                disabled={isAssigningInstructors}
                className="w-full py-4 bg-[#0000FE] text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-[#0000FE] disabled:opacity-50 transition-all text-xs"
              >
                {isAssigningInstructors ? 'Assigning...' : 'Assign to Checked Units'}
              </button>
              
              <button 
                type="button"
                onClick={() => setAssigningSessionSemester(null)}
                className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs border border-slate-200"
              >
                Done / Close
              </button>
            </div>
          </div>
        </Modal>
      )}
      {gradingSystemModal && selectedCourseForGrading && (
        <Modal
          isOpen={gradingSystemModal}
          onClose={() => setGradingSystemModal(false)}
          title={`Grading System: ${selectedCourseForGrading.name}`}
          size="xl"
        >
          <div className="space-y-6">
            {loadingGrading ? (
              <div className="py-10 text-center animate-pulse text-slate-400 font-bold">Loading grading system details...</div>
            ) : (
              <>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/60">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Grade Ranges</h4>
                  {!gradingSystem?.ranges || gradingSystem.ranges.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2 text-center">No grade ranges defined yet. Fallback standard level ranges will apply.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {gradingSystem.ranges.map(range => (
                        <div key={range.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div>
                            <span className="font-extrabold text-[#0000FE] mr-3">{range.grade}</span>
                            <span className="text-xs font-medium text-slate-600">{range.min_score}% - {range.max_score}%</span>
                            <span className="text-[10px] text-slate-400 ml-3 font-semibold">({range.description || 'No desc'})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRange(range.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Add Grade Range</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Min Score</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-bold"
                        value={newRange.min_score}
                        onChange={(e) => setNewRange({ ...newRange, min_score: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Max Score</label>
                      <input
                        type="number"
                        placeholder="100"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-bold"
                        value={newRange.max_score}
                        onChange={(e) => setNewRange({ ...newRange, max_score: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Grade Code</label>
                      <input
                        type="text"
                        placeholder="AM"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-black uppercase"
                        value={newRange.grade}
                        onChange={(e) => setNewRange({ ...newRange, grade: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                      <input
                        type="text"
                        placeholder="Attained Mastery"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-semibold"
                        value={newRange.description}
                        onChange={(e) => setNewRange({ ...newRange, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRange}
                    className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all text-xs"
                  >
                    Add Range Entry
                  </button>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGradingSystemModal(false)}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all"
              >
                Close Grading Config
              </button>
            </div>
          </div>
        </Modal>
      )}

      {unitComponentsModal && selectedUnitForComponents && (
        <Modal
          isOpen={unitComponentsModal}
          onClose={() => setUnitComponentsModal(false)}
          title={`Mark Components: ${selectedUnitForComponents.code}`}
          size="lg"
        >
          <div className="space-y-6">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Define the components that make up the final score for this unit. The weights must sum to exactly 100%. <br/>
              <em>Example: CAM 1 (30%), CAM 2 (30%), CAM 3 (40%)</em>
            </p>

            {loadingComponents ? (
              <div className="py-10 text-center animate-pulse text-slate-400 font-bold">Loading components...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center ml-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defined Components</span>
                  <button
                    type="button"
                    onClick={handleAddComponentField}
                    className="text-xs font-bold text-[#0000FE] hover:underline"
                  >
                    + Add Component
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {unitComponents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">No mark components defined. Marks will be entered as raw out of 100%.</p>
                  ) : (
                    unitComponents.map((comp, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="e.g. CAM 1"
                          value={comp.name}
                          onChange={(e) => handleComponentChange(idx, 'name', e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-bold uppercase text-sm"
                          required
                        />
                        <div className="w-28 relative">
                          <input
                            type="number"
                            placeholder="Weight %"
                            value={comp.weight}
                            onChange={(e) => handleComponentChange(idx, 'weight', e.target.value)}
                            className="w-full px-4 py-3 pr-8 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-bold text-sm text-right"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveComponentField(idx)}
                          className="p-3 text-slate-400 hover:text-red-500 transition-all bg-slate-50 rounded-xl border border-slate-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {unitComponents.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center text-xs font-black uppercase text-slate-600">
                    <span>Total Weight:</span>
                    <span className={unitComponents.reduce((sum, c) => sum + parseInt(c.weight || 0), 0) === 100 ? 'text-green-600' : 'text-red-500'}>
                      {unitComponents.reduce((sum, c) => sum + parseInt(c.weight || 0), 0)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveComponents}
                disabled={loadingComponents}
                className="w-full py-4 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-50 transition-all text-xs"
              >
                Save Components
              </button>
              <button
                type="button"
                onClick={() => setUnitComponentsModal(false)}
                className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs border border-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AcademicStructure;

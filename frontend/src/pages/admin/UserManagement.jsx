import React, { useEffect, useState } from 'react';
import api from '../../api';
import { User, Users, Plus, Search, Filter, MoreVertical, ShieldCheck, Eye, EyeOff, RefreshCw, Key, Trash2, Download, FileText, ChevronRight, ChevronDown, CheckCircle } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [toast, setToast] = useState(null); // { message, type, username }
  const [studentRegistrations, setStudentRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [addUnitId, setAddUnitId] = useState('');
  const [selectedBatchUnits, setSelectedBatchUnits] = useState([]);
  const [isBatchRegistering, setIsBatchRegistering] = useState(false);
  const [registerOnSave, setRegisterOnSave] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [addingSemesterId, setAddingSemesterId] = useState('');
  const [isAddingUnit, setIsAddingUnit] = useState(false);

  const [selectedTranscriptStudent, setSelectedTranscriptStudent] = useState(null);
  const [selectedTranscriptSemesterId, setSelectedTranscriptSemesterId] = useState('');
  const [transcriptPdfUrl, setTranscriptPdfUrl] = useState(null);
  const [loadingTranscriptPdf, setLoadingTranscriptPdf] = useState(false);
  const [transcriptError, setTranscriptError] = useState(null);

  const showToast = (message, type = 'success', username = '') => {
    setToast({ message, type, username });
    setTimeout(() => {
      setToast(null);
    }, 8000);
  };

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    registration_number: '',
    cdacc_registration_number: '',
    role: 'STUDENT',
    assigned_units: [],
    assigned_courses: [],
    course: '',
    semester: '',
    intake: 'JANUARY',
    first_name: '',
    last_name: ''
  });

  const [filterCourse, setFilterCourse] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [listSchoolFilter, setListSchoolFilter] = useState('');
  const [listCourseFilter, setListCourseFilter] = useState('');
  const [listIntakeFilter, setListIntakeFilter] = useState('');
  const [expandedSemesters, setExpandedSemesters] = useState({}); // { semesterId: true }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/list-all/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const selectedCourseObj = courses.find(c => c.id.toString() === newUser.course?.toString());
  const isLevel5Or6 = selectedCourseObj?.level === 'LEVEL_5' || selectedCourseObj?.level === 'LEVEL_6';

  const editingUserCourseObj = courses.find(c => c.id.toString() === editingUser?.course?.toString());
  const editingUserIsLevel5Or6 = editingUserCourseObj?.level === 'LEVEL_5' || editingUserCourseObj?.level === 'LEVEL_6';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam) setRoleFilter(roleParam);
    const searchParam = params.get('search');
    if (searchParam) setSearchTerm(searchParam);
  }, [window.location.search]);

  const filteredUsers = users.filter(u => {
    const username = u.username?.toLowerCase() || '';
    const email = u.email?.toLowerCase() || '';
    const regNo = u.registration_number?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = username.includes(search) || email.includes(search) || regNo.includes(search);
    const matchesRole = roleFilter === '' || u.role === roleFilter;
    const matchesSchool = listSchoolFilter === '' || (u.school && u.school.toString() === listSchoolFilter.toString());
    const matchesCourse = listCourseFilter === '' || (u.course && u.course.toString() === listCourseFilter.toString());
    const matchesIntake = listIntakeFilter === '' || u.intake === listIntakeFilter;
    
    return matchesSearch && matchesRole && matchesSchool && matchesCourse && matchesIntake;
  });

  const fetchUnits = async () => {
    try {
      const response = await api.get('/academic/units/');
      setUnits(response.data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchAcademicData = async () => {
    try {
      const [schoolsRes, coursesRes, semRes] = await Promise.all([
        api.get('/academic/schools/'),
        api.get('/academic/courses/'),
        api.get('/academic/semesters/')
      ]);
      setSchools(schoolsRes.data);
      setCourses(coursesRes.data);
      setSemesters(semRes.data);
    } catch (error) {
      console.error('Error fetching academic data:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchUnits(), fetchAcademicData()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (editingUser && editingUser.role === 'STUDENT') {
      const fetchStudentRegistrations = async () => {
        setLoadingRegistrations(true);
        try {
          const response = await api.get(`/academic/registrations/?student=${editingUser.id}`);
          setStudentRegistrations(response.data);
        } catch (error) {
          console.error('Error fetching registrations:', error);
        } finally {
          setLoadingRegistrations(false);
        }
      };
      fetchStudentRegistrations();
    } else {
      setStudentRegistrations([]);
    }
  }, [editingUser]);

  useEffect(() => {
    if (editingUser && editingUser.role === 'STUDENT' && editingUser.course && editingUser.semester) {
      const courseSemesterUnits = units.filter(u => 
        u.course?.toString() === editingUser.course?.toString() &&
        u.semester?.toString() === editingUser.semester?.toString()
      );
      setSelectedBatchUnits(courseSemesterUnits.map(u => u.id));

      const originalUser = users.find(u => u.id === editingUser.id);
      const hasChanged = originalUser && (
        originalUser.course?.toString() !== editingUser.course?.toString() ||
        originalUser.semester?.toString() !== editingUser.semester?.toString()
      );
      setRegisterOnSave(!!hasChanged);
    } else {
      setSelectedBatchUnits([]);
      setRegisterOnSave(false);
    }
  }, [editingUser?.course, editingUser?.semester, units, users, editingUser?.id]);

  const handleToggleRegistration = async (reg) => {
    const isApproved = reg.status === 'APPROVED';
    const action = isApproved ? 'reject' : 'approve';
    const confirmMsg = isApproved 
      ? `Are you sure you want to deactivate this student's registration for ${reg.unit_code}? This will hide the unit on their student and instructor interfaces.`
      : `Are you sure you want to activate this student's registration for ${reg.unit_code}?`;

    if (window.confirm(confirmMsg)) {
      try {
        await api.post(`/academic/registrations/${reg.id}/${action}/`);
        // Refresh registrations
        const response = await api.get(`/academic/registrations/?student=${editingUser.id}`);
        setStudentRegistrations(response.data);
      } catch (error) {
        console.error('Error toggling registration status:', error);
        alert(error.response?.data?.error || 'Failed to update registration status.');
      }
    }
  };

  const handleDirectAssign = async () => {
    if (!addUnitId) return;
    setIsAddingUnit(true);
    try {
      await api.post('/academic/registrations/direct_assign/', {
        student_id: editingUser.id,
        unit_ids: [parseInt(addUnitId)],
        semester_id: addingSemesterId ? parseInt(addingSemesterId) : undefined
      });
      // Refresh registrations
      const response = await api.get(`/academic/registrations/?student=${editingUser.id}`);
      setStudentRegistrations(response.data);
      setAddUnitId('');
      setAddingSemesterId('');
      setShowAddUnit(false);
      showToast('Unit registered successfully!', 'success');
    } catch (error) {
      console.error('Error assigning unit:', error);
      alert(error.response?.data?.error || 'Failed to register unit.');
    } finally {
      setIsAddingUnit(false);
    }
  };

  const handleBatchRegister = async () => {
    if (selectedBatchUnits.length === 0) {
      alert('Please select at least one unit to register.');
      return;
    }
    setIsBatchRegistering(true);
    try {
      await api.post('/academic/registrations/direct_assign/', {
        student_id: editingUser.id,
        unit_ids: selectedBatchUnits.map(id => parseInt(id)),
        semester_id: editingUser.semester ? parseInt(editingUser.semester) : undefined,
        replace_existing: replaceExisting
      });
      const response = await api.get(`/academic/registrations/?student=${editingUser.id}`);
      setStudentRegistrations(response.data);
      showToast(`Registered student for ${selectedBatchUnits.length} units successfully!`, 'success');
    } catch (error) {
      console.error('Error batch registering units:', error);
      alert(error.response?.data?.error || 'Failed to batch register.');
    } finally {
      setIsBatchRegistering(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const userData = { ...newUser };
    
    if (userData.role === 'STUDENT') {
      // For students, the username is replaced by the registration number if present,
      // otherwise it uses a combination of first and last names,
      // and if those are also missing, it falls back to a random student ID.
      const fName = userData.first_name ? userData.first_name.trim().toLowerCase().replace(/\s+/g, '') : '';
      const lName = userData.last_name ? userData.last_name.trim().toLowerCase().replace(/\s+/g, '') : '';
      
      if (userData.registration_number) {
        userData.username = userData.registration_number.trim().toUpperCase();
      } else if (fName || lName) {
        userData.username = fName && lName ? `${fName}.${lName}` : (fName || lName);
      } else {
        userData.username = `student.${Math.floor(1000 + Math.random() * 9000)}`;
      }
      userData.password = userData.registration_number || userData.username;
    } else {
      // For all other roles, the username is the full name (firstname.lastname)
      const fName = userData.first_name ? userData.first_name.trim().toLowerCase().replace(/\s+/g, '') : '';
      const lName = userData.last_name ? userData.last_name.trim().toLowerCase().replace(/\s+/g, '') : '';
      userData.username = `${fName}.${lName}`;
    }

    try {
      const response = await api.post('/users/create/', userData);
      setIsAdding(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        registration_number: '',
        cdacc_registration_number: '',
        role: 'STUDENT',
        assigned_units: [],
        assigned_courses: [],
        course: '',
        semester: '',
        intake: 'JANUARY',
        first_name: '',
        last_name: ''
      });
      fetchUsers();
      showToast(`Account created successfully!`, 'success', response.data.username);
    } catch (error) {
      if (error.response?.data) {
        const errors = error.response.data;
        const messages = [];
        if (typeof errors === 'object' && errors !== null) {
          for (const [key, value] of Object.entries(errors)) {
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
            const fieldError = Array.isArray(value) ? value.join(' ') : value;
            messages.push(`${fieldName}: ${fieldError}`);
          }
          alert(`Failed to create user:\n${messages.join('\n')}`);
        } else {
          alert(`Failed to create user: ${error.response.statusText || 'Internal Server Error (500)'}`);
        }
      } else {
        alert('Failed to create user. Please check if username/email already exists.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch(`/users/update/${editingUser.id}/`, {
        registration_number: editingUser.registration_number,
        cdacc_registration_number: editingUser.cdacc_registration_number,
        role: editingUser.role,
        course: editingUser.course,
        semester: editingUser.semester,
        intake: editingUser.intake,
        assigned_units: editingUser.assigned_units,
        assigned_courses: editingUser.assigned_courses,
        password: editingUser.new_password // Only send if set
      });

      if (editingUser.role === 'STUDENT' && registerOnSave && selectedBatchUnits.length > 0) {
        await api.post('/academic/registrations/direct_assign/', {
          student_id: editingUser.id,
          unit_ids: selectedBatchUnits.map(id => parseInt(id)),
          semester_id: editingUser.semester ? parseInt(editingUser.semester) : undefined,
          replace_existing: replaceExisting
        });
      }

      setEditingUser(null);
      fetchUsers();
      showToast('User profile updated successfully!', 'success');
    } catch (error) {
      if (error.response?.data) {
        const errors = error.response.data;
        const messages = [];
        if (typeof errors === 'object' && errors !== null) {
          for (const [key, value] of Object.entries(errors)) {
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
            const fieldError = Array.isArray(value) ? value.join(' ') : value;
            messages.push(`${fieldName}: ${fieldError}`);
          }
          alert(`Failed to update user:\n${messages.join('\n')}`);
        } else {
          alert(`Failed to update user: ${error.response.statusText || 'Internal Server Error (500)'}`);
        }
      } else {
        alert('Failed to update user');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/users/delete/${userId}/`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Could not delete user. They might have existing records in the system.');
      }
    }
  };

  const handleResetToRegNo = async (user) => {
    const regNo = user.registration_number || user.username;
    if (!regNo) {
      alert("No registration number or username found for this student.");
      return;
    }
    
    if (window.confirm(`Are you sure you want to reset password for student ${user.full_name || user.username} to their registration number/username: "${regNo}"?`)) {
      try {
        await api.patch(`/users/update/${user.id}/`, {
          password: regNo
        });
        showToast(`Password for ${user.username} successfully reset to "${regNo}"!`, 'success');
      } catch (error) {
        console.error('Error resetting password:', error);
        alert(error.response?.data?.detail || 'Failed to reset password.');
      }
    }
  };

  const handleLoadTranscript = async () => {
    if (!selectedTranscriptSemesterId || !selectedTranscriptStudent) return;
    setLoadingTranscriptPdf(true);
    setTranscriptError(null);
    setTranscriptPdfUrl(null);
    try {
      const response = await api.get(
        `/academic/student-marks/provisional_results_pdf/?semester_id=${selectedTranscriptSemesterId}&student_id=${selectedTranscriptStudent.id}`,
        { responseType: 'blob' }
      );
      const file = new Blob([response.data], { type: 'application/pdf' });
      setTranscriptPdfUrl(URL.createObjectURL(file));
    } catch (err) {
      console.error('Error loading transcript:', err);
      if (err.response && err.response.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            setTranscriptError(parsed.error || 'No graded results found for this student in this semester.');
          } catch {
            setTranscriptError('No approved units registered or graded for this student in this semester.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setTranscriptError('No approved units registered or graded for this student in this semester.');
      }
    } finally {
      setLoadingTranscriptPdf(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!transcriptPdfUrl || !selectedTranscriptStudent) return;
    const link = document.createElement('a');
    link.href = transcriptPdfUrl;
    const semName = semesters.find(s => s.id.toString() === selectedTranscriptSemesterId)?.name || 'Results';
    const studentName = selectedTranscriptStudent.registration_number || selectedTranscriptStudent.username;
    link.setAttribute('download', `ProvisionalResults_${studentName}_${semName.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  
  const handleGlobalStudentDownload = async (format) => {
    try {
      const url = format === 'pdf' ? '/users/export-students-pdf/' : '/users/export-students/';
      const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';
      const filename = format === 'pdf' ? 'all_students.pdf' : 'all_students.csv';

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: mimeType });
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadInstructorsPDF = async () => {
    try {
      const response = await api.get('/users/export-instructors-pdf/', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', 'instructors_list.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to generate instructor report.');
    }
  };

  if (loading) return <div>Loading user records...</div>;

  const roleColors = {
    'ADMIN': 'text-purple-600 bg-purple-50',
    'STUDENT': 'text-blue-600 bg-blue-50',
    'INSTRUCTOR': 'text-emerald-600 bg-emerald-50',
    'MANAGER': 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-8">
      {/* Add User Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-8 animate-in fade-in duration-200">
          <div className="min-h-full flex items-center justify-center py-8">
            <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 relative">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Create Account</h2>
                  <p className="text-slate-500 font-medium text-sm">Register a new student or instructor.</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 font-black">Close</button>
              </div>
              
              <form onSubmit={handleAdd} className="p-8 grid grid-cols-2 gap-6">
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name {newUser.role === 'STUDENT' ? '(Optional)' : ''}</label>
                  <input 
                    type="text"
                    required={newUser.role !== 'STUDENT'}
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    placeholder="e.g. John"
                  />
                </div>

                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name {newUser.role === 'STUDENT' ? '(Optional)' : ''}</label>
                  <input 
                    type="text"
                    required={newUser.role !== 'STUDENT'}
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    placeholder="e.g. Doe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address {newUser.role === 'STUDENT' ? '(Optional)' : ''}</label>
                  <input 
                    type="email"
                    required={newUser.role !== 'STUDENT'}
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initial Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required={newUser.role !== 'STUDENT'}
                      disabled={newUser.role === 'STUDENT'}
                      value={newUser.role === 'STUDENT' ? (newUser.registration_number || newUser.username) : newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder={newUser.role === 'STUDENT' ? "Registration Number" : "••••••••"}
                    />
                    {newUser.role !== 'STUDENT' && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0000FE] transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Role</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="MANAGER">Manager</option>
                    <option value="CDACC">CDACC Auditor</option>
                  </select>
                </div>

                {newUser.role === 'STUDENT' && (
                  <>
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration Number</label>
                      <input 
                        type="text"
                        value={newUser.registration_number}
                        onChange={(e) => setNewUser({...newUser, registration_number: e.target.value.toUpperCase()})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                        placeholder="STU/001/2024"
                      />
                    </div>

                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        CDACC Reg No.
                      </label>
                      <input 
                        type="text"
                        value={newUser.cdacc_registration_number || ''}
                        onChange={(e) => setNewUser({...newUser, cdacc_registration_number: e.target.value.toUpperCase()})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#0000FE]/20 outline-none font-bold"
                        placeholder="Optional (e.g. CDACC/001)"
                      />
                    </div>
                    
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intake</label>
                      <select 
                        value={newUser.intake}
                        onChange={(e) => setNewUser({...newUser, intake: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                      >
                        <option value="JANUARY">January Intake</option>
                        <option value="MAY">May Intake</option>
                        <option value="SEPTEMBER">September Intake</option>
                      </select>
                    </div>

                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">School Filter</label>
                      <select 
                        value={filterSchool}
                        onChange={(e) => setFilterSchool(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                      >
                        <option value="">All Schools</option>
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course</label>
                      <select 
                        value={newUser.course}
                        onChange={(e) => setNewUser({...newUser, course: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                      >
                        <option value="">Select Course</option>
                        {courses
                          .filter(c => !filterSchool || c.school.toString() === filterSchool.toString())
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semester</label>
                      <select 
                        value={newUser.semester}
                        onChange={(e) => setNewUser({...newUser, semester: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                      >
                        <option value="">Select Semester</option>
                        {semesters.filter(s => s.course.toString() === newUser.course.toString()).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {newUser.role === 'INSTRUCTOR' && (
                  <>
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">School</label>
                      <select 
                        value={filterSchool}
                        onChange={(e) => setFilterSchool(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                      >
                        <option value="">Select School</option>
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course</label>
                      <select 
                        value={newUser.course}
                        onChange={(e) => setNewUser({...newUser, course: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                      >
                        <option value="">Select Course</option>
                        {courses
                          .filter(c => !filterSchool || c.school.toString() === filterSchool.toString())
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4 col-span-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-[#0000FE] text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-[#0000FE] disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Confirm and Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-8 animate-in fade-in duration-200">
          <div className="min-h-full flex items-center justify-center py-8">
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 relative">
              <div className="p-8 border-b border-slate-50 sticky top-0 bg-white z-10 shadow-sm">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Edit User</h2>
                <p className="text-slate-500 font-medium text-sm">Updating profile for {editingUser.username}</p>
                <button onClick={() => setEditingUser(null)} className="absolute right-8 top-8 text-slate-400 hover:text-slate-600 font-black">Close</button>
              </div>
              
              <form onSubmit={handleUpdate} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reg No.</label>
                    <input 
                      type="text"
                      value={editingUser.registration_number || ''}
                      onChange={(e) => setEditingUser({...editingUser, registration_number: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
                    <select 
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="INSTRUCTOR">Instructor</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="CDACC">CDACC Auditor</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Key size={12} /> Reset Password
                    </label>
                    {editingUser.role === 'STUDENT' && (
                      <button
                        type="button"
                        onClick={() => {
                          const regNo = editingUser.registration_number || editingUser.username;
                          if (regNo) {
                            setEditingUser({
                              ...editingUser,
                              new_password: regNo
                            });
                            alert(`Password set in form to: ${regNo}. Click 'Save Changes' to confirm.`);
                          } else {
                            alert("No registration number or username found to reset to.");
                          }
                        }}
                        className="text-[9px] font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        Use Reg No / Username
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={editingUser.new_password || ''}
                      onChange={(e) => setEditingUser({...editingUser, new_password: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                      placeholder="Type new password..."
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium mt-2">Leave blank to keep current.</p>
                </div>

                {['STUDENT', 'INSTRUCTOR'].includes(editingUser.role) && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course</label>
                      <select 
                        value={editingUser.course || ''}
                        onChange={(e) => setEditingUser({...editingUser, course: e.target.value, semester: ''})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold"
                      >
                        <option value="">Select Course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {editingUser.role === 'STUDENT' && editingUser.course && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semester/Grade</label>
                        <select 
                          value={editingUser.semester || ''}
                          onChange={(e) => setEditingUser({...editingUser, semester: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold"
                        >
                          <option value="">Select Semester/Grade</option>
                          {semesters
                            .filter(s => s.course?.toString() === editingUser.course?.toString())
                            .map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))
                          }
                        </select>
                      </div>
                    )}

                    {editingUser.role === 'STUDENT' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            CDACC Reg No.
                          </label>
                          <input 
                            type="text"
                            value={editingUser.cdacc_registration_number || ''}
                            onChange={(e) => setEditingUser({...editingUser, cdacc_registration_number: e.target.value.toUpperCase()})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#0000FE]/20 outline-none font-bold"
                            placeholder="Optional (e.g. CDACC/001)"
                          />
                        </div>

                        {editingUser.course && editingUser.semester && (
                          <div className="space-y-3 bg-blue-50/30 p-4 rounded-2xl border border-blue-100 mt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">
                                Quick-Register Units
                              </label>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-[#0000FE] uppercase cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={registerOnSave}
                                    onChange={(e) => setRegisterOnSave(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-[#0000FE]"
                                  />
                                  <span>On Save</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-red-600 uppercase cursor-pointer" title="Rejects student's other active unit registrations not checked above">
                                  <input 
                                    type="checkbox"
                                    checked={replaceExisting}
                                    onChange={(e) => setReplaceExisting(e.target.checked)}
                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                  />
                                  <span>Replace Existing</span>
                                </label>
                              </div>
                            </div>
                            
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1 bg-white p-3 rounded-xl border border-slate-100">
                              {(() => {
                                const courseSemesterUnits = units.filter(u => 
                                  u.course?.toString() === editingUser.course?.toString() && 
                                  u.semester?.toString() === editingUser.semester?.toString()
                                );
                                
                                if (courseSemesterUnits.length === 0) {
                                  return <p className="text-xs text-slate-400 italic">No units found for this course & semester.</p>;
                                }
                                
                                return courseSemesterUnits.map(u => {
                                  const isChecked = selectedBatchUnits.includes(u.id);
                                  return (
                                    <label key={u.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          setSelectedBatchUnits(prev => 
                                            isChecked ? prev.filter(id => id !== u.id) : [...prev, u.id]
                                          );
                                        }}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-[#0000FE]"
                                      />
                                      <span>{u.code}: {u.name}</span>
                                    </label>
                                  );
                                });
                              })()}
                            </div>
                            
                            <button
                              type="button"
                              onClick={handleBatchRegister}
                              disabled={isBatchRegistering || selectedBatchUnits.length === 0}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow transition-all disabled:opacity-50"
                            >
                              {isBatchRegistering ? 'Registering...' : `Register & Approve Checked (${selectedBatchUnits.length})`}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {editingUser.role === 'STUDENT' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registered Units ({studentRegistrations.length})</label>
                      <button
                        type="button"
                        onClick={() => { setShowAddUnit(v => !v); setAddUnitId(''); setAddingSemesterId(''); }}
                        className="text-[9px] font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        {showAddUnit ? '✕ Cancel' : '+ Add Unit'}
                      </button>
                    </div>

                    {showAddUnit && (
                      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Register Student to a Unit</p>
                        <select
                          value={addUnitId}
                          onChange={(e) => setAddUnitId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-blue-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="">Select a unit...</option>
                          {units
                            .filter(u => u.course === editingUser.course || !editingUser.course)
                            .map(u => (
                              <option key={u.id} value={u.id}>{u.code}: {u.name}</option>
                            ))}
                        </select>
                        <select
                          value={addingSemesterId}
                          onChange={(e) => setAddingSemesterId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-blue-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="">Use student's current semester</option>
                          {semesters.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleDirectAssign}
                          disabled={!addUnitId || isAddingUnit}
                          className="w-full py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                          {isAddingUnit ? 'Registering...' : 'Register & Approve'}
                        </button>
                      </div>
                    )}

                    {loadingRegistrations ? (
                      <div className="text-xs text-slate-400 animate-pulse font-medium">Loading registered units...</div>
                    ) : studentRegistrations.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No units registered.</div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {studentRegistrations.map((reg) => (
                          <div key={reg.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-bold text-slate-700 truncate">{reg.unit_code}: {reg.unit_name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{reg.semester_name || 'No Semester'}</p>
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleToggleRegistration(reg)}
                                className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider text-[9px] transition-all shadow-sm ${
                                  reg.status === 'APPROVED' 
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700 border border-emerald-100 hover:border-red-100' 
                                    : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-100'
                                }`}
                              >
                                {reg.status === 'APPROVED' ? 'Active' : 'Inactive'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl hover:bg-slate-100">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-4 bg-[#0000FE] text-white font-black rounded-2xl shadow-lg hover:bg-[#0000FE] disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium">Manage institutional accounts and role-based permissions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleGlobalStudentDownload('pdf')}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 font-black rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all text-xs"
            title="Download Students PDF"
          >
            <FileText size={18} />
            Students PDF
          </button>
          <button 
            onClick={handleDownloadInstructorsPDF}
            className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 font-black rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all text-xs"
            title="Download Instructors PDF"
          >
            <Users size={18} />
            Instructors PDF
          </button>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-3 bg-[#0000FE] text-white font-black rounded-xl shadow-lg hover:bg-[#0000FE] text-xs">
            <Plus size={18} /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users by name, email, reg no..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none font-medium text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)} 
              className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm text-slate-600 outline-none"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="INSTRUCTOR">Instructors</option>
              <option value="ADMIN">Admins</option>
              <option value="MANAGER">Managers</option>
              <option value="CDACC">Auditors</option>
            </select>

            <select 
              value={listSchoolFilter} 
              onChange={(e) => {
                setListSchoolFilter(e.target.value);
                setListCourseFilter(''); // Reset course filter when school changes
              }} 
              className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm text-slate-600 outline-none"
            >
              <option value="">All Schools</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select 
              value={listCourseFilter} 
              onChange={(e) => setListCourseFilter(e.target.value)} 
              className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm text-slate-600 outline-none"
            >
              <option value="">All Courses</option>
              {courses
                .filter(c => !listSchoolFilter || c.school.toString() === listSchoolFilter.toString())
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>

            <select 
              value={listIntakeFilter} 
              onChange={(e) => setListIntakeFilter(e.target.value)} 
              className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm text-slate-600 outline-none"
            >
              <option value="">All Intakes</option>
              <option value="JANUARY">January</option>
              <option value="MAY">May</option>
              <option value="SEPTEMBER">September</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">User</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Registration No.</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Role</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-800">{u.full_name || u.username}</td>
                  <td className="px-8 py-5 font-mono text-xs text-slate-500">{u.registration_number || 'N/A'}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {u.role === 'STUDENT' && (
                      <>
                        <button 
                          onClick={() => {
                            setSelectedTranscriptStudent(u);
                            setSelectedTranscriptSemesterId('');
                            setTranscriptPdfUrl(null);
                            setTranscriptError(null);
                          }}
                          className="p-2 text-slate-400 hover:text-[#00b074] inline-flex items-center gap-1 text-xs font-bold mr-2 animate-in fade-in"
                          title="View provisional transcript/results"
                        >
                          <FileText size={14} /> Transcript
                        </button>
                        <button 
                          onClick={() => handleResetToRegNo(u)} 
                          className="p-2 text-slate-400 hover:text-blue-600 inline-flex items-center gap-1 text-xs font-bold mr-2 animate-in fade-in"
                          title="Reset password to registration number"
                        >
                          <Key size={14} /> Reset Pass
                        </button>
                      </>
                    )}
                    <button onClick={() => setEditingUser(u)} className="p-2 text-slate-300 hover:text-[#0000FE]" title="Edit User"><MoreVertical size={18} /></button>
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500" title="Delete User"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl border border-slate-800 z-50 animate-in slide-in-from-bottom-5 duration-300 flex items-center gap-4 max-w-md">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black tracking-tight">{toast.message}</p>
            {toast.username && (
              <div className="flex items-center gap-2 mt-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50">
                <span className="text-xs font-bold text-slate-300 truncate">
                  Username: <span className="text-white font-mono">{toast.username}</span>
                </span>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(toast.username);
                    alert(`Username "${toast.username}" copied to clipboard!`);
                  }}
                  className="text-xs font-black text-blue-400 hover:text-blue-300 transition-colors ml-auto shrink-0"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-white font-bold text-xs ml-2">✕</button>
        </div>
      )}

      {/* View Transcript Modal */}
      {selectedTranscriptStudent && (
        <div className="fixed inset-0 bg-slate-50 z-50 animate-in fade-in duration-200 flex flex-col w-screen h-screen overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-200/80 flex justify-between items-center bg-white z-10 shadow-sm shrink-0">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="text-[#0000FE]" size={24} /> Student Transcript
              </h2>
              <p className="text-slate-500 font-medium text-sm mt-0.5">
                Viewing provisional results for <span className="text-slate-800 font-bold">{selectedTranscriptStudent.full_name || selectedTranscriptStudent.username}</span> ({selectedTranscriptStudent.registration_number || 'No Reg No'})
              </p>
            </div>
            <button 
              onClick={() => {
                setSelectedTranscriptStudent(null);
                setSelectedTranscriptSemesterId('');
                setTranscriptPdfUrl(null);
                setTranscriptError(null);
              }} 
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm rounded-xl transition-all flex items-center gap-2 border border-slate-200/50"
            >
              ✕ Close Window
            </button>
          </div>

          {/* Body */}
          <div className="p-8 flex-1 flex flex-col min-h-0 space-y-6 overflow-hidden">
            {/* Control Panel */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm shrink-0">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Select Module/Semester:
                </label>
                <select
                  value={selectedTranscriptSemesterId}
                  onChange={(e) => {
                    setSelectedTranscriptSemesterId(e.target.value);
                    setTranscriptPdfUrl(null);
                    setTranscriptError(null);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">-- Select Semester --</option>
                  {semesters
                    .filter(s => s.course?.toString() === selectedTranscriptStudent.course?.toString())
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  }
                </select>
              </div>
              <button
                type="button"
                onClick={handleLoadTranscript}
                disabled={loadingTranscriptPdf || !selectedTranscriptSemesterId}
                className="px-6 py-3 bg-[#00b074] hover:bg-[#008f5d] text-white font-black rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm shrink-0 h-[46px]"
              >
                {loadingTranscriptPdf ? 'Loading...' : 'Load Transcript'}
              </button>
              {transcriptPdfUrl && (
                <button
                  type="button"
                  onClick={handleDownloadTranscript}
                  className="px-6 py-3 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-xl text-sm transition-all flex items-center gap-2 shadow-md shrink-0 h-[46px]"
                >
                  <Download size={16} />
                  Download
                </button>
              )}
            </div>

            {transcriptError && (
              <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-2xl border border-red-100 shrink-0">
                {transcriptError}
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              {transcriptPdfUrl ? (
                <iframe
                  src={transcriptPdfUrl}
                  title="Provisional Results Transcript"
                  className="w-full h-full border-none rounded-2xl"
                />
              ) : (
                !loadingTranscriptPdf && (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                      <FileText size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-700">No Transcript Loaded</h4>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto font-medium leading-relaxed">
                      Select a semester from the dropdown above and click <strong>Load Transcript</strong> to preview the results in full screen.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

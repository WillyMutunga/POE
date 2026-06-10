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
          const response = await api.get(`/academic/unit-registrations/?student=${editingUser.id}`);
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

  const handleToggleRegistration = async (reg) => {
    const isApproved = reg.status === 'APPROVED';
    const action = isApproved ? 'reject' : 'approve';
    const confirmMsg = isApproved 
      ? `Are you sure you want to deactivate this student's registration for ${reg.unit_code}? This will hide the unit on their student and instructor interfaces.`
      : `Are you sure you want to activate this student's registration for ${reg.unit_code}?`;

    if (window.confirm(confirmMsg)) {
      try {
        await api.post(`/academic/unit-registrations/${reg.id}/${action}/`);
        // Refresh registrations
        const response = await api.get(`/academic/unit-registrations/?student=${editingUser.id}`);
        setStudentRegistrations(response.data);
      } catch (error) {
        console.error('Error toggling registration status:', error);
        alert(error.response?.data?.error || 'Failed to update registration status.');
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const userData = { ...newUser };
    
    if (userData.role === 'STUDENT') {
      // For students, the username is replaced by the registration number
      userData.username = userData.registration_number ? userData.registration_number.trim().toUpperCase() : `${userData.first_name.trim().toLowerCase()}.${userData.last_name.trim().toLowerCase().replace(/\s+/g, '')}`;
      userData.password = userData.registration_number || userData.username;
    } else {
      // For all other roles, the username is the full name (firstname.lastname)
      const fName = userData.first_name.trim().toLowerCase().replace(/\s+/g, '');
      const lName = userData.last_name.trim().toLowerCase().replace(/\s+/g, '');
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
      setEditingUser(null);
      fetchUsers();
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</label>
                  <input 
                    type="text"
                    required
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    placeholder="e.g. John"
                  />
                </div>

                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name</label>
                  <input 
                    type="text"
                    required
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    placeholder="e.g. Doe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                  <input 
                    type="email"
                    required
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
                        CDACC Reg No. {isLevel5Or6 && <span className="text-red-500 font-bold">*</span>}
                      </label>
                      <input 
                        type="text"
                        required={isLevel5Or6}
                        value={newUser.cdacc_registration_number || ''}
                        onChange={(e) => setNewUser({...newUser, cdacc_registration_number: e.target.value.toUpperCase()})}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#0000FE]/20 outline-none font-bold ${isLevel5Or6 ? 'border-amber-200' : 'border-slate-100'}`}
                        placeholder={isLevel5Or6 ? "Required (e.g. CDACC/001)" : "Optional"}
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
                        onChange={(e) => setEditingUser({...editingUser, course: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold"
                      >
                        <option value="">Select Course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {editingUser.role === 'STUDENT' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          CDACC Reg No. {editingUserIsLevel5Or6 && <span className="text-red-500 font-bold">*</span>}
                        </label>
                        <input 
                          type="text"
                          required={editingUserIsLevel5Or6}
                          value={editingUser.cdacc_registration_number || ''}
                          onChange={(e) => setEditingUser({...editingUser, cdacc_registration_number: e.target.value.toUpperCase()})}
                          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#0000FE]/20 outline-none font-bold ${editingUserIsLevel5Or6 ? 'border-amber-200' : 'border-slate-100'}`}
                          placeholder={editingUserIsLevel5Or6 ? "Required (e.g. CDACC/001)" : "Optional"}
                        />
                      </div>
                    )}
                  </div>
                )}

                {editingUser.role === 'STUDENT' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registered Units ({studentRegistrations.length})</label>
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
                    <button onClick={() => setEditingUser(u)} className="p-2 text-slate-300 hover:text-[#0000FE]"><MoreVertical size={18} /></button>
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
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
    </div>
  );
};

export default UserManagement;

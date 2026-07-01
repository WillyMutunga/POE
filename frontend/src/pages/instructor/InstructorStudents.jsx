import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Users, Search, GraduationCap, Mail, UserCircle, Plus, FileText, CheckCircle, BookOpen } from 'lucide-react';
import Modal from '../../components/Modal';

const InstructorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [fullName, setFullName] = useState('');
  const [toast, setToast] = useState(null); // { message, type, username }

  const [selectedStudentForUnits, setSelectedStudentForUnits] = useState(null);
  const [studentUnitsList, setStudentUnitsList] = useState([]);
  const [loadingStudentUnits, setLoadingStudentUnits] = useState(false);
  const [checkedUnits, setCheckedUnits] = useState({});
  const [savingUnits, setSavingUnits] = useState(false);

  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [profileUnits, setProfileUnits] = useState([]);
  const [profilePortfolios, setProfilePortfolios] = useState([]);
  const [loadingProfileData, setLoadingProfileData] = useState(false);
  const [selectedUnitForNewPortfolio, setSelectedUnitForNewPortfolio] = useState('');
  const [showCreatePortfolioSection, setShowCreatePortfolioSection] = useState(false);

  const handleOpenStudentProfile = async (student) => {
    setSelectedStudentProfile(student);
    setLoadingProfileData(true);
    setShowCreatePortfolioSection(false);
    setSelectedUnitForNewPortfolio('');
    try {
      const [unitsRes, portfoliosRes] = await Promise.all([
        api.get(`/academic/units/student_units_for_assignment/?student_id=${student.id}`),
        api.get(`/poe/portfolios/?learner=${student.id}`)
      ]);
      setProfileUnits(unitsRes.data);
      setProfilePortfolios(portfoliosRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load student profile details.');
    } finally {
      setLoadingProfileData(false);
    }
  };

  const handleOpenManageUnits = async (student) => {
    setSelectedStudentForUnits(student);
    setLoadingStudentUnits(true);
    try {
      const response = await api.get(`/academic/units/student_units_for_assignment/?student_id=${student.id}`);
      setStudentUnitsList(response.data);
      const initialChecked = {};
      response.data.forEach(u => {
        initialChecked[u.id] = u.registration_status === 'APPROVED';
      });
      setCheckedUnits(initialChecked);
    } catch (err) {
      console.error(err);
      alert('Failed to load student units.');
    } finally {
      setLoadingStudentUnits(false);
    }
  };

  const handleSaveStudentUnits = async () => {
    const unitIdsToAssign = Object.keys(checkedUnits)
      .filter(id => checkedUnits[id])
      .map(id => parseInt(id));

    setSavingUnits(true);
    try {
      await api.post('/academic/registrations/direct_assign/', {
        student_id: selectedStudentForUnits.id,
        unit_ids: unitIdsToAssign
      });
      alert('Units assigned successfully!');
      setSelectedStudentForUnits(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to assign units.');
    } finally {
      setSavingUnits(false);
    }
  };

  const showToast = (message, type = 'success', username = '') => {
    setToast({ message, type, username });
    setTimeout(() => {
      setToast(null);
    }, 8000);
  };
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    registration_number: '',
    course: '',
    semester: '',
    intake: 'JANUARY'
  });

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/academic/courses/');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users/my-students/');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadPDF = async () => {
    try {
      const response = await api.get('/users/export-students-pdf/', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', 'my_students.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to generate PDF report.');
    }
  };

  const filteredStudents = students.filter(s => 
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.registration_number && s.registration_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Students</h1>
          <p className="text-slate-500 font-medium">All students currently enrolled in your units.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 font-black rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
          >
            <FileText size={20} />
            PDF Report
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#0000FE] text-white font-black rounded-xl shadow-lg shadow-blue-100 hover:bg-[#0000FE] transition-all"
          >
            <Plus size={20} />
            Register Student
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Search by name or registration number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full p-20 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <Users className="mx-auto text-slate-200 mb-6" size={64} />
            <h3 className="text-2xl font-bold text-slate-800">No Students Found</h3>
            <p className="text-slate-400 mt-2">No students match your search or you have no students enrolled.</p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div 
              key={student.id} 
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group"
            >
              <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                  <UserCircle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">
                    {student.full_name}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {student.registration_number || 'No Reg No.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Course</p>
                    <p className="text-sm font-bold text-slate-700">{student.course_display || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Semester/Module</p>
                    <p className="text-sm font-bold text-slate-700">{student.semester_display || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Email</p>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{student.email}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenManageUnits(student)}
                    className="flex-1 py-3 bg-[#0000FE]/5 hover:bg-[#0000FE]/10 text-[#0000FE] font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    Units
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenStudentProfile(student)}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <FileText size={14} />
                    Profile
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Register New Student"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Reg No.</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                value={formData.registration_number}
                onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Assign Course</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
              value={formData.course}
              onChange={(e) => setFormData({...formData, course: e.target.value})}
            >
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Intake</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                value={formData.intake}
                onChange={(e) => setFormData({...formData, intake: e.target.value})}
              >
                <option value="JANUARY">January</option>
                <option value="MAY">May</option>
                <option value="SEPTEMBER">September</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Semester</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: e.target.value})}
              >
                <option value="">Select Semester</option>
                {courses.find(c => c.id == formData.course)?.semesters?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={async () => {
              try {
                const nameParts = fullName.trim().split(/\s+/);
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                
                // Construct username from registration number
                const username = formData.registration_number 
                  ? formData.registration_number.trim().toUpperCase() 
                  : `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}`;

                const payload = {
                  ...formData,
                  username,
                  first_name: firstName,
                  last_name: lastName
                };

                const response = await api.post('/users/create/', payload);
                setShowModal(false);
                setFullName('');
                setFormData({
                  username: '',
                  email: '',
                  registration_number: '',
                  course: '',
                  semester: '',
                  intake: 'JANUARY'
                });
                fetchStudents();
                showToast('Student registered successfully!', 'success', response.data.username);
              } catch (error) {
                alert('Error registering student. Please check all fields.');
              }
            }}
            className="w-full py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#0000FE] transition-all"
          >
            Register & Enroll
          </button>
        </div>
      </Modal>

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

      {selectedStudentForUnits && (
        <Modal
          isOpen={!!selectedStudentForUnits}
          onClose={() => setSelectedStudentForUnits(null)}
          title={`Manage Units: ${selectedStudentForUnits.full_name}`}
          size="xl"
        >
          <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">
              Directly assign units to this student. Units already taught by other instructors are disabled.
            </p>

            {loadingStudentUnits ? (
              <div className="py-10 text-center animate-pulse text-[#0000FE] font-bold">Loading student units...</div>
            ) : studentUnitsList.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 bg-slate-50 p-4 rounded-xl text-center">No units defined in this student's course.</p>
            ) : (
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 max-h-96 overflow-y-auto space-y-3">
                {studentUnitsList.map((unit) => {
                  const isAlreadyApproved = unit.registration_status === 'APPROVED';
                  const isPending = unit.registration_status === 'PENDING';
                  const isOtherInstructor = !unit.can_assign;

                  return (
                    <label 
                      key={unit.id}
                      className={`flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm transition-all ${
                        isOtherInstructor ? 'opacity-50 cursor-not-allowed border-slate-100' : 'cursor-pointer hover:bg-slate-50 border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={!!checkedUnits[unit.id]}
                          disabled={isOtherInstructor}
                          onChange={(e) => setCheckedUnits({
                            ...checkedUnits,
                            [unit.id]: e.target.checked
                          })}
                          className="w-4 h-4 rounded border-slate-300 text-[#0000FE] focus:ring-[#0000FE] disabled:opacity-50"
                        />
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-tight">{unit.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400">{unit.code}</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <span className="text-[10px] font-bold text-slate-400">{unit.semester_name}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isOtherInstructor && (
                          <span className="px-2.5 py-1 bg-red-50 text-red-600 font-bold rounded-lg text-[9px] uppercase tracking-wider border border-red-100">
                            Taught by {unit.assigned_instructor}
                          </span>
                        )}
                        {!isOtherInstructor && isAlreadyApproved && (
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 font-bold rounded-lg text-[9px] uppercase tracking-wider border border-green-100">
                            Assigned (You)
                          </span>
                        )}
                        {!isOtherInstructor && isPending && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-[9px] uppercase tracking-wider border border-amber-100">
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={handleSaveStudentUnits}
                disabled={savingUnits || loadingStudentUnits}
                className="w-full py-4 bg-[#0000FE] text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all text-xs"
              >
                {savingUnits ? 'Saving Assignments...' : 'Save Unit Assignments'}
              </button>
              <button 
                type="button"
                onClick={() => setSelectedStudentForUnits(null)}
                className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs border border-slate-200"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selectedStudentProfile && (
        <Modal
          isOpen={!!selectedStudentProfile}
          onClose={() => setSelectedStudentProfile(null)}
          title={`Student Profile: ${selectedStudentProfile.full_name}`}
          size="2xl"
        >
          <div className="space-y-6">
            {/* Header profile details */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {selectedStudentProfile.registration_number || 'No Registration Number'}
                </p>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {selectedStudentProfile.full_name}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {selectedStudentProfile.course_display} • {selectedStudentProfile.semester_display}
                </p>
                <p className="text-xs text-slate-400 font-bold">{selectedStudentProfile.email}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreatePortfolioSection(!showCreatePortfolioSection)}
                className="px-5 py-3 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Plus size={16} />
                Create Portfolio
              </button>
            </div>

            {/* Create Portfolio Dropdown Section */}
            {showCreatePortfolioSection && (
              <div className="bg-blue-50/50 border border-blue-100/50 p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
                <h3 className="text-sm font-black text-slate-800">Select Unit for New Portfolio</h3>
                <div className="flex gap-4">
                  <select
                    value={selectedUnitForNewPortfolio}
                    onChange={(e) => setSelectedUnitForNewPortfolio(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="">Choose Unit</option>
                    {profileUnits
                      .filter(u => u.registration_status === 'APPROVED' && u.can_assign)
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.code}: {u.name}</option>
                      ))
                    }
                  </select>
                  <button
                    type="button"
                    disabled={!selectedUnitForNewPortfolio}
                    onClick={() => {
                      window.location.assign(`/portfolios/new?unit=${selectedUnitForNewPortfolio}&learner=${selectedStudentProfile.id}&learner_name=${encodeURIComponent(selectedStudentProfile.full_name)}`);
                    }}
                    className="px-6 py-3 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-all disabled:opacity-50"
                  >
                    Proceed
                  </button>
                </div>
                {profileUnits.filter(u => u.registration_status === 'APPROVED' && u.can_assign).length === 0 && (
                  <p className="text-[10px] text-amber-600 font-bold mt-1">No approved units taught by you are available for portfolio creation.</p>
                )}
              </div>
            )}

            {/* Units & Portfolios List */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800">Assigned Units & Portfolios</h3>

              {loadingProfileData ? (
                <div className="py-10 text-center animate-pulse text-[#0000FE] font-bold">Loading profile details...</div>
              ) : profileUnits.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 bg-slate-50 p-4 rounded-xl text-center">No units assigned to this student.</p>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {profileUnits.map(unit => {
                    const unitPortfolios = profilePortfolios.filter(p => p.unit === unit.id);
                    
                    return (
                      <div key={unit.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-black text-slate-800 leading-tight">{unit.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{unit.code} • {unit.semester_name}</p>
                          </div>
                          <div>
                            {unit.registration_status === 'APPROVED' ? (
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 font-bold rounded-lg text-[9px] uppercase tracking-wider">
                                Approved
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 font-bold rounded-lg text-[9px] uppercase tracking-wider">
                                {unit.registration_status || 'Not Registered'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Portfolio list inside this unit */}
                        <div className="space-y-2.5">
                          {unitPortfolios.length === 0 ? (
                            <p className="text-[11px] font-bold text-slate-400 italic">No portfolios initialized yet for this unit.</p>
                          ) : (
                            unitPortfolios.map(portfolio => (
                              <div key={portfolio.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                                <div className="min-w-0 flex-1 pr-3">
                                  <p className="text-xs font-bold text-slate-700 truncate">{portfolio.title}</p>
                                  <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                                    {portfolio.element_display || 'General'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 font-bold rounded-lg text-[9px] uppercase tracking-wider ${
                                    portfolio.status === 'EVALUATED' ? 'bg-green-50 text-green-700 border border-green-100' :
                                    portfolio.status === 'SUBMITTED' ? 'bg-blue-50 text-[#0000FE] border border-blue-100 animate-pulse' :
                                    'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {portfolio.status}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => window.location.assign(`/portfolios/${portfolio.id}`)}
                                    className="px-3 py-1.5 bg-slate-50 hover:bg-[#0000FE] hover:text-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all"
                                  >
                                    View / Grade
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentProfile(null)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InstructorStudents;

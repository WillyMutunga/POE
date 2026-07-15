import React, { useState, useEffect } from 'react';
import api from '../../api';
import { 
  Award, 
  Settings, 
  FileText, 
  Plus, 
  Download, 
  Trash2, 
  Search, 
  Save, 
  ChevronRight, 
  Check, 
  RotateCcw,
  Sparkles,
  Eye
} from 'lucide-react';

const Certificates = () => {
  // Tabs: 'roster', 'template', 'preview'
  const [activeTab, setActiveTab] = useState('roster');
  
  // Roster and template states
  const [certificates, setCertificates] = useState([]);
  const [template, setTemplate] = useState({
    id: null,
    college_name: "HEADWAY COLLEGE OF PROFESSIONAL STUDIES",
    college_motto: "Learning for Global Relevance",
    title: "Certificate of Competence",
    sub_title: "This is to Certify that",
    intro_text: "Has successfully completed and passed all the prescribed modules per requirement and the award of",
    modules_heading: "Modules Covered",
    footnote_text: "This Certificate was issued without any erasure or alterations whatsoever and Invalid without an Official Seal",
    director_title: "Director of Studies",
    principal_title: "Principal"
  });
  
  // Roster management
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  
  // Form states for Certificate generation
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [certRefNo, setCertRefNo] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [awardTitle, setAwardTitle] = useState('Proficiency Certificate in Computer Applications');
  const [dateEarned, setDateEarned] = useState('');
  const [printDate, setPrintDate] = useState('');
  
  // Default modules with check state
  const defaultModulesList = [
    { name: "Introduction to Computers", checked: true },
    { name: "Ms Windows", checked: true },
    { name: "Ms Access", checked: true },
    { name: "Ms Word", checked: true },
    { name: "Ms Publisher", checked: true },
    { name: "Ms PowerPoint", checked: true },
    { name: "Ms Excel", checked: true },
    { name: "Email & Internet", checked: true }
  ];
  
  const [modulesCovered, setModulesCovered] = useState(defaultModulesList);
  const [customModuleName, setCustomModuleName] = useState('');
  
  // API loading & notifications states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchTemplate();
    fetchCertificates();
    fetchStudents();
    
    // Set default dates
    const today = new Date();
    const formatted = formatDaySuffix(today);
    setDateEarned(formatted);
    setPrintDate(formatted);
  }, []);

  const formatDaySuffix = (date) => {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    
    return `${day}${suffix} ${month} ${year}`;
  };

  const fetchTemplate = async () => {
    try {
      const response = await api.get('/academic/certificate-templates/');
      if (response.data.length > 0) {
        setTemplate(response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching template:', err);
    }
  };

  const fetchCertificates = async () => {
    try {
      const response = await api.get('/academic/certificates/');
      setCertificates(response.data);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users/list-all/?role=STUDENT');
      setStudents(response.data);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);
    if (!studentId) {
      setStudentName('');
      setRegistrationNo('');
      return;
    }
    const student = students.find(s => s.id === parseInt(studentId));
    if (student) {
      setStudentName(`${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username);
      setRegistrationNo(student.registration_number || student.username);
      // Auto-generate a ref no if empty (e.g. sequence number)
      if (!certRefNo) {
        const nextNum = String(certificates.length + 1).padStart(3, '0');
        setCertRefNo(`00${nextNum}`);
      }
    }
  };

  const handleToggleModule = (index) => {
    const list = [...modulesCovered];
    list[index].checked = !list[index].checked;
    setModulesCovered(list);
  };

  const handleAddCustomModule = (e) => {
    e.preventDefault();
    if (!customModuleName.trim()) return;
    setModulesCovered([...modulesCovered, { name: customModuleName.trim(), checked: true }]);
    setCustomModuleName('');
  };

  const handleRemoveModule = (index) => {
    setModulesCovered(modulesCovered.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (template.id) {
        const response = await api.put(`/academic/certificate-templates/${template.id}/`, template);
        setTemplate(response.data);
      } else {
        const response = await api.post('/academic/certificate-templates/', template);
        setTemplate(response.data);
      }
      setSuccessMsg('Certificate template saved successfully!');
    } catch (err) {
      setErrorMsg('Failed to save template. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!studentName || !registrationNo || !certRefNo) {
      setErrorMsg('Please fill in all required fields (Name, Registration No, and Reference No).');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      student: selectedStudentId ? parseInt(selectedStudentId) : null,
      cert_ref_no: certRefNo,
      registration_no: registrationNo,
      student_name: studentName,
      award_title: awardTitle,
      modules_covered: modulesCovered.filter(m => m.checked).map(m => m.name),
      date_earned: dateEarned,
      print_date: printDate,
      qr_code_text: `https://poe.headwaycollege.ac.ke/verify/${certRefNo}`
    };

    try {
      if (editingCert) {
        await api.put(`/academic/certificates/${editingCert.id}/`, payload);
        setSuccessMsg('Certificate updated successfully!');
      } else {
        await api.post('/academic/certificates/', payload);
        setSuccessMsg('Certificate generated successfully!');
      }
      fetchCertificates();
      resetCertForm();
      setShowCreateModal(false);
    } catch (err) {
      setErrorMsg('Failed to save certificate. Please verify inputs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/academic/certificates/${id}/`);
      setSuccessMsg('Certificate deleted successfully.');
      fetchCertificates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCertificate = (cert) => {
    setEditingCert(cert);
    setSelectedStudentId(cert.student || '');
    setCertRefNo(cert.cert_ref_no);
    setRegistrationNo(cert.registration_no);
    setStudentName(cert.student_name);
    setAwardTitle(cert.award_title);
    setDateEarned(cert.date_earned);
    setPrintDate(cert.print_date);
    
    // Map current modules back to modulesCovered with checked status
    const formatted = defaultModulesList.map(item => ({
      ...item,
      checked: cert.modules_covered.includes(item.name)
    }));
    
    // Add custom modules from database
    const customOnes = cert.modules_covered
      .filter(m => !defaultModulesList.some(d => d.name === m))
      .map(m => ({ name: m, checked: true }));

    setModulesCovered([...formatted, ...customOnes]);
    setShowCreateModal(true);
  };

  const resetCertForm = () => {
    setEditingCert(null);
    setSelectedStudentId('');
    setCertRefNo('');
    setRegistrationNo('');
    setStudentName('');
    setAwardTitle('Proficiency Certificate in Computer Applications');
    setModulesCovered(defaultModulesList);
    const today = new Date();
    const formatted = formatDaySuffix(today);
    setDateEarned(formatted);
    setPrintDate(formatted);
  };

  const handleDownloadPDF = (id) => {
    window.open(`https://poe.headwaycollege.ac.ke/api/academic/certificates/${id}/download-pdf/`, '_blank');
  };

  const filteredCertificates = certificates.filter(c => 
    c.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.registration_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cert_ref_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
          <Award size={280} />
        </div>
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Award className="text-yellow-400" size={28} />
            </span>
            <span className="text-sm font-bold tracking-widest text-indigo-200 uppercase">Academic Records</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Certificates & Awards</h1>
          <p className="text-indigo-100 max-w-xl">Customize professional certificate templates and issue certificates of competence with high-resolution vector printing.</p>
        </div>
        <button 
          onClick={() => { resetCertForm(); setShowCreateModal(true); }}
          className="z-10 bg-white hover:bg-indigo-50 text-indigo-950 font-bold px-6 py-4 rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 group transform active:scale-95"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-200" />
          <span>Generate Certificate</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4 rounded-2xl font-semibold flex items-center gap-3 animate-fade-in">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 p-4 rounded-2xl font-semibold flex items-center gap-3 animate-fade-in">
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 w-max shadow-inner">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'roster' 
              ? 'bg-white text-blue-900 shadow-md' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={18} />
          <span>Issued Certificates ({certificates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('template')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'template' 
              ? 'bg-white text-blue-900 shadow-md' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings size={18} />
          <span>Template Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'preview' 
              ? 'bg-white text-blue-900 shadow-md' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye size={18} />
          <span>Layout Simulator</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by student name, registration no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-semibold transition-all"
              />
            </div>
          </div>

          {/* Roster Table */}
          {filteredCertificates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Ref No</th>
                    <th className="px-6 py-4">Registration No</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Award Title</th>
                    <th className="px-6 py-4">Modules</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4 font-mono text-blue-900">{cert.cert_ref_no}</td>
                      <td className="px-6 py-4 text-slate-500">{cert.registration_no}</td>
                      <td className="px-6 py-4 text-slate-900 font-bold">{cert.student_name}</td>
                      <td className="px-6 py-4 text-xs max-w-[200px] truncate">{cert.award_title}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {cert.modules_covered.length} Modules
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDownloadPDF(cert.id)}
                            className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                            title="Download Certificate PDF"
                          >
                            <Download size={14} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => handleEditCertificate(cert)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all text-xs font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCertificate(cert.id)}
                            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
                            title="Delete certificate"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <FileText size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-lg">No Certificates Found</p>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">Generate a new certificate or adjust your search keywords to view results.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'template' && (
        <form onSubmit={handleSaveTemplate} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="text-blue-600" size={22} />
              <span>Configure Global Template Fields</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1">Configure layout heading texts and default signature titles below. These apply to all generated PDFs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">College Name</label>
              <input
                type="text"
                value={template.college_name}
                onChange={(e) => setTemplate({ ...template, college_name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">College Motto</label>
              <input
                type="text"
                value={template.college_motto}
                onChange={(e) => setTemplate({ ...template, college_motto: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Certificate Title</label>
              <input
                type="text"
                value={template.title}
                onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Sub-Title Statement</label>
              <input
                type="text"
                value={template.sub_title}
                onChange={(e) => setTemplate({ ...template, sub_title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Introductory Roster Text</label>
              <textarea
                value={template.intro_text}
                onChange={(e) => setTemplate({ ...template, intro_text: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Modules Grid Heading</label>
              <input
                type="text"
                value={template.modules_heading}
                onChange={(e) => setTemplate({ ...template, modules_heading: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Director Title</label>
              <input
                type="text"
                value={template.director_title}
                onChange={(e) => setTemplate({ ...template, director_title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Principal Title</label>
              <input
                type="text"
                value={template.principal_title}
                onChange={(e) => setTemplate({ ...template, principal_title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Footnote Disclaimer Text</label>
              <textarea
                value={template.footnote_text}
                onChange={(e) => setTemplate({ ...template, footnote_text: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Save size={18} />
              <span>{loading ? 'Saving...' : 'Save Template Config'}</span>
            </button>
          </div>
        </form>
      )}

      {activeTab === 'preview' && (
        <div className="bg-slate-100 p-8 rounded-3xl border border-slate-200 flex justify-center overflow-x-auto">
          {/* Certificate Mock HTML Visual Layout */}
          <div className="bg-white border-8 border-double border-blue-900 p-12 w-[600px] min-h-[820px] rounded-sm relative text-center flex flex-col justify-between shadow-2xl overflow-hidden">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              <img src="/logo1.png" alt="" className="w-80 h-80 object-contain" onError={(e) => e.target.style.display = 'none'} />
            </div>

            {/* Stars Corner Ornaments */}
            <div className="absolute top-4 left-4 text-red-600 font-bold text-xl">★</div>
            <div className="absolute top-4 right-4 text-red-600 font-bold text-xl">★</div>
            <div className="absolute bottom-4 left-4 text-red-600 font-bold text-xl">★</div>
            <div className="absolute bottom-4 right-4 text-red-600 font-bold text-xl">★</div>

            {/* Ref / Reg Line */}
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
              <div>Cert Ref No: {certRefNo || '00123'}</div>
              <div>Registration No: {registrationNo || '0890'}</div>
            </div>

            {/* Logo placeholder */}
            <div className="mt-2 flex justify-center">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center">
                <Award className="text-indigo-800" size={24} />
              </div>
            </div>

            {/* Heading Headers */}
            <div className="space-y-1">
              <h2 className="text-blue-950 font-black text-base tracking-wide leading-none">{template.college_name}</h2>
              <h3 className="text-red-600 font-bold text-xs tracking-wider leading-none">OF PROFESSIONAL STUDIES</h3>
              <p className="text-slate-500 italic text-[8px]">{template.college_motto}</p>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-red-700 font-serif font-extrabold text-2xl tracking-normal">{template.title}</h1>
              <p className="text-slate-800 italic text-xs font-serif mt-1">{template.sub_title}</p>
              <div className="text-red-600 text-xs mt-1">♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦</div>
            </div>

            {/* Intro text */}
            <div className="space-y-2">
              <p className="text-slate-700 text-[10px] leading-tight max-w-[420px] mx-auto">{template.intro_text}</p>
              <h3 className="text-red-600 font-bold text-sm tracking-wide">{awardTitle}</h3>
              <h2 className="text-blue-900 font-black font-serif text-lg tracking-wide underline decoration-double decoration-indigo-200">
                {studentName || '{name}'}
              </h2>
            </div>

            {/* Modules Title */}
            <div>
              <h4 className="text-blue-900 font-extrabold text-xs tracking-wider uppercase">{template.modules_heading}</h4>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px] font-bold text-slate-800 text-left max-w-md mx-auto">
              {modulesCovered.filter(m => m.checked).map((mod, i) => (
                <div key={i} className="flex items-center gap-1.5 truncate">
                  <span className="text-red-600 text-[9px] font-bold">✔</span>
                  <span>{mod.name}</span>
                </div>
              ))}
            </div>

            {/* Earned Section */}
            <div>
              <p className="text-blue-800 italic font-serif text-[10px]">This Certification Earned on</p>
              <p className="text-blue-900 font-extrabold text-xs underline decoration-blue-500/30">{dateEarned}</p>
            </div>

            {/* Signatures & Seal */}
            <div className="flex justify-between items-end mt-4 border-t border-slate-100 pt-4 relative">
              {/* Seal placement visual */}
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center">
                <div className="w-14 h-14 bg-red-600 border-2 border-red-700 rounded-full flex items-center justify-center shadow-lg relative">
                  <div className="w-10 h-10 border border-white/20 rounded-full border-dashed"></div>
                  {/* QR widget mockup */}
                  <div className="absolute bottom-1 bg-white p-0.5 rounded-sm">
                    <div className="w-3.5 h-3.5 bg-slate-900"></div>
                  </div>
                </div>
              </div>

              <div className="text-slate-800 text-[9px] text-center border-t border-slate-400 pt-1 w-36">
                Director of Studies
              </div>

              <div className="text-slate-800 text-[9px] text-center border-t border-slate-400 pt-1 w-36">
                Principal
              </div>
            </div>

            {/* Footnote */}
            <div className="mt-4 space-y-1">
              <p className="text-[7px] text-slate-500 italic max-w-sm mx-auto">{template.footnote_text}</p>
              <p className="text-[9px] text-slate-500 font-bold">Date: {printDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Certificate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingCert ? 'Edit Certificate' : 'Generate Roster Certificate'}
                </h3>
                <p className="text-slate-500 text-xs">Fill in student details and select the modules covered in their study program.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex items-center justify-center font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              {/* Select Registered Student */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Auto-fill from Registered Students</label>
                  <select
                    value={selectedStudentId}
                    onChange={handleStudentChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                  >
                    <option value="">-- Choose student (or fill custom fields below) --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name || s.last_name ? `${s.first_name} ${s.last_name} (${s.registration_number || s.username})` : s.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference No *</label>
                  <input
                    type="text"
                    placeholder="e.g. 0010"
                    value={certRefNo}
                    onChange={(e) => setCertRefNo(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration No *</label>
                  <input
                    type="text"
                    placeholder="e.g. 0890"
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Student Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. JOHN DOE"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Award Title</label>
                  <input
                    type="text"
                    value={awardTitle}
                    onChange={(e) => setAwardTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date Earned *</label>
                  <input
                    type="text"
                    placeholder="e.g. 12th July 2026"
                    value={dateEarned}
                    onChange={(e) => setDateEarned(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Print Date *</label>
                  <input
                    type="text"
                    placeholder="e.g. 13th July 2026"
                    value={printDate}
                    onChange={(e) => setPrintDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                    required
                  />
                </div>
              </div>

              {/* Modules Selection Checklist */}
              <div className="space-y-3 border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Prescribed Modules List</label>
                  <span className="text-xs font-semibold text-slate-400">
                    {modulesCovered.filter(m => m.checked).length} selected
                  </span>
                </div>
                
                {/* Checkbox grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto p-1 bg-slate-50 border border-slate-150 rounded-2xl">
                  {modulesCovered.map((mod, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                      <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => handleToggleModule(i)}>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          mod.checked 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'border-slate-300 bg-slate-50'
                        }`}>
                          {mod.checked && <Check size={14} strokeWidth={3} />}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{mod.name}</span>
                      </div>
                      {/* Only allow deleting custom ones or non-standard list elements */}
                      <button 
                        onClick={() => handleRemoveModule(i)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-all"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Module Name input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom module covered..."
                    value={customModuleName}
                    onChange={(e) => setCustomModuleName(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomModule}
                    className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCertificate}
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all"
              >
                {loading ? 'Saving...' : editingCert ? 'Update Certificate' : 'Generate Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;

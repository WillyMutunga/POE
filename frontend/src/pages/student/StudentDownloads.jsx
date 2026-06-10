import React, { useEffect, useState, useRef } from 'react';
import api from '../../api';
import { Download, FileText, BookOpen, FolderOpen, Lock, Search, ChevronDown, AlertCircle } from 'lucide-react';

const StudentDownloads = () => {
  const [semesters, setSemesters] = useState([]);
  const [currentSemesterId, setCurrentSemesterId] = useState(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [exams, setExams] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (allExams.length >= 0) {
      filterExamsBySemester();
    }
  }, [selectedSemesterId, allExams]);

  const fetchInitialData = async () => {
    try {
      const profileRes = await api.get('/users/profile/');
      const profile = profileRes.data;

      if (profile.course) {
        // Fetch ALL semesters for the course (no active-session filter)
        const semsRes = await api.get(`/academic/semesters/?course=${profile.course}`);
        const sorted = (semsRes.data || []).sort((a, b) => {
          const num = (s) => { const m = s.name.match(/\d+/); return m ? parseInt(m[0]) : 0; };
          return num(a) - num(b);
        });
        setSemesters(sorted);

        // ✅ Fix 3+4: use effective_semester_id (derived from registrations if semester field is null)
        const effectiveId = profile.effective_semester_id || profile.semester;
        if (effectiveId) {
          setCurrentSemesterId(effectiveId);
          setSelectedSemesterId(effectiveId.toString());
        } else if (sorted.length > 0) {
          setCurrentSemesterId(sorted[0].id); // fallback to first semester
        }
      }

      setLoadingExams(true);
      const examsRes = await api.get('/academic/exams/');
      setAllExams(examsRes.data);
    } catch (err) {
      console.error('Error loading downloads:', err);
      setError('Failed to load exam papers. Please try again.');
    } finally {
      setLoading(false);
      setLoadingExams(false);
    }
  };

  const filterExamsBySemester = () => {
    if (!selectedSemesterId) {
      setExams([]);
      return;
    }
    const semesterExams = allExams.filter(
      exam => exam.unit_semester_id?.toString() === selectedSemesterId.toString()
    );
    setExams(semesterExams);
  };

  const isSemesterAccessible = (semId) => {
    const currentIdx = semesters.findIndex(s => s.id.toString() === currentSemesterId?.toString());
    const targetIdx = semesters.findIndex(s => s.id.toString() === semId.toString());
    if (currentIdx === -1) return true;
    return targetIdx <= currentIdx;
  };

  const handleSemesterSelect = (sem) => {
    if (!isSemesterAccessible(sem.id)) {
      setError(`Exam papers for ${sem.name} are not yet available — you haven't reached this module yet.`);
      setDropdownOpen(false);
      return;
    }
    setError(null);
    setSearchTerm('');
    setSelectedSemesterId(sem.id.toString());
    setDropdownOpen(false);
  };

  const handleDownload = async (exam, fileType) => {
    const fileUrl = fileType === 'paper' ? exam.exam_paper : exam.marking_scheme;
    if (!fileUrl) return;

    setDownloading(`${exam.id}-${fileType}`);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = fileUrl.split('.').pop().split('?')[0] || 'pdf';
      a.download = `${exam.unit_code}_${exam.title.replace(/\s+/g, '_')}_${fileType === 'paper' ? 'ExamPaper' : 'MarkingScheme'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.open(fileUrl, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  const filteredExams = exams.filter(exam => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      exam.title?.toLowerCase().includes(term) ||
      exam.unit_name?.toLowerCase().includes(term) ||
      exam.unit_code?.toLowerCase().includes(term)
    );
  });

  const selectedSem = semesters.find(s => s.id.toString() === selectedSemesterId?.toString());
  const isLockedError = error && (error.includes('not yet available') || error.includes('not yet reached'));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Exam Downloads</h1>
        <p className="text-slate-500 font-medium mt-1">
          Download past exam papers and marking schemes by module.
        </p>
      </div>

      {/* Module Selector Card */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row items-end gap-4">

          {/* Custom Dropdown */}
          <div className="flex-1 min-w-0" ref={dropdownRef}>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Select Period:
            </label>
            <div className="relative">
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setDropdownOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-800 text-sm hover:border-[#0000FE] focus:outline-none focus:border-[#0000FE] transition-colors"
              >
                <span className={selectedSem ? 'text-slate-800' : 'text-slate-400'}>
                  {selectedSem ? selectedSem.name : '-- Select Module --'}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown List */}
              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="max-h-72 overflow-y-auto">
                    {semesters.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-400 font-medium">
                        No modules found for your course.
                      </div>
                    ) : (
                      semesters.map((sem) => {
                        const accessible = isSemesterAccessible(sem.id);
                        const isSelected = selectedSemesterId === sem.id.toString();
                        const isCurrent = currentSemesterId?.toString() === sem.id.toString();

                        return (
                          <button
                            key={sem.id}
                            type="button"
                            onClick={() => handleSemesterSelect(sem)}
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-left transition-colors border-b border-slate-50 last:border-0 ${
                              isSelected
                                ? 'bg-[#0000FE] text-white'
                                : accessible
                                ? 'text-slate-700 hover:bg-slate-50'
                                : 'text-slate-300 cursor-default'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {!accessible && <Lock size={12} className="shrink-0" />}
                              {sem.name}
                            </span>
                            {isCurrent && accessible && (
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                Current
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          {selectedSemesterId && (
            <div className="sm:w-64 shrink-0">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Search Papers
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Unit code or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:border-[#0000FE] transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error / Info Banner */}
      {error && (
        <div className={`rounded-2xl p-5 flex items-start gap-3 ${
          isLockedError
            ? 'bg-amber-50 border border-amber-200 text-amber-700'
            : 'bg-red-50 border border-red-100 text-red-700'
        }`}>
          {isLockedError
            ? <Lock size={20} className="shrink-0 mt-0.5" />
            : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
          <div>
            <p className="text-sm font-bold">{error}</p>
            {isLockedError && (
              <p className="text-xs text-amber-600 mt-1 font-medium">
                Exam papers are only available for modules you have completed or are currently enrolled in.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Exam Papers List */}
      {selectedSemesterId ? (
        loadingExams ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0000FE]"></div>
          </div>
        ) : filteredExams.length > 0 ? (
          <div className="space-y-4">
            <div className="ml-2">
              <h2 className="text-xl font-black text-slate-800">
                {selectedSem?.name} — Exam Papers
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                {filteredExams.length} paper{filteredExams.length !== 1 ? 's' : ''} available
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0000FE] group-hover:bg-[#0000FE] group-hover:text-white transition-all duration-300">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{exam.unit_code}</p>
                        <p className="text-sm font-bold text-slate-600 line-clamp-1">{exam.unit_name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                      {new Date(exam.uploaded_at).getFullYear()}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-800 mb-1 line-clamp-2">{exam.title}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-5">
                    Uploaded {new Date(exam.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {exam.instructor_name && ` · by ${exam.instructor_name}`}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                    {exam.exam_paper && (
                      <button
                        onClick={() => handleDownload(exam, 'paper')}
                        disabled={downloading === `${exam.id}-paper`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0000FE] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-60 shadow-sm shadow-blue-100"
                      >
                        {downloading === `${exam.id}-paper` ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                        Exam Paper
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
            <FolderOpen className="mx-auto text-slate-200 mb-6" size={64} />
            <h3 className="text-2xl font-bold text-slate-800">No Exam Papers Found</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto font-medium">
              {searchTerm
                ? `No exam papers match "${searchTerm}" for ${selectedSem?.name}.`
                : `There are no exam papers available for ${selectedSem?.name} yet. Check back later or contact your instructor.`}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-sm transition-all"
              >
                Clear Search
              </button>
            )}
          </div>
        )
      ) : (
        <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
          <BookOpen className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">Select a Module</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto font-medium">
            Choose a module from the dropdown to browse available exam papers and marking schemes.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentDownloads;

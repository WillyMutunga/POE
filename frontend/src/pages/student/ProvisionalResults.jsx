import React, { useEffect, useState, useRef } from 'react';
import api from '../../api';
import { FileText, Download, Eye, AlertCircle, Lock, ChevronDown } from 'lucide-react';

const ProvisionalResults = () => {
  const [semesters, setSemesters] = useState([]);
  const [currentSemesterId, setCurrentSemesterId] = useState(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchInitialData = async () => {
    try {
      const profileRes = await api.get('/users/profile/');
      setUserProfile(profileRes.data);

      if (profileRes.data.course) {
        // Fetch ALL semesters for the course (no active-session filter)
        const semsRes = await api.get(`/academic/semesters/?course=${profileRes.data.course}`);
        const sorted = (semsRes.data || []).sort((a, b) => {
          const num = (s) => { const m = s.name.match(/\d+/); return m ? parseInt(m[0]) : 0; };
          return num(a) - num(b);
        });
        setSemesters(sorted);

        // ✅ Fix 3+4: use effective_semester_id (derived from registrations if semester field is null)
        // This matches the same logic the backend uses in ExamRepository and get_student_current_semester()
        const effectiveId = profileRes.data.effective_semester_id || profileRes.data.semester;
        if (effectiveId) {
          setCurrentSemesterId(effectiveId);
          setSelectedSemesterId(effectiveId.toString());
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load course semesters.');
    } finally {
      setLoading(false);
    }
  };

  const isSemesterAccessible = (semId) => {
    const currentIdx = semesters.findIndex(s => s.id.toString() === currentSemesterId?.toString());
    const targetIdx = semesters.findIndex(s => s.id.toString() === semId.toString());
    if (currentIdx === -1) return true;
    return targetIdx <= currentIdx;
  };

  const handleSemesterSelect = (sem) => {
    if (!isSemesterAccessible(sem.id)) {
      setError(`Results for ${sem.name} are not yet available — you haven't reached this module yet.`);
      setDropdownOpen(false);
      return;
    }
    setError(null);
    setPdfUrl(null);
    setSelectedSemesterId(sem.id.toString());
    setDropdownOpen(false);
  };

  const handleViewResults = async () => {
    if (!selectedSemesterId) {
      setError('Please select a semester first.');
      return;
    }
    if (!isSemesterAccessible(parseInt(selectedSemesterId))) {
      setError('You cannot view results for a module you have not yet reached.');
      return;
    }
    setError(null);
    setLoadingPdf(true);
    try {
      const response = await api.get(
        `/academic/student-marks/provisional_results_pdf/?semester_id=${selectedSemesterId}`,
        { responseType: 'blob' }
      );
      const file = new Blob([response.data], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(file));
    } catch (err) {
      if (err.response && err.response.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            setError(parsed.error || 'No graded results found for this semester.');
          } catch {
            setError('No approved units registered or graded for this semester.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setError('No approved units registered or graded for this semester.');
      }
      setPdfUrl(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadResults = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    const semName = semesters.find(s => s.id.toString() === selectedSemesterId)?.name || 'Results';
    link.setAttribute('download', `ProvisionalResults_${userProfile?.registration_number || 'Student'}_${semName.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE]"></div>
      </div>
    );
  }

  const selectedSem = semesters.find(s => s.id.toString() === selectedSemesterId);
  const isLockedError = error && (error.includes('not yet available') || error.includes('not yet reached'));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Provisional Results</h1>
        <p className="text-slate-500 font-medium mt-1">
          Select a module to review your official provisional transcript.
        </p>
      </div>

      {/* Control Card */}
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

          {/* Buttons */}
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleViewResults}
              disabled={loadingPdf || !selectedSemesterId}
              className="px-7 py-3 bg-[#00b074] hover:bg-[#008f5d] text-white font-black rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <Eye size={17} />
              {loadingPdf ? 'Loading...' : 'View Results'}
            </button>

            {pdfUrl && (
              <button
                onClick={handleDownloadResults}
                className="px-7 py-3 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
              >
                <Download size={17} />
                Download
              </button>
            )}
          </div>
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
                Results for upcoming modules will become available once you've been enrolled and graded for those modules.
              </p>
            )}
          </div>
        </div>
      )}

      {/* PDF Viewer / Placeholder */}
      {pdfUrl ? (
        <div className="bg-slate-100 rounded-[32px] p-2 border border-slate-200 overflow-hidden shadow-inner h-[80vh]">
          <iframe
            src={pdfUrl}
            title="Provisional Results Transcript"
            className="w-full h-full rounded-[24px]"
          />
        </div>
      ) : (
        !loadingPdf && (
          <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
            <FileText className="mx-auto text-slate-200 mb-6" size={64} />
            <h3 className="text-2xl font-bold text-slate-800">Transcript Preview</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto font-medium">
              {selectedSem
                ? <>Select a module and click <strong>View Results</strong> to display your transcript.</>
                : 'Select a module above to get started.'}
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default ProvisionalResults;

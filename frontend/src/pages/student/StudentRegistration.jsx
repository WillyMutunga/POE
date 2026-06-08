import React, { useEffect, useState } from 'react';
import api from '../../api';
import { BookOpen, Layers, CheckCircle, ChevronRight, Clock, AlertTriangle, XCircle, ClipboardCheck } from 'lucide-react';
import Modal from '../../components/Modal';

const StudentRegistration = () => {
  const [availableUnits, setAvailableUnits] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(null); // { name, units }
  const [selectedUnitIds, setSelectedUnitIds] = useState({}); // { [unitId]: boolean }
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchRegistrationData();
  }, []);

  const fetchRegistrationData = async () => {
    try {
      const profileRes = await api.get('/users/profile/');
      if (profileRes.data.semester) {
        setSelectedLevelId(profileRes.data.semester.toString());
      }

      const [unitsRes, semsRes] = await Promise.all([
        api.get('/academic/units/registration_list/'),
        profileRes.data.course
          // ✅ Fix 5: use all-semesters endpoint instead of course detail (which filters to active sessions only)
          ? api.get(`/academic/semesters/?course=${profileRes.data.course}`)
          : Promise.resolve({ data: [] })
      ]);

      setAvailableUnits(unitsRes.data);
      const sorted = (semsRes.data || []).sort((a, b) => {
        const num = (s) => { const m = s.name.match(/\d+/); return m ? parseInt(m[0]) : 0; };
        return num(a) - num(b);
      });
      setSemesters(sorted);
    } catch (error) {
      console.error('Error fetching registration data:', error);
      showToast('Failed to load available units or course modules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationList = async () => {
    try {
      const response = await api.get('/academic/units/registration_list/');
      setAvailableUnits(response.data);
    } catch (error) {
      console.error('Error fetching registration list:', error);
    }
  };

  // Group units by semester/module name
  const semestersGroup = availableUnits.reduce((acc, unit) => {
    const semName = unit.semester_name || 'Unassigned Semester';
    if (!acc[semName]) {
      acc[semName] = {
        name: semName,
        units: []
      };
    }
    acc[semName].units.push(unit);
    return acc;
  }, {});

  const handleOpenSemesterModal = (sem) => {
    setSelectedSemester(sem);
    // Initialize checked states with currently registered units (pending or approved)
    const initialChecked = {};
    sem.units.forEach(u => {
      if (u.registration_status === 'PENDING' || u.registration_status === 'APPROVED') {
        initialChecked[u.id] = true;
      } else {
        initialChecked[u.id] = false;
      }
    });
    setSelectedUnitIds(initialChecked);
  };

  const handleSubmitRegistration = async () => {
    if (!selectedLevelId) {
      showToast('Please select your Level of Study/Semester first.', 'error');
      return;
    }

    const unitIdsToRegister = Object.keys(selectedUnitIds)
      .filter(id => selectedUnitIds[id])
      .map(id => parseInt(id));

    // Filter out units that are already approved or pending (so we only submit new ones)
    const newUnitIds = unitIdsToRegister.filter(uid => {
      const unit = selectedSemester.units.find(u => u.id === uid);
      return !unit || (unit.registration_status !== 'PENDING' && unit.registration_status !== 'APPROVED');
    });

    if (newUnitIds.length === 0) {
      showToast('No new units selected to register.', 'info');
      setSelectedSemester(null);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/academic/registrations/bulk_register/', {
        unit_ids: newUnitIds,
        semester_id: parseInt(selectedLevelId)
      });
      showToast('Unit registration submitted successfully! Pending instructor approval.');
      setSelectedSemester(null);
      fetchRegistrationList();
    } catch (error) {
      console.error('Registration submit error:', error);
      showToast(error.response?.data?.error || 'Failed to submit unit registration.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Unit Registration</h1>
        <p className="text-slate-500 font-medium mt-1">
          Select modules/semesters to register for your active academic units.
        </p>
      </div>

      {/* Level of Study Dropdown Section */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-4 max-w-xl">
        <label htmlFor="level-of-study" className="block text-sm font-black text-slate-800 uppercase tracking-wider">
          Current Level of Study (Target Semester/Module)
        </label>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Specify which module/semester you are registering these units for. Approved units will appear under this module on your dashboard.
        </p>
        <select
          id="level-of-study"
          value={selectedLevelId}
          onChange={(e) => setSelectedLevelId(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0000FE]"
        >
          <option value="">-- Select Target Module/Semester --</option>
          {semesters.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {Object.keys(semestersGroup).length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
          <BookOpen className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">No Units Available</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">
            There are no units available for registration in your course or you have completed all units.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.values(semestersGroup).map((sem) => {
            const approvedCount = sem.units.filter(u => u.registration_status === 'APPROVED').length;
            const pendingCount = sem.units.filter(u => u.registration_status === 'PENDING').length;
            return (
              <div 
                key={sem.name}
                onClick={() => handleOpenSemesterModal(sem)}
                className="group bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 cursor-pointer hover:border-blue-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0000FE] mb-6">
                    <Layers size={28} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">{sem.name}</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">
                    {sem.units.length} Units Available
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex flex-wrap gap-2">
                      {approvedCount > 0 && (
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 font-bold rounded-lg text-[10px] flex items-center gap-1 border border-green-100">
                          <CheckCircle size={10} />
                          {approvedCount} Registered
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px] flex items-center gap-1 border border-amber-100 animate-pulse">
                          <Clock size={10} />
                          {pendingCount} Pending
                        </span>
                      )}
                      {approvedCount === 0 && pendingCount === 0 && (
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 font-bold rounded-lg text-[10px] border border-slate-100">
                          Not Registered
                        </span>
                      )}
                    </div>

                    <div className="text-[#0000FE] group-hover:translate-x-1.5 transition-transform">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSemester && (
        <Modal
          isOpen={!!selectedSemester}
          onClose={() => setSelectedSemester(null)}
          title={`Register Units: ${selectedSemester.name}`}
          size="xl"
        >
          <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">
              Check the units you wish to register for. Units already pending or approved cannot be unchecked.
            </p>

            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 max-h-96 overflow-y-auto space-y-3">
              {selectedSemester.units.map((unit) => {
                const isApproved = unit.registration_status === 'APPROVED';
                const isPending = unit.registration_status === 'PENDING';
                const isRejected = unit.registration_status === 'REJECTED';
                const isDisabled = isApproved || isPending;

                return (
                  <label 
                    key={unit.id}
                    className={`flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm transition-all ${
                      isDisabled ? 'opacity-85 cursor-not-allowed border-slate-100' : 'cursor-pointer hover:bg-slate-50 border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        checked={!!selectedUnitIds[unit.id]}
                        disabled={isDisabled}
                        onChange={(e) => setSelectedUnitIds({
                          ...selectedUnitIds,
                          [unit.id]: e.target.checked
                        })}
                        className="w-4 h-4 rounded border-slate-300 text-[#0000FE] focus:ring-[#0000FE] disabled:opacity-50"
                      />
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-tight">{unit.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{unit.code}</p>
                      </div>
                    </div>

                    <div>
                      {isApproved && (
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 font-black rounded-lg text-[9px] uppercase tracking-wider border border-green-200">
                          Approved
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-black rounded-lg text-[9px] uppercase tracking-wider border border-amber-200">
                          Pending
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 font-black rounded-lg text-[9px] uppercase tracking-wider border border-red-200">
                          Rejected
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={handleSubmitRegistration}
                disabled={submitting}
                className="w-full py-4 bg-[#0000FE] text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all text-xs"
              >
                {submitting ? 'Submitting...' : 'Submit Selected Registrations'}
              </button>
              <button 
                type="button"
                onClick={() => setSelectedSemester(null)}
                className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs border border-slate-200"
              >
                Close / Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-3xl shadow-2xl border text-white z-50 animate-in slide-in-from-bottom-5 duration-300 flex items-center gap-3 font-bold text-sm ${
          toast.type === 'error' ? 'bg-red-950 border-red-800' : 'bg-slate-900 border-slate-800'
        }`}>
          {toast.type === 'error' ? <XCircle size={18} className="text-red-400" /> : <ClipboardCheck size={18} className="text-green-400" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default StudentRegistration;

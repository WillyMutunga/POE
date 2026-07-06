import React, { useEffect, useState } from 'react';
import api from '../../api';
import { ClipboardList, BookOpen, UserCheck, Save, AlertCircle, CheckCircle } from 'lucide-react';

const Gradebook = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [components, setComponents] = useState([]);
  const [students, setStudents] = useState([]);
  const [existingMarks, setExistingMarks] = useState({});
  const [studentMarksState, setStudentMarksState] = useState({});
  const [gradingRanges, setGradingRanges] = useState([]); // [{min_score, max_score, grade}]
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [validationError, setValidationError] = useState(null); // replaces alert()

  useEffect(() => {
    fetchMyUnits();
  }, []);

  const fetchMyUnits = async () => {
    try {
      const response = await api.get('/academic/units/my_units/');
      setUnits(response.data);
    } catch (err) {
      console.error('Error fetching units:', err);
      setError('Failed to load your assigned units.');
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleUnitChange = async (unitId) => {
    setSelectedUnitId(unitId);
    setSelectedUnit(null);
    setComponents([]);
    setStudents([]);
    setExistingMarks({});
    setStudentMarksState({});
    setGradingRanges([]);
    setError(null);
    setSuccessMsg(null);
    setValidationError(null);

    if (!unitId) return;

    setLoadingData(true);
    try {
      const [unitRes, compRes, marksRes] = await Promise.all([
        api.get(`/academic/units/${unitId}/`),
        api.get(`/academic/units/${unitId}/get_components/`),
        api.get(`/academic/student-marks/?unit_id=${unitId}`)  // ✅ Now server-filtered
      ]);

      setSelectedUnit(unitRes.data);
      setStudents(unitRes.data.students_detail || []);
      setComponents(compRes.data);

      if (compRes.data.length === 0) {
        setError('No mark components (e.g. CAM 1, CAM 2) are configured for this unit. Please request the Administrator to define components first.');
      }

      // Fetch grading system for the course to power live grade preview
      if (unitRes.data.course) {
        try {
          const gradingRes = await api.get(`/academic/grading/?course=${unitRes.data.course}`);
          const systems = gradingRes.data;
          if (systems.length > 0) {
            const ranges = systems[0].ranges || [];
            setGradingRanges(ranges.sort((a, b) => b.min_score - a.min_score));
          }
        } catch {
          // Grading system not configured — fallback logic will be used
        }
      }

      // Build marks state from server response (already filtered by unit_id)
      const marksMap = {};
      const stateMap = {};
      marksRes.data.forEach(m => {
        marksMap[m.student] = m;
        stateMap[m.student] = {};
        compRes.data.forEach(comp => {
          const score = m.component_marks[comp.id.toString()] || m.component_marks[comp.name] || '';
          stateMap[m.student][comp.id] = score;
        });
      });
      setExistingMarks(marksMap);

      // Fill empty values for students without marks
      unitRes.data.students_detail.forEach(stud => {
        if (!stateMap[stud.id]) {
          stateMap[stud.id] = {};
          compRes.data.forEach(comp => {
            stateMap[stud.id][comp.id] = '';
          });
        }
      });
      setStudentMarksState(stateMap);

    } catch (err) {
      console.error('Error loading gradebook data:', err);
      setError('Failed to load gradebook details for this unit.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleMarkChange = (studentId, componentId, value) => {
    const comp = components.find(c => c.id === componentId);
    const maxVal = comp ? comp.weight : 100;
    if (value !== '' && (isNaN(value) || parseFloat(value) < 0 || parseFloat(value) > maxVal)) {
      return;
    }
    setValidationError(null);
    setSuccessMsg(null);
    setStudentMarksState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [componentId]: value
      }
    }));
  };

  // Group-aware sum of scores
  const calculateLocalTotal = (studentId) => {
    if (components.length === 0) return 0;
    const marks = studentMarksState[studentId] || {};
    
    // Group scores by group_name
    const groupedScores = {};
    let standaloneTotal = 0;
    
    components.forEach(comp => {
      const score = parseFloat(marks[comp.id] || 0);
      const gName = comp.group_name?.trim().toUpperCase();
      
      if (gName) {
        if (!groupedScores[gName]) {
          groupedScores[gName] = {
            scores: [],
            maxMarks: [],
            weight: parseFloat(comp.group_weight || 0),
            formula: comp.formula || 'SUM'
          };
        }
        groupedScores[gName].scores.push(score);
        groupedScores[gName].maxMarks.push(parseFloat(comp.weight || 0));
      } else {
        standaloneTotal += score;
      }
    });
    
    let groupedTotal = 0;
    Object.keys(groupedScores).forEach(gName => {
      const gData = groupedScores[gName];
      const scores = gData.scores;
      const maxMarks = gData.maxMarks;
      const formula = gData.formula;
      const gWeight = gData.weight;
      
      if (scores.length === 0) return;
      
      let rawSum = 0;
      let rawMax = 0;
      
      if (formula === 'SUM') {
        rawSum = scores.reduce((a, b) => a + b, 0);
        rawMax = maxMarks.reduce((a, b) => a + b, 0);
      } else if (formula === 'AVERAGE') {
        rawSum = scores.reduce((a, b) => a + b, 0) / scores.length;
        rawMax = maxMarks.reduce((a, b) => a + b, 0) / maxMarks.length;
      } else if (formula === 'BEST_OF') {
        let bestPct = -1;
        for (let i = 0; i < scores.length; i++) {
          const pct = maxMarks[i] > 0 ? (scores[i] / maxMarks[i]) : 0;
          if (pct > bestPct) {
            bestPct = pct;
            rawSum = scores[i];
            rawMax = maxMarks[i];
          }
        }
      } else {
        rawSum = scores.reduce((a, b) => a + b, 0);
        rawMax = maxMarks.reduce((a, b) => a + b, 0);
      }
      
      const weightedScore = rawMax > 0 ? (rawSum / rawMax) * gWeight : 0;
      groupedTotal += weightedScore;
    });
    
    const grandTotal = standaloneTotal + groupedTotal;
    return Math.round(grandTotal * 100) / 100;
  };

  // Live grade derived from total — mirrors backend logic
  const calculateLiveGrade = (total) => {
    if (gradingRanges.length > 0) {
      const range = gradingRanges.find(r => total >= r.min_score && total <= r.max_score);
      return range ? range.grade : '—';
    }
    // Standard fallback
    if (total >= 80) return 'AM';
    if (total >= 65) return 'P';
    if (total >= 50) return 'C';
    return 'NYC';
  };

  const gradeColor = (grade) => {
    switch (grade) {
      case 'AM': return 'bg-green-50 text-green-700';
      case 'P':  return 'bg-blue-50 text-blue-700';
      case 'C':  return 'bg-indigo-50 text-indigo-700';
      case 'NYC': return 'bg-red-50 text-red-700';
      default:   return 'bg-slate-100 text-slate-500';
    }
  };

  const handleSaveMarks = async (studentId) => {
    setError(null);
    setSuccessMsg(null);
    setValidationError(null);
    const marks = studentMarksState[studentId] || {};

    const emptyComponents = components.filter(comp => marks[comp.id] === '' || marks[comp.id] === undefined);
    if (emptyComponents.length > 0) {
      setValidationError(`Please fill in marks for all components before saving. Missing: ${emptyComponents.map(c => c.name).join(', ')}`);
      return;
    }

    setSavingStudentId(studentId);
    try {
      const response = await api.post('/academic/student-marks/enter_marks/', {
        student_id: studentId,
        unit_id: parseInt(selectedUnitId),
        marks: marks
      });

      const updatedMark = response.data;
      setExistingMarks(prev => ({ ...prev, [studentId]: updatedMark }));
      setSuccessMsg(`Marks for ${updatedMark.student_name} saved — Grade: ${updatedMark.grade}`);
    } catch (err) {
      console.error('Error saving student marks:', err);
      setError(err.response?.data?.error || 'Failed to save student marks.');
    } finally {
      setSavingStudentId(null);
    }
  };

  if (loadingUnits) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Gradebook</h1>
        <p className="text-slate-500 font-medium mt-1">
          Record component scores and calculate weighted unit marks for enrolled students.
        </p>
      </div>

      {/* Unit Selector */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full md:w-96 space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Select Assigned Unit:</label>
          <select
            value={selectedUnitId}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0000FE]"
          >
            <option value="">-- Choose Unit --</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code}: {u.name} ({u.semester_name || 'Unassigned'})
              </option>
            ))}
          </select>
        </div>

        {selectedUnit && (
          <div className="flex flex-wrap gap-4 text-xs font-black uppercase text-slate-500">
            <span className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-[#0000FE]">
              {selectedUnit.course_name}
            </span>
            <span className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600">
              {students.length} Enrolled
            </span>
            {gradingRanges.length > 0 && (
              <span className="px-4 py-2 bg-green-50 border border-green-100 rounded-xl text-green-700">
                Custom Grading
              </span>
            )}
          </div>
        )}
      </div>

      {/* Banners */}
      {validationError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-700">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-bold">{validationError}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-emerald-700">
          <CheckCircle size={20} className="shrink-0" />
          <p className="text-sm font-bold">{successMsg}</p>
        </div>
      )}

      {/* Gradebook Table */}
      {loadingData ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0000FE]"></div>
        </div>
      ) : selectedUnitId ? (
        students.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
            <UserCheck className="mx-auto text-slate-200 mb-6" size={64} />
            <h3 className="text-2xl font-bold text-slate-800">No Students Enrolled</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">
              There are currently no students registered or assigned to this academic unit.
            </p>
          </div>
        ) : components.length > 0 ? (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-6">Student details</th>
                    {components.map((comp) => (
                      <th key={comp.id} className="p-6 text-center w-36">
                        {comp.name}
                        {/* ✅ Fixed: was (%) which was misleading — now shows / weight */}
                        <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">/ {comp.weight}</span>
                      </th>
                    ))}
                    <th className="p-6 text-center w-36">Total</th>
                    {/* ✅ Fix 2: Live Grade column (updates as you type) */}
                    <th className="p-6 text-center w-28">
                      Live Grade
                      <span className="block text-[9px] font-semibold text-slate-300 normal-case tracking-normal mt-0.5">updates as you type</span>
                    </th>
                    <th className="p-6 text-center w-28">Saved Grade</th>
                    <th className="p-6 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student) => {
                    const localTotal = calculateLocalTotal(student.id);
                    const liveGrade = calculateLiveGrade(localTotal);
                    const savedMark = existingMarks[student.id];
                    const rowMarks = studentMarksState[student.id] || {};

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                          <p className="font-bold text-slate-800">
                            {student.first_name || student.last_name
                              ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                              : student.username}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                            Reg: <span className="font-bold text-slate-500">{student.username}</span>
                          </p>
                        </td>
                        {components.map((comp) => (
                          <td key={comp.id} className="p-6">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                placeholder="0"
                                value={rowMarks[comp.id] !== undefined ? rowMarks[comp.id] : ''}
                                onChange={(e) => handleMarkChange(student.id, comp.id, e.target.value)}
                                className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0000FE]"
                                min="0"
                                max={comp.weight}
                              />
                            </div>
                          </td>
                        ))}
                        {/* Total */}
                        <td className="p-6 text-center">
                          <span className="text-sm font-black text-slate-800">{localTotal}</span>
                        </td>
                        {/* ✅ Fix 2: Live grade — updates in real time as scores are typed */}
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${gradeColor(liveGrade)}`}>
                            {liveGrade}
                          </span>
                        </td>
                        {/* Saved grade from last successful save */}
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${gradeColor(savedMark?.grade)}`}>
                            {savedMark?.grade || '—'}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <button
                            onClick={() => handleSaveMarks(student.id)}
                            disabled={savingStudentId === student.id}
                            className="p-3 bg-[#0000FE] hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-50 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center mx-auto"
                            title="Save Marks"
                          >
                            {savingStudentId === student.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null
      ) : (
        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
          <BookOpen className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">Select a Unit</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">
            Choose one of your assigned units above to open the student grade spreadsheet.
          </p>
        </div>
      )}
    </div>
  );
};

export default Gradebook;

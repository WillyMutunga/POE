import React, { useEffect, useState } from 'react';
import api from '../../api';
import { ClipboardList, Plus, Trash2, AlertCircle, CheckCircle, Save } from 'lucide-react';

const MarkComponents = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);

  const [components, setComponents] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const courseRes = await api.get('/academic/courses/');
      setCourses(courseRes.data);

      const unitRes = await api.get('/academic/units/');
      // Filter out unapproved units for simplicity (or load all)
      setUnits(unitRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load courses or units.');
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedUnitId('');
    setSelectedUnit(null);
    setComponents([]);
    setError(null);
    setSuccess(null);

    if (!courseId) {
      setFilteredUnits([]);
      return;
    }

    const courseUnits = units.filter(u => u.course && u.course.toString() === courseId.toString());
    setFilteredUnits(courseUnits);
  };

  const handleUnitChange = async (unitId) => {
    setSelectedUnitId(unitId);
    setComponents([]);
    setSelectedUnit(null);
    setError(null);
    setSuccess(null);

    if (!unitId) return;

    const unitObj = filteredUnits.find(u => u.id.toString() === unitId.toString());
    setSelectedUnit(unitObj);

    setLoadingComponents(true);
    try {
      const response = await api.get(`/academic/units/${unitId}/get_components/`);
      setComponents(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch mark components for the selected unit.');
    } finally {
      setLoadingComponents(false);
    }
  };

  const handleAddComponentField = () => {
    setComponents(prev => [...prev, { name: '', weight: '', group_name: '', group_weight: '', formula: 'SUM' }]);
  };

  const handleRemoveComponentField = (index) => {
    setComponents(prev => prev.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index, field, value) => {
    setComponents(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveComponents = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate total weight: (Unique group weights) + (Standalone weights)
    const uniqueGroups = {};
    let standaloneWeight = 0;
    components.forEach(c => {
      const gName = c.group_name?.trim().toUpperCase();
      if (gName) {
        uniqueGroups[gName] = parseInt(c.group_weight || 0);
      } else {
        standaloneWeight += parseInt(c.weight || 0);
      }
    });

    const totalWeight = Object.values(uniqueGroups).reduce((sum, w) => sum + w, 0) + standaloneWeight;
    if (totalWeight !== 100 && components.length > 0) {
      setError(`Aggregated weight must sum to exactly 100%. Current sum is: ${totalWeight}% (Unique group weights sum + standalone weights)`);
      return;
    }

    // Validate that all fields have names and weights
    let hasInvalid = false;
    components.forEach(c => {
      if (!c.name.trim() || !c.weight) {
        hasInvalid = true;
      }
      if (c.group_name?.trim() && !c.group_weight) {
        hasInvalid = true;
      }
    });

    if (hasInvalid) {
      setError('Please fill in name, max mark, and group weight (if grouped) for all component fields.');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/academic/units/${selectedUnitId}/save_components/`, {
        components: components.map(c => ({
          name: c.name.toUpperCase(),
          weight: parseInt(c.weight),
          group_name: c.group_name || '',
          group_weight: c.group_weight ? parseInt(c.group_weight) : null,
        }))
      });
      setSuccess('Mark components saved successfully!');
      setTimeout(() => {
        setSelectedUnitId('');
        setSelectedUnit(null);
        setComponents([]);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save mark components.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to compute live total weight
  const getAggregatedWeight = () => {
    const uniqueGroups = {};
    let standaloneWeight = 0;
    components.forEach(c => {
      const gName = c.group_name?.trim().toUpperCase();
      if (gName) {
        uniqueGroups[gName] = parseInt(c.group_weight || 0);
      } else {
        standaloneWeight += parseInt(c.weight || 0);
      }
    });
    return Object.values(uniqueGroups).reduce((sum, w) => sum + w, 0) + standaloneWeight;
  };

  const totalWeight = getAggregatedWeight();

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Mark Components</h1>
        <p className="text-slate-500 font-medium mt-1">
          Define weight partitions for continuous assessment components (e.g. CAM, projects, theory tests).
        </p>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Select Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0000FE]"
          >
            <option value="">-- Choose Course --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Select Academic Unit:</label>
          <select
            value={selectedUnitId}
            onChange={(e) => handleUnitChange(e.target.value)}
            disabled={!selectedCourseId}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0000FE]"
          >
            <option value="">-- Choose Unit --</option>
            {filteredUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code}: {u.name} ({u.semester_name || 'Unassigned'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-emerald-700">
          <CheckCircle size={20} className="shrink-0" />
          <p className="text-sm font-bold">{success}</p>
        </div>
      )}

      {loadingComponents ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : selectedUnitId ? (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm max-w-5xl space-y-6">
          <div className="flex justify-between items-center ml-1">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Unit Components: {selectedUnit?.code}
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-widest">{selectedUnit?.name}</p>
            </div>
            <button
              type="button"
              onClick={handleAddComponentField}
              className="text-xs font-black text-[#0000FE] hover:underline uppercase tracking-wider"
            >
              + Add Component
            </button>
          </div>

          <form onSubmit={handleSaveComponents} className="space-y-6">
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {components.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center italic text-slate-400 text-sm">
                  No component weights configured. Marks will be entered as raw score out of 100%.
                </div>
              ) : (
                components.map((comp, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row items-stretch md:items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 animate-in fade-in duration-300">
                    <div className="flex-1 min-w-[120px] space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Component Name</label>
                      <input
                        type="text"
                        placeholder="e.g. CAM 1"
                        value={comp.name}
                        onChange={(e) => handleComponentChange(idx, 'name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000FE]/20 font-bold uppercase text-xs"
                        required
                      />
                    </div>
                    
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Mark</label>
                      <input
                        type="number"
                        placeholder="30"
                        min="1"
                        max="100"
                        value={comp.weight}
                        onChange={(e) => handleComponentChange(idx, 'weight', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000FE]/20 font-bold text-xs text-right"
                        required
                      />
                    </div>

                    <div className="w-32 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Group Name</label>
                      <input
                        type="text"
                        placeholder="e.g. CAT 1"
                        value={comp.group_name || ''}
                        onChange={(e) => handleComponentChange(idx, 'group_name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000FE]/20 font-bold uppercase text-xs text-slate-600"
                      />
                    </div>

                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Group Wt (%)</label>
                      <input
                        type="number"
                        placeholder="30"
                        min="1"
                        max="100"
                        value={comp.group_weight || ''}
                        onChange={(e) => handleComponentChange(idx, 'group_weight', e.target.value)}
                        disabled={!comp.group_name}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000FE]/20 font-bold text-xs text-right disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>

                    <div className="w-32 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Group Formula</label>
                      <select
                        value={comp.formula || 'SUM'}
                        onChange={(e) => handleComponentChange(idx, 'formula', e.target.value)}
                        disabled={!comp.group_name}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000FE]/20 font-bold text-xs text-slate-600 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="SUM">Sum</option>
                        <option value="AVERAGE">Average</option>
                        <option value="BEST_OF">Best Of</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveComponentField(idx)}
                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 mt-5 transition-all flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {components.length > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center text-sm font-black uppercase text-slate-700">
                <span>Aggregated Weight sum:</span>
                <span className={totalWeight === 100 ? 'text-green-600' : 'text-red-500'}>
                  {totalWeight}% {totalWeight === 100 ? '(Valid)' : '(Must equal 100%)'}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-[#0000FE] disabled:bg-blue-300 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Saving Weights...' : 'Save Component Weights'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
          <ClipboardList className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">Select a Unit</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">
            Choose a course and select an academic unit above to configure its continuous assessment components.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarkComponents;

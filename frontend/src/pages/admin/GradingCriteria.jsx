import React, { useEffect, useState } from 'react';
import api from '../../api';
import { ClipboardList, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const GradingCriteria = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [gradingSystem, setGradingSystem] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGrading, setLoadingGrading] = useState(false);
  
  // Form states
  const [newRange, setNewRange] = useState({ min_score: '', max_score: '', grade: '', description: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/academic/courses/');
      setCourses(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load courses.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCourseChange = async (courseId) => {
    setSelectedCourseId(courseId);
    setGradingSystem(null);
    setSelectedCourse(null);
    setError(null);
    setSuccess(null);

    if (!courseId) return;

    const courseObj = courses.find(c => c.id.toString() === courseId.toString());
    setSelectedCourse(courseObj);
    
    setLoadingGrading(true);
    try {
      const response = await api.get(`/academic/grading-systems/?course=${courseId}`);
      if (response.data.length > 0) {
        setGradingSystem(response.data[0]);
      } else {
        // Automatically create a grading system if one doesn't exist
        const createRes = await api.post('/academic/grading-systems/', {
          name: `${courseObj.name} Grading System`,
          course: courseObj.id
        });
        setGradingSystem(createRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to initialize grading system for this course.');
    } finally {
      setLoadingGrading(false);
    }
  };

  const handleAddRange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newRange.min_score || !newRange.max_score || !newRange.grade) {
      setError('Please fill in min score, max score and grade code.');
      return;
    }

    try {
      await api.post(`/academic/grading-systems/${gradingSystem.id}/add_range/`, {
        min_score: parseInt(newRange.min_score),
        max_score: parseInt(newRange.max_score),
        grade: newRange.grade.toUpperCase(),
        description: newRange.description
      });
      
      // Reload grading system ranges
      const reload = await api.get(`/academic/grading-systems/?course=${selectedCourseId}`);
      if (reload.data.length > 0) {
        setGradingSystem(reload.data[0]);
      }
      setSuccess('Grade range added successfully!');
      setNewRange({ min_score: '', max_score: '', grade: '', description: '' });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add grade range.');
    }
  };

  const handleDeleteRange = async (rangeId) => {
    if (!window.confirm('Are you sure you want to delete this grade range?')) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/academic/grading-systems/${gradingSystem.id}/delete_range/`, { range_id: rangeId });
      // Reload grading system ranges
      const reload = await api.get(`/academic/grading-systems/?course=${selectedCourseId}`);
      if (reload.data.length > 0) {
        setGradingSystem(reload.data[0]);
      }
      setSuccess('Grade range deleted successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to delete grade range.');
    }
  };

  if (loadingCourses) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Grading Criteria</h1>
        <p className="text-slate-500 font-medium mt-1">
          Configure grading systems and performance ranges for academic courses.
        </p>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full md:w-96 space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Select Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0000FE]"
          >
            <option value="">-- Select Course --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level_display})
              </option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 text-[#0000FE] rounded-xl text-xs font-black uppercase tracking-widest">
            {selectedCourse.school_name}
          </div>
        )}
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

      {loadingGrading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : selectedCourseId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns: Grading Criteria Ranges List */}
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <ClipboardList className="text-[#0000FE]" size={20} />
              Configured Grade Ranges
            </h3>

            {!gradingSystem?.ranges || gradingSystem.ranges.length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center italic text-slate-400 text-sm">
                No custom grade ranges configured yet. Fallback Level 5 & 6 defaults will apply.
              </div>
            ) : (
              <div className="space-y-3">
                {gradingSystem.ranges.map((range) => (
                  <div
                    key={range.id}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100/60 rounded-2xl shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <span className="w-14 h-10 bg-white border border-slate-150 rounded-xl flex items-center justify-center font-black text-slate-800 text-base shadow-sm">
                        {range.grade}
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-700 text-sm">
                          Score Range: <span className="text-primary-600">{range.min_score}% - {range.max_score}%</span>
                        </p>
                        <p className="text-xs font-semibold text-slate-450 mt-0.5">
                          {range.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRange(range.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Grade Range"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Add Range Form */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6 h-fit">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Plus className="text-[#0000FE]" size={20} />
              Add Grade Range
            </h3>

            <form onSubmit={handleAddRange} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Min Score (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={newRange.min_score}
                    onChange={(e) => setNewRange({ ...newRange, min_score: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Max Score (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="100"
                    value={newRange.max_score}
                    onChange={(e) => setNewRange({ ...newRange, max_score: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Grade Code (Abbr) *</label>
                <input
                  type="text"
                  placeholder="e.g. AM, P, C, NYC"
                  value={newRange.grade}
                  onChange={(e) => setNewRange({ ...newRange, grade: e.target.value.toUpperCase() })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-black uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Attained Mastery"
                  value={newRange.description}
                  onChange={(e) => setNewRange({ ...newRange, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all text-sm mt-2"
              >
                Add Grade Range
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
          <ClipboardList className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">Select a Course</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">
            Choose a course from the dropdown above to view and configure its grading details.
          </p>
        </div>
      )}
    </div>
  );
};

export default GradingCriteria;

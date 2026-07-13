import React, { useEffect, useState } from 'react';
import api from '../../api';
import { 
  FileText, Plus, Trash2, Edit3, Users, ChevronRight, 
  Check, AlertCircle, X, HelpCircle, Save, CheckCircle2 
} from 'lucide-react';

const OnlineExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [examClass, setExamClass] = useState('Computer Studies');
  const [examDuration, setExamDuration] = useState(60);
  const [examActive, setExamActive] = useState(true);
  
  // Questions states
  const [questions, setQuestions] = useState([]);
  
  // Attendance and Results states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedExamForAttendance, setSelectedExamForAttendance] = useState(null);
  const [newRegNo, setNewRegNo] = useState('');
  const [attendanceList, setAttendanceList] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/academic/online-exams/');
      setExams(response.data);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load online exams.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingExam(null);
    setExamTitle('');
    setExamClass('Computer Studies');
    setExamDuration(60);
    setExamActive(true);
    setQuestions([
      {
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', ''],
        correct_option_index: 0,
        correct_answer_text: ''
      }
    ]);
    setShowModal(true);
  };

  const handleOpenEditModal = (exam) => {
    setEditingExam(exam);
    setExamTitle(exam.title);
    setExamClass(exam.class_name);
    setExamDuration(exam.duration_minutes);
    setExamActive(exam.is_active);
    setQuestions(exam.questions || []);
    setShowModal(true);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', ''],
        correct_option_index: 0,
        correct_answer_text: ''
      }
    ]);
  };

  const handleRemoveQuestion = (qIdx) => {
    setQuestions(questions.filter((_, idx) => idx !== qIdx));
  };

  const handleQuestionTextChange = (qIdx, val) => {
    const updated = [...questions];
    updated[qIdx].question_text = val;
    setQuestions(updated);
  };

  const handleAddOption = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].options.push('');
    setQuestions(updated);
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) return; // min 2 options
    updated[qIdx].options = updated[qIdx].options.filter((_, idx) => idx !== optIdx);
    
    // adjust correct option index if it was removed or out of bounds
    if (updated[qIdx].correct_option_index >= updated[qIdx].options.length) {
      updated[qIdx].correct_option_index = 0;
    }
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIdx, optIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIdx, optIdx) => {
    const updated = [...questions];
    updated[qIdx].correct_option_index = optIdx;
    setQuestions(updated);
  };

  const handleQuestionTypeChange = (qIdx, type) => {
    const updated = [...questions];
    updated[qIdx].question_type = type;
    if (type === 'text') {
      updated[qIdx].options = [];
      updated[qIdx].correct_option_index = 0;
      updated[qIdx].correct_answer_text = updated[qIdx].correct_answer_text || '';
    } else {
      updated[qIdx].options = updated[qIdx].options?.length ? updated[qIdx].options : ['', ''];
      updated[qIdx].correct_option_index = updated[qIdx].correct_option_index || 0;
      updated[qIdx].correct_answer_text = '';
    }
    setQuestions(updated);
  };

  const handleCorrectAnswerTextChange = (qIdx, val) => {
    const updated = [...questions];
    updated[qIdx].correct_answer_text = val;
    setQuestions(updated);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!examTitle.trim()) {
      alert('Please provide an exam title.');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question.');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        alert(`Please fill in the text for question #${i + 1}.`);
        return;
      }
      if (q.question_type === 'text') {
        if (!q.correct_answer_text || !q.correct_answer_text.trim()) {
          alert(`Please fill in the correct answer response for question #${i + 1}.`);
          return;
        }
      } else {
        if (!q.options || q.options.length < 2) {
          alert(`Please add at least 2 options for question #${i + 1}.`);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].trim()) {
            alert(`Option #${j + 1} for question #${i + 1} cannot be empty.`);
            return;
          }
        }
      }
    }

    const payload = {
      title: examTitle,
      class_name: examClass,
      duration_minutes: parseInt(examDuration),
      is_active: examActive,
      questions: questions
    };

    try {
      if (editingExam) {
        await api.put(`/academic/online-exams/${editingExam.id}/`, payload);
        setSuccess('Online exam updated successfully!');
      } else {
        await api.post('/academic/online-exams/', payload);
        setSuccess('Online exam created successfully!');
      }
      setShowModal(false);
      fetchExams();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving exam:', err);
      alert('Failed to save online exam.');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this online exam? This will remove all student scores as well.')) {
      try {
        await api.delete(`/academic/online-exams/${examId}/`);
        setSuccess('Online exam deleted.');
        fetchExams();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error deleting exam:', err);
        alert('Failed to delete online exam.');
      }
    }
  };

  // Attendance & Results management
  const handleOpenAttendanceModal = async (exam) => {
    setSelectedExamForAttendance(exam);
    setShowAttendanceModal(true);
    setNewRegNo('');
    fetchAttendanceList(exam.id);
  };

  const fetchAttendanceList = async (examId) => {
    setLoadingAttendance(true);
    try {
      const response = await api.get(`/academic/online-exams/${examId}/attendance/`);
      setAttendanceList(response.data);
    } catch (err) {
      console.error('Error loading attendance list:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newRegNo.trim()) return;

    try {
      await api.post(`/academic/online-exams/${selectedExamForAttendance.id}/attendance/`, {
        registration_numbers: [newRegNo.trim()]
      });
      setNewRegNo('');
      fetchAttendanceList(selectedExamForAttendance.id);
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Failed to add student to exam list.');
    }
  };

  const handleRemoveStudent = async (regNo) => {
    if (window.confirm(`Remove ${regNo} from this exam?`)) {
      try {
        await api.delete(`/academic/online-exams/${selectedExamForAttendance.id}/remove-attendance/?student_reg_no=${encodeURIComponent(regNo)}`);
        fetchAttendanceList(selectedExamForAttendance.id);
      } catch (err) {
        console.error('Error removing student:', err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Online Exams</h1>
          <p className="text-slate-500 font-medium">Create interactive online assessments and track student scores.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-3.5 bg-[#0000FE] text-white font-black rounded-xl shadow-lg hover:bg-blue-700 text-xs uppercase tracking-wider transition-all"
        >
          <Plus size={16} />
          Create Online Exam
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 font-bold text-sm">
          <CheckCircle2 size={18} className="text-emerald-500" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-[30vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE]"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-[32px] p-20 text-center border border-slate-100 shadow-sm">
          <FileText className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">No Online Exams Created</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto font-medium">
            Create online assessments, define questions, and assign them directly to students using registration numbers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {exam.class_name}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${exam.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {exam.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 line-clamp-1">{exam.title}</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">Duration: {exam.duration_minutes} Minutes</p>
                  <p className="text-slate-400 text-xs font-bold mt-0.5">Questions: {exam.questions?.length || 0}</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center gap-2">
                <button
                  onClick={() => handleOpenAttendanceModal(exam)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold text-xs rounded-xl transition-all"
                >
                  <Users size={14} />
                  <span>Attendance ({exam.attendance_count || 0})</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(exam)}
                    className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all"
                    title="Edit Exam"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all"
                    title="Delete Exam"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Online Exam Creation/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {editingExam ? 'Edit Online Exam' : 'Create Online Exam'}
                </h2>
                <p className="text-slate-500 text-xs font-bold mt-1">Configure questions, options, and correct answers.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Title</label>
                  <input
                    type="text"
                    required
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g. Computer Studies Midterm"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Name (Temporary)</label>
                  <input
                    type="text"
                    required
                    value={examClass}
                    onChange={(e) => setExamClass(e.target.value)}
                    placeholder="e.g. Computer Studies"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                    placeholder="60"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Active Status</span>
                  <p className="text-[10px] text-slate-400 font-bold">Inactive exams cannot be started by trainees.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={examActive} 
                    onChange={(e) => setExamActive(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0000FE]"></div>
                </label>
              </div>

              {/* Questions Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Exam Questions ({questions.length})</h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-xs uppercase tracking-wider rounded-lg transition-all"
                  >
                    <Plus size={14} />
                    Add Question
                  </button>
                </div>

                <div className="space-y-8">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-5 relative">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-[#0000FE] text-white flex items-center justify-center font-black text-xs shrink-0">
                            {qIdx + 1}
                          </span>
                          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-1.5 shadow-xs">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Style</span>
                            <select
                              value={q.question_type || 'multiple_choice'}
                              onChange={(e) => handleQuestionTypeChange(qIdx, e.target.value)}
                              className="bg-transparent font-bold text-xs text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="multiple_choice">Multiple Choice</option>
                              <option value="text">Written response (Text)</option>
                            </select>
                          </div>
                        </div>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove Question"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Text</label>
                        <textarea
                          required
                          rows="2"
                          value={q.question_text}
                          onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                          placeholder="Type the question details..."
                          className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold text-slate-700"
                        />
                      </div>

                      {/* Options or Text Correct Response Section */}
                      {q.question_type === 'text' ? (
                        <div className="pl-12 space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correct Response (Case Insensitive)</label>
                          <input
                            type="text"
                            required
                            value={q.correct_answer_text || ''}
                            onChange={(e) => handleCorrectAnswerTextChange(qIdx, e.target.value)}
                            placeholder="Type the expected correct response text..."
                            className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold text-xs"
                          />
                        </div>
                      ) : (
                        <div className="pl-12 space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Options & Correct Answer</label>
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIdx)}
                              className="text-[10px] font-black text-[#0000FE] uppercase tracking-wider hover:underline"
                            >
                              + Add Option
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {(q.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-3">
                                {/* Radio for correct answer */}
                                <label className="flex items-center justify-center cursor-pointer shrink-0" title="Mark as correct answer">
                                  <input
                                    type="radio"
                                    name={`correct_${qIdx}`}
                                    checked={q.correct_option_index === optIdx}
                                    onChange={() => handleCorrectOptionChange(qIdx, optIdx)}
                                    className="sr-only"
                                  />
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    q.correct_option_index === optIdx 
                                      ? 'bg-[#0000FE] border-[#0000FE] text-white scale-110' 
                                      : 'border-slate-300 hover:border-slate-400 bg-white'
                                  }`}>
                                    {q.correct_option_index === optIdx && <Check size={12} strokeWidth={3} />}
                                  </div>
                                </label>

                                <input
                                  type="text"
                                  required
                                  value={opt}
                                  onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                                  placeholder={`Option ${optIdx + 1}`}
                                  className="flex-1 px-4 py-2.5 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold text-xs"
                                />

                                {(q.options || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(qIdx, optIdx)}
                                    className="text-slate-400 hover:text-red-500 transition-all p-1"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit footer */}
              <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl hover:bg-slate-100 uppercase tracking-widest text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#0000FE] text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 uppercase tracking-widest text-xs transition-all"
                >
                  <Save size={16} />
                  Save Online Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance & Results Modal */}
      {showAttendanceModal && selectedExamForAttendance && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Attendance & Results</h2>
                <p className="text-slate-500 text-xs font-bold mt-1">Manage exam roster for: {selectedExamForAttendance.title}</p>
              </div>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Add Student */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Add Student to Roster</h3>
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Reg Number</label>
                    <input
                      type="text"
                      required
                      value={newRegNo}
                      onChange={(e) => setNewRegNo(e.target.value)}
                      placeholder="e.g. STU/001/2024"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow transition-all"
                  >
                    Add student
                  </button>
                </form>
                
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle size={14} /> How it works
                  </h4>
                  <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
                    When you add a student's registration number to the attendance list, a notification triggers in their system bell bar.
                    The next time they log in, they will be prompted to start the online exam immediately.
                  </p>
                </div>
              </div>

              {/* Right Columns: Roster & Results */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Student Roster & Scores ({attendanceList.length})</h3>
                
                {loadingAttendance ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0000FE]"></div>
                  </div>
                ) : attendanceList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-400 font-bold text-xs italic">No students added to the attendance list yet.</p>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                          <th className="px-6 py-4">Student Reg No</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-center">Score</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs">
                        {attendanceList.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-slate-700">
                              {record.student_reg_no}
                            </td>
                            <td className="px-6 py-4 font-bold">
                              {record.has_submitted ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <Check size={12} strokeWidth={3} /> Submitted
                                </span>
                              ) : record.has_started ? (
                                <span className="text-amber-500 animate-pulse">
                                  In Progress
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  Not Started
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center font-black text-sm">
                              {record.has_submitted && record.score !== null ? (
                                <span className={record.score >= 50 ? 'text-green-600' : 'text-red-500'}>
                                  {record.score.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleRemoveStudent(record.student_reg_no)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove Student"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="px-6 py-3 bg-slate-50 text-slate-500 font-black rounded-xl hover:bg-slate-100 uppercase tracking-widest text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineExams;

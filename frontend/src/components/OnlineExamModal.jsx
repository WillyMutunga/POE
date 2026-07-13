import React, { useState, useEffect } from 'react';
import api from '../api';
import { Clock, CheckCircle, AlertTriangle, Award, X } from 'lucide-react';

const OnlineExamModal = ({ examId, onClose, examTitle, examClass, examDuration }) => {
  const [activeExam, setActiveExam] = useState(null);
  const [examAnswers, setExamAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Stages: 'instructions', 'quiz', 'submitting', 'result'
  const [stage, setStage] = useState('instructions');

  useEffect(() => {
    if (stage !== 'quiz' || timeLeft <= 0) {
      if (stage === 'quiz' && timeLeft === 0) {
        handleSubmitExam(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  const handleStartExam = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/academic/online-exams/${examId}/start/`);
      const data = response.data; // { exam_id, title, class_name, duration_minutes, started_at, questions }
      setActiveExam(data);
      setExamAnswers({});
      
      const startedAt = new Date(data.started_at);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      const totalSeconds = data.duration_minutes * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      
      setTimeLeft(remainingSeconds);
      setStage('quiz');
    } catch (err) {
      console.error('Error starting exam:', err);
      setError(err.response?.data?.error || 'Failed to start exam.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExam = async (isAuto = false) => {
    if (!isAuto && !window.confirm('Are you sure you want to submit your exam answers?')) {
      return;
    }
    setStage('submitting');
    try {
      const response = await api.post(`/academic/online-exams/${examId}/submit/`, {
        answers: examAnswers
      });
      setExamResult(response.data);
      setStage('result');
    } catch (err) {
      console.error('Error submitting exam:', err);
      setError('Failed to submit exam. Please try again.');
      setStage('quiz');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
              {examClass || 'Online Exam'}
            </span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-2">{examTitle || 'Exam Portal'}</h2>
          </div>
          
          {stage === 'quiz' && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-black text-sm transition-all ${
              timeLeft < 60 
                ? 'bg-red-50 border-red-100 text-red-600 animate-bounce' 
                : 'bg-slate-50 border-slate-100 text-slate-700'
            }`}>
              <Clock size={16} />
              <span>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {(stage === 'instructions' || stage === 'result') && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-2 hover:bg-slate-50 rounded-xl">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-2 mb-6 font-bold text-xs">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {stage === 'instructions' && (
            <div className="space-y-6">
              <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-4">
                <h3 className="text-base font-black text-blue-900 uppercase tracking-wide">Instructions & Precautionaries</h3>
                <ul className="space-y-3 text-xs text-blue-800 font-bold list-disc pl-5 leading-relaxed">
                  <li>This exam is timed. You have exactly <span className="underline">{examDuration} minutes</span> once started.</li>
                  <li>Once you click <strong>Agree & Start Exam</strong>, the timer will begin and cannot be paused or stopped.</li>
                  <li>Ensure you have a stable internet connection before starting.</li>
                  <li>Do not close this window, navigate away, or reload the page during the exam. Doing so may result in losing progress or automatic submission.</li>
                  <li>Your exam answers will be automatically submitted when the timer reaches zero.</li>
                </ul>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartExam}
                  disabled={loading}
                  className="flex-1 py-4 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all"
                >
                  {loading ? 'Starting...' : 'Agree & Start Exam'}
                </button>
              </div>
            </div>
          )}

          {stage === 'quiz' && activeExam && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                  DO NOT close this page or click away. If you leave or the timer runs out, your current answers will be submitted automatically.
                </p>
              </div>

              {activeExam.questions?.map((q, qIdx) => (
                <div key={qIdx} className="space-y-4 border-b border-slate-50 pb-6">
                  <h3 className="text-sm font-black text-slate-800 leading-relaxed">
                    <span className="text-slate-400 mr-1.5 font-bold">Question {qIdx + 1}:</span>
                    {q.question_text}
                  </h3>

                  {q.question_type === 'text' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Response</label>
                      <input
                        type="text"
                        value={examAnswers[qIdx] || ''}
                        onChange={(e) => {
                          setExamAnswers({
                            ...examAnswers,
                            [qIdx]: e.target.value
                          });
                        }}
                        placeholder="Type your response here..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold text-xs"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {q.options?.map((opt, optIdx) => {
                        const isSelected = examAnswers[qIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              setExamAnswers({
                                ...examAnswers,
                                [qIdx]: optIdx
                              });
                            }}
                            className={`w-full text-left p-4 rounded-2xl border font-bold text-xs flex justify-between items-center transition-all ${
                              isSelected
                                ? 'bg-blue-50/50 border-[#0000FE] text-[#0000FE] scale-[1.01]'
                                : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>{opt}</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#0000FE] border-[#0000FE] text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <CheckCircle size={12} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {stage === 'submitting' && (
            <div className="py-20 text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0000FE] mx-auto"></div>
              <p className="text-slate-500 font-black text-sm">Submitting your exam responses...</p>
            </div>
          )}

          {stage === 'result' && examResult && (
            <div className="py-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Award size={44} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-800">Exam Submitted!</h3>
                <p className="text-slate-400 font-bold text-sm">Here is your grading score response:</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 max-w-sm mx-auto space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score Percentage</span>
                  <h4 className="text-5xl font-black text-[#0000FE] mt-1">{examResult.score.toFixed(1)}%</h4>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between text-xs font-bold text-slate-500">
                  <span>Correct Answers:</span>
                  <span className="font-black text-slate-700">{examResult.correct_count} / {examResult.total_questions}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3.5 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                Close Portal
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {stage === 'quiz' && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
            <button
              onClick={() => handleSubmitExam(false)}
              className="w-full py-4 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow transition-all active:scale-95"
            >
              Submit Exam
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default OnlineExamModal;

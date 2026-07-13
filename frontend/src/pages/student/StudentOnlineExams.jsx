import React, { useState, useEffect } from 'react';
import api from '../../api';
import SEO from '../../components/SEO';
import OnlineExamModal from '../../components/OnlineExamModal';
import { FileText, AlertTriangle, Play, HelpCircle } from 'lucide-react';

const StudentOnlineExams = () => {
  const [pendingExams, setPendingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const fetchPendingExams = async () => {
    try {
      const response = await api.get('/academic/online-exams/my-pending/');
      setPendingExams(response.data);
    } catch (error) {
      console.error('Error fetching pending exams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingExams();
  }, []);

  const handleOpenExam = (exam) => {
    setSelectedExam(exam);
    setShowExamModal(true);
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0000FE]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 space-y-8">
      <SEO title="Online Exams" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Assigned Online Exams</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">
          Complete your online assessments before the expiration date.
        </p>
      </div>

      {pendingExams.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[32px] p-16 text-center space-y-4 shadow-xl shadow-slate-100/50">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <FileText size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-700">No Pending Online Exams</h2>
          <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto">
            You do not have any active online exams assigned at the moment. Keep learning!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {pendingExams.map((examRecord) => (
            <div 
              key={examRecord.id}
              className="bg-white border border-slate-100 rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-slate-100/40 flex flex-col md:flex-row gap-8 justify-between items-stretch"
            >
              <div className="flex-1 space-y-6">
                <div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {examRecord.exam_class}
                  </span>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-2">{examRecord.exam_title}</h2>
                  <p className="text-slate-400 font-bold text-xs mt-1">Duration Limit: {examRecord.exam_duration} Minutes</p>
                </div>

                <div className="p-6 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle size={18} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Important Instructions</h3>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-amber-800/90 font-bold space-y-2 leading-relaxed">
                    <li>This assessment is strictly timed and must be completed in one sitting.</li>
                    <li>The countdown timer begins immediately when you click <strong>Start Exam Now</strong> and cannot be paused.</li>
                    <li>Make sure you have a reliable internet connection and a quiet environment.</li>
                    <li>Do not refresh or close the page. The system auto-submits when the time limit expires.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-center shrink-0 md:border-l md:border-slate-50 md:pl-8">
                <button
                  onClick={() => handleOpenExam(examRecord)}
                  className="w-full md:w-auto px-8 py-5 bg-[#0000FE] hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 group transition-all"
                >
                  <Play size={16} className="fill-white" />
                  Start Exam Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showExamModal && selectedExam && (
        <OnlineExamModal
          examId={selectedExam.exam}
          examTitle={selectedExam.exam_title}
          examClass={selectedExam.exam_class}
          examDuration={selectedExam.exam_duration}
          onClose={() => {
            setShowExamModal(false);
            fetchPendingExams();
          }}
        />
      )}
    </div>
  );
};

export default StudentOnlineExams;

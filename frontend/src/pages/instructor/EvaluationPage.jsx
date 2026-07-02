import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  ExternalLink, 
  MessageSquare, 
  Award, 
  Eye, 
  Video, 
  Download,
  AlertCircle
} from 'lucide-react';
import FileViewer from '../../components/FileViewer';
import DiscussionThread from '../../components/DiscussionThread';

const EvaluationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rubrics, setRubrics] = useState([]);
  const [criterionScores, setCriterionScores] = useState({});
  
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isRedoRequest, setIsRedoRequest] = useState(false);
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [expandedTrials, setExpandedTrials] = useState({});

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  const fetchRubrics = async (unitId, elementId) => {
    try {
      const response = await api.get(`/academic/rubrics/?unit=${unitId}`);
      const filteredRubrics = response.data.filter(r => !r.element || r.element === elementId);
      setRubrics(filteredRubrics);
      
      const initialScores = {};
      filteredRubrics.forEach(rubric => {
        rubric.criteria.forEach(criterion => {
          initialScores[criterion.id] = false;
        });
      });
      setCriterionScores(initialScores);
    } catch (error) {
      console.error('Error fetching rubrics:', error);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await api.get(`/poe/portfolios/${id}/`);
      setPortfolio(response.data);
      if (response.data.unit) {
        fetchRubrics(response.data.unit, response.data.element);
      }
      if (response.data.assessment) {
        const assessment = response.data.assessment;
        setGrade(assessment.grade || '');
        setFeedback(assessment.feedback || '');
        setIsRedoRequest(assessment.is_redo_request || false);
        if (assessment.date) {
          setAssessmentDate(new Date(assessment.date).toISOString().split('T')[0]);
        }
        if (assessment.criterion_scores) {
          const scores = {};
          assessment.criterion_scores.forEach(score => {
            scores[score.criterion] = score.is_satisfied;
          });
          setCriterionScores(scores);
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!isRedoRequest && !grade) {
      alert('Please provide a grade or select "Request Redo".');
      return;
    }

    console.log('Submitting evaluation...', { id, grade, feedback, isRedoRequest });
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const criterionScoresList = Object.entries(criterionScores).map(([critId, isSat]) => ({
        criterion: parseInt(critId),
        is_satisfied: isSat
      }));

      await api.post('/poe/assessments/', {
        portfolio: id,
        grade: isRedoRequest ? 'REDO' : grade,
        feedback,
        is_redo_request: isRedoRequest,
        criterion_scores: criterionScoresList,
        date: assessmentDate
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Grading failed:', error);
      let errorMsg = 'Failed to submit evaluation.';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail;
        } else {
          // Handle field-specific errors
          const fields = Object.keys(error.response.data);
          if (fields.length > 0) {
            const firstField = fields[0];
            const firstError = error.response.data[firstField];
            errorMsg = `${firstField}: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
          }
        }
      }
      
      alert(`Error: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading portfolio data...</div>;
  if (!portfolio) return <div>Portfolio not found.</div>;

  const currentRound = portfolio.submission_round || 1;
  const currentEvidence = portfolio.evidence?.filter(
    (item) => item.submission_round === currentRound
  ) || [];

  const trialsMap = {};
  portfolio.evidence?.forEach((item) => {
    const round = item.submission_round || 1;
    if (round < currentRound) {
      if (!trialsMap[round]) {
        trialsMap[round] = [];
      }
      trialsMap[round].push(item);
    }
  });

  const trialRounds = Object.keys(trialsMap).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Evaluate Portfolio</h1>
          <p className="text-slate-500 font-medium">Review evidence and assign a final grade for {portfolio.learner_display}.</p>
        </div>
        <button 
          onClick={async () => {
            try {
              const response = await api.get(`/poe/portfolios/${id}/download_pdf/`, { responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `${portfolio.learner_registration_number || 'Portfolio'}.pdf`);
              document.body.appendChild(link);
              link.click();
              link.remove();
            } catch (error) {
              console.error('Download failed:', error);
              alert('Failed to download PDF');
            }
          }}
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Download size={20} className="text-[#0000FE]" />
          Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Evidence Review Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="text-primary-600" size={24} />
            Submitted Evidence
          </h2>
          
          <div className="space-y-4">
            {trialRounds.length > 0 && (
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mt-6 mb-2">
                Current Submission (Trial {currentRound})
              </h3>
            )}

            {currentEvidence.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-[32px] border border-slate-100">
                <p className="text-slate-400 font-bold">No evidence submitted for this trial yet.</p>
              </div>
            ) : (
              currentEvidence.map((item) => (
                <div key={item.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary-100 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors">
                      {item.file.match(/\.(mp4|webm|ogg|mov)$/i) ? <Video size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 line-clamp-1">{item.description}</p>
                      <p className="text-xs text-slate-400 font-medium italic">Click preview to review document</p>
                      {item.plagiarism_flags && item.plagiarism_flags.length > 0 && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-amber-800 text-[10px] w-full">
                          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-950">Duplicate File Warning</p>
                            <p className="font-medium text-amber-700">
                              Identical to file uploaded by student <strong className="text-amber-900">@{item.plagiarism_flags[0].duplicate_of_student}</strong> in <strong className="text-amber-900">{item.plagiarism_flags[0].duplicate_of_portfolio}</strong>.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => setPreviewFile({ url: item.file, title: item.description })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#0000FE] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#0000FE] hover:text-white transition-all shadow-sm"
                  >
                    <Eye size={18} />
                    Preview
                  </button>
                </div>
              ))
            )}

            {trialRounds.length > 0 && (
              <div className="space-y-4 mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Previous Trials
                </h3>
                {trialRounds.map((round) => {
                  const trialFiles = trialsMap[round];
                  const isExpanded = expandedTrials[round];
                  return (
                    <div key={round} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                      <button
                        type="button"
                        onClick={() => setExpandedTrials(prev => ({ ...prev, [round]: !prev[round] }))}
                        className="w-full flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-slate-200/80 text-slate-700 font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">
                            Trial {round}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {trialFiles.length} {trialFiles.length === 1 ? 'file' : 'files'}
                          </span>
                        </div>
                        <span className="text-[#0000FE] font-black text-xs uppercase tracking-widest flex items-center gap-1">
                          {isExpanded ? 'Hide' : 'View'}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="p-6 border-t border-slate-50 space-y-4 bg-white divide-y divide-slate-50 animate-in fade-in duration-200">
                          {trialFiles.map((item) => (
                            <div key={item.id} className="flex flex-col py-4 first:pt-0 last:pb-0 gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                    {item.file.match(/\.(mp4|webm|ogg|mov)$/i) ? <Video size={20} /> : <FileText size={20} />}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-slate-800 line-clamp-1">{item.description}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Uploaded on {new Date(item.uploaded_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setPreviewFile({ url: item.file, title: item.description })}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#0000FE] font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-[#0000FE] hover:text-white transition-all shadow-sm"
                                >
                                  <Eye size={12} />
                                  Preview
                                </button>
                              </div>
                              {item.plagiarism_flags && item.plagiarism_flags.length > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-amber-800 text-[10px]">
                                  <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-bold text-amber-950">Duplicate File Warning</p>
                                    <p className="font-medium text-amber-700">
                                      Identical to file uploaded by student <strong className="text-amber-900">@{item.plagiarism_flags[0].duplicate_of_student}</strong> in <strong className="text-amber-900">{item.plagiarism_flags[0].duplicate_of_portfolio}</strong>.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discussion Thread */}
          <div className="pt-8">
            <DiscussionThread 
              portfolioId={portfolio.id} 
              comments={portfolio.comments} 
              onCommentAdded={() => fetchPortfolio()} 
            />
          </div>
        </div>

        {/* Grading Section */}
        <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-blue-500/5 border border-slate-100 h-fit sticky top-32">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-8">
            <Award className="text-primary-600" size={24} />
            Assessment Form
          </h2>

          <form onSubmit={handleGradeSubmit} className="space-y-8">
            {rubrics.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Rubric Competence Checklist</h3>
                <div className="space-y-3">
                  {rubrics.map((rubric) => (
                    <div key={rubric.id} className="space-y-2">
                      <p className="font-bold text-xs text-slate-500 uppercase tracking-wide">{rubric.title}</p>
                      {rubric.criteria.map((criterion) => (
                        <label key={criterion.id} className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            className="w-4.5 h-4.5 rounded border-slate-300 text-[#0000FE] focus:ring-[#0000FE] mt-0.5"
                            checked={!!criterionScores[criterion.id]}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setCriterionScores(prev => {
                                const newScores = { ...prev, [criterion.id]: checked };
                                if (criterion.is_critical && !checked) {
                                  setIsRedoRequest(true);
                                }
                                return newScores;
                              });
                            }}
                          />
                          <div className="text-xs font-medium text-slate-700">
                            <span className="font-bold text-slate-800">{criterion.description}</span>
                            {criterion.is_critical && (
                              <span className="ml-2 text-[9px] font-black text-red-500 uppercase tracking-widest">
                                Critical
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 cursor-pointer hover:bg-red-100 transition-all">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                  checked={isRedoRequest}
                  onChange={(e) => setIsRedoRequest(e.target.checked)}
                />
                <div>
                  <p className="text-sm font-bold text-red-800">Request Redo</p>
                  <p className="text-[10px] font-medium text-red-600">Student will be asked to update and resubmit evidence</p>
                </div>
              </label>

              {!isRedoRequest && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-bold text-slate-700 ml-1">Grade (Pass/Fail or Mark)</label>
                  <input 
                    type="text"
                    placeholder="e.g., Pass, Distinction, or 85%"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-bold text-slate-800"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Date of Assessment</label>
                <input 
                  type="date"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-bold text-slate-800"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Feedback & Comments</label>
              <textarea 
                placeholder={isRedoRequest ? "Explain why a redo is required and what needs to be improved..." : "Provide detailed feedback for the student..."}
                rows={6}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium resize-none text-slate-800"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#0000FE] transition-all active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Submit Evaluation
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {previewFile && (
        <FileViewer 
          url={previewFile.url} 
          title={previewFile.title} 
          onClose={() => setPreviewFile(null)} 
        />
      )}
    </div>
  );
};

export default EvaluationPage;

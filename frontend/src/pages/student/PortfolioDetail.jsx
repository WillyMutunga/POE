import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Loader2,
  ArrowLeft,
  Eye,
  Video,
  Edit,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import FileViewer from '../../components/FileViewer';
import DiscussionThread from '../../components/DiscussionThread';
import { useAuth } from '../../context/AuthContext';

const PortfolioDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isResubmitMode, setIsResubmitMode] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [expandedTrials, setExpandedTrials] = useState({});
  const [verifyStatus, setVerifyStatus] = useState('');
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const [verifing, setVerifing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleVerifySubmit = async () => {
    if (!verifyStatus) return;
    setVerifing(true);
    try {
      await api.post(`/poe/portfolios/${id}/verify/`, {
        status: verifyStatus,
        feedback: verifyFeedback
      });
      alert(`Portfolio audit complete: ${verifyStatus}`);
      fetchPortfolio();
    } catch (error) {
      console.error('Verification failed:', error);
      alert(error.response?.data?.detail || 'Failed to submit verification verdict.');
    } finally {
      setVerifing(false);
    }
  };

  const handleBackClick = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      if (user?.role === 'STUDENT') {
        navigate('/portfolios');
      } else if (user?.role === 'INSTRUCTOR') {
        navigate('/units-assigned');
      } else if (['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user?.role)) {
        navigate('/admin/portfolios');
      } else if (user?.role === 'CDACC') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  const fetchPortfolio = async () => {
    try {
      const response = await api.get(`/poe/portfolios/${id}/`);
      setPortfolio(response.data);
      setEditTitle(response.data.title);
      setEditDescription(response.data.description || '');
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = (e) => {
    const selectedFiles = Array.from(e.target.files).map((file) => ({
      file,
      name: file.name.replace(/\.[^/.]+$/, ""), // default: filename without extension
      tempId: Math.random().toString(36).substring(7)
    }));
    setStagedFiles(selectedFiles);
    setShowUploadModal(true);
    e.target.value = null; // reset file input
  };

  const handleUploadStaged = async () => {
    setUploading(true);
    const maxOrder = currentEvidence.reduce((max, item) => Math.max(max, item.order || 0), 0);
    try {
      const uploadPromises = stagedFiles.map((staged, index) => {
        const formData = new FormData();
        formData.append('file', staged.file);
        formData.append('portfolio', id);
        formData.append('description', staged.name.trim() || staged.file.name);
        formData.append('order', maxOrder + index + 1);
        return api.post('/poe/evidence/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      });
      await Promise.all(uploadPromises);
      setShowUploadModal(false);
      setStagedFiles([]);
      fetchPortfolio();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload evidence. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleReorderEvidence = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentEvidence.length) return;

    const items = currentEvidence.map((item, idx) => ({
      ...item,
      order: item.order || (idx + 1)
    }));

    const tempOrder = items[index].order;
    items[index].order = items[targetIndex].order;
    items[targetIndex].order = tempOrder;

    try {
      await Promise.all([
        api.patch(`/poe/evidence/${items[index].id}/`, { order: items[index].order }),
        api.patch(`/poe/evidence/${items[targetIndex].id}/`, { order: items[targetIndex].order })
      ]);
      fetchPortfolio();
    } catch (error) {
      console.error('Error swapping evidence order:', error);
      alert('Failed to save the new arrangement. Please try again.');
    }
  };

  const handleSubmitPortfolio = async () => {
    if (!window.confirm('Are you sure you want to submit this portfolio? You will not be able to edit it after submission.')) return;
    
    try {
      await api.patch(`/poe/portfolios/${id}/`, { status: 'SUBMITTED' });
      fetchPortfolio();
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      // Update portfolio title, description, and status
      const payload = {
        title: editTitle,
        description: editDescription
      };
      if (isResubmitMode) {
        payload.status = 'SUBMITTED';
      }
      await api.patch(`/poe/portfolios/${id}/`, payload);
      
      setShowEditModal(false);
      fetchPortfolio();
    } catch (error) {
      console.error('Error saving portfolio details:', error);
      alert('Failed to save details. Please try again.');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDeletePortfolio = async () => {
    if (!window.confirm('Are you sure you want to delete this portfolio? This action cannot be undone and all uploaded evidence will be permanently deleted.')) return;
    
    setDeleting(true);
    try {
      await api.delete(`/poe/portfolios/${id}/`);
      alert('Portfolio deleted successfully.');
      
      // Role-based redirection
      if (user.role === 'STUDENT') {
        navigate('/portfolios');
      } else if (user.role === 'INSTRUCTOR') {
        navigate('/units-assigned');
      } else if (['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user.role)) {
        navigate('/admin/portfolios');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert(error.response?.data?.detail || 'Failed to delete portfolio. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div>Loading portfolio...</div>;
  if (!portfolio) return <div>Portfolio not found.</div>;

  const statusColors = {
    'DRAFT': 'bg-slate-100 text-slate-600',
    'SUBMITTED': 'bg-blue-100 text-[#0000FE]',
    'EVALUATED': 'bg-green-100 text-green-700',
    'REDO': 'bg-red-100 text-red-700'
  };

  const isStudentOrInstructor = user && ['STUDENT', 'INSTRUCTOR'].includes(user.role);
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
  const canEdit = ['DRAFT', 'REDO'].includes(portfolio.status);
  const canDelete = portfolio.status === 'DRAFT' && (
    (user?.role === 'STUDENT' && portfolio.learner === user?.id) ||
    (user?.role === 'INSTRUCTOR') ||
    (user && ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user.role))
  );

  return (
    <div className="space-y-8">
      <button 
        onClick={handleBackClick}
        className="flex items-center gap-2 text-slate-500 hover:text-[#0000FE] font-bold transition-colors"
      >
        <ArrowLeft size={20} />
        {user?.role === 'STUDENT' ? 'Back to My Portfolios' : 'Back to Portfolios List'}
      </button>

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-slate-100">
            <FileText size={32} />
          </div>
          <div>
            {portfolio.element_display && (
              <span className="text-xs font-black text-primary-600 uppercase tracking-widest block mb-1">
                {portfolio.element_display}
              </span>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">{portfolio.title}</h1>
              {canEdit && (
                <button
                  onClick={() => {
                    setIsResubmitMode(false);
                    setShowEditModal(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-[#0000FE] transition-colors rounded-lg hover:bg-slate-50"
                  title="Edit title & description"
                >
                  <Edit size={16} />
                </button>
              )}
            </div>
            <p className="text-slate-500 font-medium">{portfolio.description || 'No description provided'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest ${statusColors[portfolio.status]}`}>
            {portfolio.status === 'REDO' ? 'Redo Required' : portfolio.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Evidence List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Collected Evidence</h2>
            {canEdit && (
              <label className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-slate-200 text-slate-600 rounded-2xl cursor-pointer hover:border-primary-500 hover:text-primary-600 transition-all font-bold">
                <Plus size={20} />
                Add Evidence
                <input type="file" className="hidden" multiple onChange={handleFilesSelected} />
              </label>
            )}
          </div>

          <div className="space-y-4">
            {isStudentOrInstructor && trialRounds.length > 0 && (
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mt-6 mb-2">
                Current Submission (Trial {currentRound})
              </h3>
            )}

            {currentEvidence.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-[32px] border border-slate-100">
                <Upload className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold">No evidence uploaded for this trial yet.</p>
              </div>
            ) : (
               currentEvidence.map((item, index) => (
                <div key={item.id} className="flex flex-col p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-primary-100 transition-all gap-4">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors">
                        {item.file.match(/\.(mp4|webm|ogg|mov)$/i) ? <Video size={24} /> : <FileText size={24} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">{item.description}</p>
                        <p className="text-xs text-slate-400 font-medium">Uploaded on {new Date(item.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <div className="flex gap-1 mr-2 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleReorderEvidence(index, 'up')}
                            className="p-1.5 bg-slate-50 border border-slate-100 hover:border-[#0000FE] text-slate-400 rounded-lg hover:text-[#0000FE] disabled:opacity-30 transition-all"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={index === currentEvidence.length - 1}
                            onClick={() => handleReorderEvidence(index, 'down')}
                            className="p-1.5 bg-slate-50 border border-slate-100 hover:border-[#0000FE] text-slate-400 rounded-lg hover:text-[#0000FE] disabled:opacity-30 transition-all"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => setPreviewFile({ url: item.file, title: item.description })}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#0000FE] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#0000FE] hover:text-white transition-all shadow-sm"
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      {canEdit && (
                        <button 
                          onClick={async () => {
                            if (window.confirm('Delete this evidence?')) {
                              await api.delete(`/poe/evidence/${item.id}/`);
                              fetchPortfolio();
                            }
                          }}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  {item.plagiarism_flags && item.plagiarism_flags.length > 0 && (
                    <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
                      <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900">Duplicate File Warning</p>
                        <p className="font-medium text-amber-700">
                          Identical to file uploaded by student <strong className="text-amber-950">@{item.plagiarism_flags[0].duplicate_of_student}</strong> in <strong className="text-amber-950">{item.plagiarism_flags[0].duplicate_of_portfolio}</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {isStudentOrInstructor && trialRounds.length > 0 && (
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

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
            <h3 className="font-bold text-slate-800">Portfolio Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${portfolio.status === 'DRAFT' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                <span className={`font-bold ${portfolio.status === 'DRAFT' ? 'text-slate-800' : 'text-slate-400'}`}>Drafting Phase</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${portfolio.status === 'SUBMITTED' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                <span className={`font-bold ${portfolio.status === 'SUBMITTED' ? 'text-slate-800' : 'text-slate-400'}`}>Pending Evaluation</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${['EVALUATED', 'REDO'].includes(portfolio.status) ? (portfolio.status === 'REDO' ? 'bg-red-500' : 'bg-green-500') : 'bg-slate-300'}`}></div>
                <span className={`font-bold ${['EVALUATED', 'REDO'].includes(portfolio.status) ? 'text-slate-800' : 'text-slate-400'}`}>
                  {portfolio.status === 'REDO' ? 'Redo Requested' : 'Graded & Completed'}
                </span>
              </div>
            </div>

            {['DRAFT', 'REDO'].includes(portfolio.status) && portfolio.evidence?.length > 0 && (
              <button 
                onClick={() => {
                  if (portfolio.status === 'REDO') {
                    setNewFiles([]);
                    setIsResubmitMode(true);
                    setShowEditModal(true);
                  } else {
                    handleSubmitPortfolio();
                  }
                }}
                className={`w-full flex items-center justify-center gap-3 py-5 ${portfolio.status === 'REDO' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0000FE] hover:bg-[#0000FE]'} text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95`}
              >
                {portfolio.status === 'REDO' ? <Clock size={20} /> : <Send size={20} />}
                {portfolio.status === 'REDO' ? 'Resubmit Work' : 'Submit for Evaluation'}
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDeletePortfolio}
                disabled={deleting}
                className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl border border-red-200 transition-all active:scale-95 text-sm disabled:opacity-50"
              >
                {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                Delete Portfolio
              </button>
            )}

            {portfolio.status === 'REDO' && portfolio.assessment && (
              <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Instructor Feedback</p>
                  <p className="text-sm font-medium text-red-800 italic">"{portfolio.assessment.feedback}"</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Previous Status</p>
                  <p className="text-xs font-bold text-slate-600">Redo Required</p>
                </div>
              </div>
            )}

            {portfolio.status === 'EVALUATED' && portfolio.assessment && (
              <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                  <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Final Grade</p>
                  <p className="text-2xl font-black text-green-800">{portfolio.assessment.grade}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback</p>
                  <p className="text-sm font-medium text-slate-600 italic">"{portfolio.assessment.feedback}"</p>
                </div>
              </div>
            )}
            {portfolio.verification_status && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">CDACC Verification Audit</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest ${
                    portfolio.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                    portfolio.verification_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {portfolio.verification_status === 'VERIFIED' ? 'Verified' :
                     portfolio.verification_status === 'REJECTED' ? 'Rejected' :
                     'Pending Audit'}
                  </span>
                </div>
                {portfolio.verifier_name && (
                  <p className="text-[11px] text-slate-500 font-bold">
                    Audited by: <strong className="text-slate-700">@{portfolio.verifier_name}</strong>
                  </p>
                )}
                {portfolio.verification_feedback && (
                  <div className="p-3 bg-white border border-slate-100 rounded-xl text-xs text-slate-600 italic">
                    "{portfolio.verification_feedback}"
                  </div>
                )}
              </div>
            )}
          </div>

          {user && ['CDACC', 'ADMIN'].includes(user.role) && portfolio.status === 'EVALUATED' && (
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
              <h3 className="font-black text-slate-800 text-lg">CDACC Verification Verdict</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Verdict</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVerifyStatus('VERIFIED')}
                      className={`py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        verifyStatus === 'VERIFIED'
                          ? 'bg-green-600 text-white shadow-lg shadow-green-100'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerifyStatus('REJECTED')}
                      className={`py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        verifyStatus === 'REJECTED'
                          ? 'bg-red-600 text-white shadow-lg shadow-red-100'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Auditor Feedback</label>
                  <textarea
                    value={verifyFeedback}
                    onChange={(e) => setVerifyFeedback(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#0000FE]/20 outline-none font-bold resize-none text-sm"
                    placeholder="Provide verification notes..."
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifySubmit}
                  disabled={!verifyStatus || verifing}
                  className="w-full py-4 bg-[#0000FE] hover:bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
                >
                  {verifing ? 'Submitting...' : 'Submit Audit Verdict'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {portfolio.assessment && portfolio.assessment.criterion_scores && portfolio.assessment.criterion_scores.length > 0 && (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Structured Rubric Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.assessment.criterion_scores.map((score) => (
              <div key={score.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                <div>
                  <p className="font-bold text-sm text-slate-700">{score.criterion_description}</p>
                  {score.is_critical && (
                    <span className="inline-block mt-1 bg-red-50 text-red-600 font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-widest">
                      Critical Requirement
                    </span>
                  )}
                </div>
                <span className={`shrink-0 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full ${
                  score.is_satisfied ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {score.is_satisfied ? 'Competent' : 'Not Yet Competent'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {portfolio.logs && portfolio.logs.length > 0 && (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Activity Audit Trail</h3>
          <div className="relative border-l border-slate-100 ml-4 pl-6 space-y-6">
            {portfolio.logs.map((log) => (
              <div key={log.id} className="relative">
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-200 border-2 border-white ring-4 ring-slate-50"></div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    {log.event_type_display} • {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <p className="text-sm font-bold text-slate-700">{log.description}</p>
                  <p className="text-xs text-slate-400 font-medium">Performed by <strong className="text-slate-500">@{log.user_name}</strong> ({log.user_role})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-8 animate-in fade-in duration-200">
          <div className="min-h-full flex items-center justify-center py-8">
            <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 relative">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    {isResubmitMode ? 'Edit & Resubmit Portfolio' : 'Edit Portfolio Details'}
                  </h2>
                  <p className="text-slate-500 font-medium text-sm">
                    {isResubmitMode ? 'Update your title and description before resubmitting.' : 'Update your portfolio\'s title and description.'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </button>
              </div>
              
              <form onSubmit={handleSaveDetails} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portfolio Title</label>
                  <input 
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    placeholder="e.g. My Python Exercises"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                  <textarea 
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-bold resize-none"
                    placeholder="Describe your work..."
                  />
                </div>



                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowEditModal(false)} 
                    className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={savingDetails}
                    className={`flex-1 px-6 py-4 ${isResubmitMode ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0000FE] hover:bg-[#0000FE]'} text-white font-black rounded-2xl shadow-lg disabled:opacity-50`}
                  >
                    {savingDetails ? 'Saving...' : (isResubmitMode ? 'Save & Resubmit' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-8 animate-in fade-in duration-200">
          <div className="min-h-full flex items-center justify-center py-8">
            <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 relative flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Stage Evidence Upload</h2>
                  <p className="text-slate-500 font-medium text-sm">Give each item a clear name and arrange their display order.</p>
                </div>
                <button 
                  onClick={() => {
                    setShowUploadModal(false);
                    setStagedFiles([]);
                  }} 
                  className="text-slate-400 hover:text-slate-600 font-black text-sm"
                >
                  Cancel
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-6">
                <div className="space-y-4">
                  {stagedFiles.map((staged, index) => {
                    const isImage = staged.file.type.startsWith('image/');
                    const isVideo = staged.file.type.startsWith('video/');
                    const objectUrl = (isImage || isVideo) ? URL.createObjectURL(staged.file) : null;

                    return (
                      <div key={staged.tempId} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {/* Thumbnail / Preview */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                          {isImage ? (
                            <img src={objectUrl} alt="preview" className="w-full h-full object-cover" />
                          ) : isVideo ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-slate-950 text-white">
                              <Video size={16} />
                            </div>
                          ) : (
                            <FileText size={24} />
                          )}
                        </div>

                        {/* Title Input */}
                        <div className="flex-1 w-full space-y-1 text-left">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ml-1">Evidence Name</label>
                          <input
                            type="text"
                            value={staged.name}
                            onChange={(e) => {
                              const updated = stagedFiles.map(f => f.tempId === staged.tempId ? { ...f, name: e.target.value } : f);
                              setStagedFiles(updated);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-[#0000FE]/20 outline-none"
                            placeholder="e.g. Completed assignment screenshot"
                          />
                        </div>

                        {/* Reordering Controls */}
                        <div className="flex sm:flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => {
                              const updated = [...stagedFiles];
                              const temp = updated[index];
                              updated[index] = updated[index - 1];
                              updated[index - 1] = temp;
                              setStagedFiles(updated);
                            }}
                            className="p-1.5 bg-white border border-slate-200 hover:border-[#0000FE] text-slate-500 rounded-lg hover:text-[#0000FE] disabled:opacity-30 transition-all"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={index === stagedFiles.length - 1}
                            onClick={() => {
                              const updated = [...stagedFiles];
                              const temp = updated[index];
                              updated[index] = updated[index + 1];
                              updated[index + 1] = temp;
                              setStagedFiles(updated);
                            }}
                            className="p-1.5 bg-white border border-slate-200 hover:border-[#0000FE] text-slate-500 rounded-lg hover:text-[#0000FE] disabled:opacity-30 transition-all"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setStagedFiles(prev => prev.filter(f => f.tempId !== staged.tempId));
                            if (stagedFiles.length <= 1) {
                              setShowUploadModal(false);
                            }
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Remove File"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex gap-4 sticky bottom-0 z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setStagedFiles([]);
                  }}
                  className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadStaged}
                  disabled={uploading}
                  className="flex-1 px-6 py-4 bg-[#0000FE] text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all text-xs"
                >
                  {uploading ? 'Uploading...' : 'Upload Staged Evidence'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default PortfolioDetail;

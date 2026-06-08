import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FileText, BookOpen, Plus, Trash2, Download, FileCode, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../../components/Modal';

const ExamRepository = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [exams, setExams] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  
  // Upload modal & form states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [examFile, setExamFile] = useState(null);
  const [schemeFile, setSchemeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchMyUnits();
  }, []);

  useEffect(() => {
    if (selectedUnitId) {
      fetchExams();
    } else {
      setExams([]);
    }
  }, [selectedUnitId]);

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

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const response = await api.get('/academic/exams/');
      // Filter exams matching selected unit
      const unitExams = response.data.filter(e => e.unit.toString() === selectedUnitId.toString());
      setExams(unitExams);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load uploaded exams.');
    } finally {
      setLoadingExams(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedUnitId) {
      setError('Please select a unit first.');
      return;
    }
    if (!newExamTitle || !examFile) {
      setError('Title and Exam Paper are required.');
      return;
    }

    const formData = new FormData();
    formData.append('unit', selectedUnitId);
    formData.append('title', newExamTitle);
    formData.append('exam_paper', examFile);
    if (schemeFile) {
      formData.append('marking_scheme', schemeFile);
    }

    setUploading(true);
    try {
      await api.post('/academic/exams/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Exam and marking scheme uploaded successfully!');
      setNewExamTitle('');
      setExamFile(null);
      setSchemeFile(null);
      setIsUploadModalOpen(false);
      fetchExams();
    } catch (err) {
      console.error('Error uploading exam files:', err);
      setError(err.response?.data?.error || 'Failed to upload exam files. Please check file sizes and formats.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam entry? This will delete both the exam paper and marking scheme.')) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/academic/exams/${examId}/`);
      setSuccess('Exam entry deleted successfully.');
      fetchExams();
    } catch (err) {
      console.error('Error deleting exam:', err);
      setError('Failed to delete exam entry.');
    }
  };

  if (loadingUnits) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Exam Repository</h1>
          <p className="text-slate-500 font-medium mt-1">
            Store and manage exam papers and marking schemes for CDACC audits.
          </p>
        </div>

        {selectedUnitId && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#0000FE] text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-sm"
          >
            <Plus size={18} />
            Upload Exam Paper
          </button>
        )}
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full md:w-96 space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Select Unit:</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
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

      {loadingExams ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : selectedUnitId ? (
        exams.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
            <FileText className="mx-auto text-slate-200 mb-6" size={64} />
            <h3 className="text-2xl font-bold text-slate-800">No Exam Records</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">
              There are no uploaded exam papers or marking schemes for this unit yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-6">Exam Title</th>
                    <th className="p-6 text-center">Exam Paper</th>
                    <th className="p-6 text-center">Marking Scheme</th>
                    <th className="p-6">Uploaded At</th>
                    <th className="p-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <p className="font-bold text-slate-800">{exam.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          Uploaded By: {exam.instructor_name}
                        </p>
                      </td>
                      <td className="p-6 text-center">
                        {exam.exam_paper ? (
                          <a
                            href={exam.exam_paper}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#0000FE] rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                          >
                            <Download size={14} />
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {exam.marking_scheme ? (
                          <a
                            href={exam.marking_scheme}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                          >
                            <Download size={14} />
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None Provided</span>
                        )}
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-semibold text-slate-700">
                          {new Date(exam.uploaded_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(exam.uploaded_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="p-6 text-center">
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Exam Record"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
          <BookOpen className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">Select a Unit</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">
            Choose a unit from the dropdown to access its exam repository.
          </p>
        </div>
      )}

      {/* Upload Exam Modal */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload Exam Paper & Scheme"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Exam Title *</label>
              <input
                type="text"
                placeholder="e.g. End of Semester 1 Theory Paper"
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Exam Question Paper *</label>
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-slate-50 text-slate-500 rounded-2xl border border-dashed border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-350 transition-all">
                  <FileText className="text-slate-400 mb-2" size={24} />
                  <span className="text-xs font-bold">{examFile ? examFile.name : 'Select exam file (PDF/Word)'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setExamFile(e.target.files[0])}
                    required
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Marking Scheme (Optional)</label>
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-slate-50 text-slate-500 rounded-2xl border border-dashed border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-350 transition-all">
                  <FileCode className="text-slate-400 mb-2" size={24} />
                  <span className="text-xs font-bold">{schemeFile ? schemeFile.name : 'Select scheme file (PDF/Word)'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setSchemeFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-5 bg-[#0000FE] disabled:bg-blue-300 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              {uploading ? 'Uploading...' : 'Save Exam Entry'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ExamRepository;

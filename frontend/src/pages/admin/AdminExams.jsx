import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FileText, Download, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react';

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/academic/exams/');
      setExams(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch exam records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam record? This will permanently delete both the exam paper and marking scheme files.')) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/academic/exams/${examId}/`);
      setSuccess('Exam record deleted successfully.');
      fetchExams();
    } catch (err) {
      console.error(err);
      setError('Failed to delete exam record.');
    }
  };

  const filteredExams = exams.filter((exam) => {
    const term = searchTerm.toLowerCase();
    return (
      exam.title.toLowerCase().includes(term) ||
      exam.unit_code.toLowerCase().includes(term) ||
      exam.unit_name.toLowerCase().includes(term) ||
      exam.instructor_name.toLowerCase().includes(term)
    );
  });

  if (loading) {
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
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Audit Exam Repository</h1>
          <p className="text-slate-500 font-medium mt-1">
            Search, download, and audit academic exam papers and marking schemes uploaded by instructors.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search code, title, instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0000FE] transition-all font-bold text-sm text-slate-800"
          />
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

      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
          <FileText className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">No Exam Records Found</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">
            {searchTerm ? 'No exam papers match your search term.' : 'There are currently no uploaded exam records in the system.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-6">Unit details</th>
                  <th className="p-6">Exam Title</th>
                  <th className="p-6 text-center">Exam Paper</th>
                  <th className="p-6 text-center">Marking Scheme</th>
                  <th className="p-6">Uploaded At</th>
                  <th className="p-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#0000FE] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {exam.unit_code}
                      </span>
                      <p className="text-xs font-bold text-slate-600 mt-2">{exam.unit_name}</p>
                    </td>
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
                        title="Delete Exam Entry"
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
      )}
    </div>
  );
};

export default AdminExams;

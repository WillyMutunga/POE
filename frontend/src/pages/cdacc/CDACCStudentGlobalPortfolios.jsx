import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  FileText, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck,
  User,
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
  Download
} from 'lucide-react';

const CDACCStudentGlobalPortfolios = () => {
  const { studentId, unitId } = useParams();
  const [portfolios, setPortfolios] = useState([]);
  const [student, setStudent] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Transcript states
  const [selectedTranscriptSemesterId, setSelectedTranscriptSemesterId] = useState('');
  const [loadingTranscriptPdf, setLoadingTranscriptPdf] = useState(false);
  const [transcriptPdfUrl, setTranscriptPdfUrl] = useState(null);
  const [transcriptError, setTranscriptError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch portfolios for this student, optionally filtered by unit
        const url = unitId 
          ? `/poe/portfolios/?learner=${studentId}&unit=${unitId}`
          : `/poe/portfolios/?learner=${studentId}`;
        
        const [portfoliosRes, userRes] = await Promise.all([
          api.get(url),
          api.get(`/users/list-all/?id=${studentId}`)
        ]);

        setPortfolios(portfoliosRes.data);

        if (userRes.data && userRes.data.length > 0) {
          const userData = userRes.data[0];
          const courseId = userData.course;
          setStudent({
            id: studentId,
            name: userData.full_name || `${userData.first_name} ${userData.last_name}`,
            registration_number: userData.registration_number,
            course: courseId,
            course_name: userData.course_display
          });

          if (courseId) {
            const semsRes = await api.get(`/academic/semesters/?course=${courseId}`);
            setSemesters(semsRes.data);
          }
        } else if (portfoliosRes.data.length > 0) {
          // Fallback if userRes is empty but portfolios exist
          setStudent({
            id: studentId,
            name: portfoliosRes.data[0].learner_display,
            registration_number: portfoliosRes.data[0].learner_registration_number,
            course_name: portfoliosRes.data[0].course_display
          });
        }
      } catch (error) {
        console.error('Error fetching student global portfolios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, unitId]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  const handleLoadTranscript = async () => {
    if (!selectedTranscriptSemesterId || !student) return;
    setLoadingTranscriptPdf(true);
    setTranscriptError(null);
    setTranscriptPdfUrl(null);
    try {
      const response = await api.get(
        `/academic/student-marks/provisional_results_pdf/?semester_id=${selectedTranscriptSemesterId}&student_id=${student.id}`,
        { responseType: 'blob' }
      );
      const file = new Blob([response.data], { type: 'application/pdf' });
      setTranscriptPdfUrl(URL.createObjectURL(file));
    } catch (err) {
      console.error('Error loading transcript:', err);
      if (err.response && err.response.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            setTranscriptError(parsed.error || 'No graded results found for this student in this semester.');
          } catch {
            setTranscriptError('No approved units registered or graded for this student in this semester.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setTranscriptError('No approved units registered or graded for this student in this semester.');
      }
    } finally {
      setLoadingTranscriptPdf(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!transcriptPdfUrl || !student) return;
    const link = document.createElement('a');
    link.href = transcriptPdfUrl;
    const semName = semesters.find(s => s.id.toString() === selectedTranscriptSemesterId)?.name || 'Results';
    const studentName = student.registration_number || student.username;
    link.setAttribute('download', `ProvisionalResults_${studentName}_${semName.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Group portfolios by unit
  const groupedPortfolios = portfolios.reduce((acc, p) => {
    const unitName = p.unit_display || 'Other Units';
    if (!acc[unitName]) acc[unitName] = [];
    acc[unitName].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[#0000FE] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <User size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-blue-500" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    {unitId ? 'Unit-Specific Portfolios' : 'Global Learner Portfolio'}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                  {student?.name || 'Student Portfolios'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student?.registration_number}</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span className="text-xs font-bold text-slate-400">{student?.course_name}</span>
                </div>
              </div>
            </div>
          </div>

          {student && semesters.length > 0 && (
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/80 self-stretch md:self-auto justify-between md:justify-start">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Provisional Transcript</span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTranscriptSemesterId}
                    onChange={(e) => {
                      setSelectedTranscriptSemesterId(e.target.value);
                      setTranscriptPdfUrl(null);
                      setTranscriptError(null);
                    }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="">Choose Module</option>
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    disabled={!selectedTranscriptSemesterId || loadingTranscriptPdf}
                    onClick={handleLoadTranscript}
                    className="px-4 py-2 bg-[#00b074] hover:bg-[#008f5d] text-white font-black rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm shrink-0"
                  >
                    {loadingTranscriptPdf ? 'Loading...' : 'Load'}
                  </button>
                  
                  {transcriptPdfUrl && (
                    <button
                      type="button"
                      onClick={handleDownloadTranscript}
                      className="p-2 bg-[#0000FE] hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm shrink-0"
                      title="Download PDF"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {transcriptError && (
        <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-100">
          {transcriptError}
        </div>
      )}

      {transcriptPdfUrl && (
        <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm h-[550px] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-3 px-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Provisional Transcript Preview</span>
            <button
              onClick={() => { setTranscriptPdfUrl(null); setSelectedTranscriptSemesterId(''); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕ Close Preview
            </button>
          </div>
          <iframe src={transcriptPdfUrl} className="w-full h-full border-none rounded-2xl" title="Transcript Preview" />
        </div>
      )}

      {Object.keys(groupedPortfolios).length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
          <FileText className="mx-auto text-slate-100 mb-6" size={80} />
          <h3 className="text-2xl font-bold text-slate-800">No Portfolios Found</h3>
          <p className="text-slate-400 mt-2">This student hasn't submitted any portfolios yet.</p>
        </div>
      ) : (
        Object.entries(groupedPortfolios).map(([unitName, unitPortfolios]) => (
          <div key={unitName} className="space-y-6">
            <div className="flex items-center gap-3 ml-4">
              <BookOpen size={18} className="text-blue-500" />
              <h2 className="text-lg font-black text-slate-700 uppercase tracking-tight">{unitName}</h2>
              <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-400 rounded-full">{unitPortfolios.length} Submissions</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {unitPortfolios.map((portfolio) => (
                <div key={portfolio.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <FileText size={28} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      portfolio.status === 'EVALUATED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {portfolio.status}
                    </span>
                  </div>

                  {portfolio.element_display && (
                    <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">
                      {portfolio.element_display}
                    </p>
                  )}
                  <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 min-h-[3.5rem]">{portfolio.title}</h3>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar size={14} className="text-slate-300" />
                      <span className="font-medium">Submitted {new Date(portfolio.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link 
                    to={`/portfolios/${portfolio.id}`}
                    className="w-full py-5 bg-slate-50 text-[#0000FE] font-black text-sm rounded-2xl hover:bg-[#0000FE] hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-100 shadow-sm"
                  >
                    View Portfolio
                    <ExternalLink size={18} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CDACCStudentGlobalPortfolios;

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';
import { LayoutGrid, Save, ArrowLeft, Loader2 } from 'lucide-react';

const ASSESSMENT_TYPES = [
  { value: 'PRACTICAL', label: 'Practical Assessment' },
  { value: 'ORAL', label: 'Oral Assessment' },
  { value: 'WRITTEN', label: 'Written Assessment' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'SUPERVISED', label: 'Supervised Assessment' }
];

const CreatePortfolio = () => {
  const [searchParams] = useSearchParams();
  const unitId = searchParams.get('unit');
  const learnerId = searchParams.get('learner');
  const learnerName = searchParams.get('learner_name');
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState('');
  const [assessmentType, setAssessmentType] = useState('');
  const [loadingUnit, setLoadingUnit] = useState(true);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (!unitId) return;
      try {
        const response = await api.get(`/academic/units/${unitId}/`);
        setElements(response.data.elements || []);
      } catch (error) {
        console.error('Error fetching unit details:', error);
      } finally {
        setLoadingUnit(false);
      }
    };
    fetchUnitDetails();
  }, [unitId]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = {
        title,
        description,
        unit: unitId,
        element: selectedElement || null,
        assessment_type: assessmentType || null,
        status: 'DRAFT'
      };
      
      if (learnerId) {
        data.learner = learnerId;
      }
      
      const response = await api.post('/poe/portfolios/', data);
      navigate(`/portfolios/${response.data.id}`);
    } catch (error) {
      console.error('Error creating portfolio:', error);
      alert(error.response?.data?.detail || 'Failed to create portfolio. Please verify all fields.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Units
      </button>

      <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-100">
        <div className="mb-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <LayoutGrid size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {learnerName ? `Create for ${learnerName}` : 'Create Portfolio'}
            </h1>
            <p className="text-slate-500 font-medium">
              {learnerName ? `Setting up a portfolio for this student.` : 'Initialize your evidence folder for this unit.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Element Selector Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Academic Element *</label>
              <select
                required
                disabled={loadingUnit}
                value={selectedElement}
                onChange={(e) => setSelectedElement(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold text-sm text-slate-700 disabled:opacity-50"
              >
                <option value="">Select Element</option>
                {elements.map(el => (
                  <option key={el.id} value={el.id}>{el.name}</option>
                ))}
              </select>
              {elements.length === 0 && !loadingUnit && (
                <p className="text-[10px] text-amber-600 font-bold ml-1">No elements exist for this unit. Ask an administrator to define elements.</p>
              )}
            </div>

            {/* Assessment Type Selector Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Assessment Category *</label>
              <select
                required
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all font-bold text-sm text-slate-700"
              >
                <option value="">Select Category</option>
                {ASSESSMENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Portfolio Title</label>
            <input 
              type="text"
              placeholder="e.g., Final Project Evidence"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-bold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Description (Optional)</label>
            <textarea 
              placeholder="Briefly describe what this portfolio contains..."
              rows={4}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                <Save size={20} />
                Initialize Portfolio
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePortfolio;

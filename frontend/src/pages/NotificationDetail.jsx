import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bell, Clock, ChevronLeft, ArrowRight } from 'lucide-react';
import api from '../api';

const NotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await api.get(`/notifications/${id}/`);
        setNotification(response.data);
        if (!response.data.is_read) {
          await api.post(`/notifications/${id}/mark_as_read/`);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notification:', error);
        setLoading(false);
      }
    };
    fetchNotification();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-500 font-bold">Notification not found</p>
        <button onClick={() => navigate('/notifications')} className="mt-4 text-primary-600 font-bold">Back to Notifications</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-10">
      <button 
        onClick={() => navigate('/notifications')}
        className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 mb-8"
      >
        <ChevronLeft size={16} />
        Back to Notifications
      </button>

      <div className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-2xl shadow-slate-200/50">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 ${
          notification.notification_type === 'GRADE_ASSIGNED' ? 'bg-green-50 text-green-600' : 
          notification.notification_type === 'SYSTEM_ALERT' ? 'bg-red-50 text-red-600' :
          'bg-blue-50 text-blue-600'
        }`}>
          <Bell size={40} />
        </div>

        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{notification.title}</h1>
        <p className="text-sm text-slate-400 font-bold flex items-center gap-2 mb-8">
          <Clock size={16} />
          {new Date(notification.created_at).toLocaleString()}
        </p>

        <div className="h-[1px] bg-slate-100 w-full mb-8"></div>

        <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10">
          {notification.message}
        </p>

        {notification.target_url ? (
          <button 
            onClick={() => navigate(notification.target_url)}
            className="w-full bg-[#0000FE] hover:bg-[#0000FE]/90 text-white p-6 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
          >
            {notification.action_text || 'Take Action'}
            <ArrowRight size={20} />
          </button>
        ) : (notification.title === 'New Online Exam Assigned' || notification.message.toLowerCase().includes('online exam')) ? (
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#0000FE] hover:bg-[#0000FE]/90 text-white p-6 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
          >
            Go to Dashboard to Start Exam
            <ArrowRight size={20} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default NotificationDetail;

import React, { useState, useEffect } from 'react';
import { Bell, Clock, ChevronLeft, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_as_read/`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark_all_as_read/');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      handleMarkRead(notif.id);
    }
    if (notif.target_url) {
      navigate(notif.target_url);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 mb-4"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Notifications</h1>
        </div>
        
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
          >
            <CheckCircle size={18} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-[32px] p-20 text-center border border-slate-100 shadow-sm">
            <Bell className="mx-auto text-slate-100 mb-6" size={64} />
            <h2 className="text-2xl font-black text-slate-800 mb-2">All caught up!</h2>
            <p className="text-slate-400 font-medium">You don't have any notifications at the moment.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md ${!notif.is_read ? 'ring-2 ring-primary-500/10 border-primary-100' : ''}`}
            >
              <div className="flex gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  notif.notification_type === 'GRADE_ASSIGNED' ? 'bg-green-50 text-green-600' : 
                  notif.notification_type === 'SYSTEM_ALERT' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  <Bell size={28} />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">{notif.title}</h3>
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <span className="bg-primary-500 w-2 h-2 rounded-full"></span>
                    )}
                  </div>
                  
                  <p className="text-slate-600 font-medium leading-relaxed mb-6">
                    {notif.message}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    {notif.target_url && (
                      <button 
                        onClick={() => handleNotificationClick(notif)}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-200"
                      >
                        {notif.action_text || 'Take Action'}
                      </button>
                    )}
                    {!notif.is_read && (
                      <button 
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-primary-600 px-4"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

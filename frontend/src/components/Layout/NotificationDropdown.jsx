import React from 'react';
import { Bell, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ notifications, onMarkRead, onMarkAllRead, onClose }) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notif) => {
    onMarkRead(notif.id);
    if (notif.target_url) {
      navigate(notif.target_url);
    } else {
      navigate(`/notifications/${notif.id}`);
    }
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-4 w-96 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-800 tracking-tight">Notifications</h3>
        <div className="flex items-center gap-3">
          {notifications.some(n => !n.is_read) && (
            <button 
              onClick={onMarkAllRead}
              className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline"
            >
              Mark all as read
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            Close
          </button>
        </div>
      </div>

      <div className="max-h-[450px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="mx-auto text-slate-200 mb-2" size={32} />
            <p className="text-slate-400 font-bold text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => handleNotificationClick(notif)}
              className={`p-5 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                notif.notification_type === 'GRADE_ASSIGNED' ? 'bg-green-100 text-green-600' : 
                notif.notification_type === 'SYSTEM_ALERT' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <Bell size={20} />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-slate-800 text-sm">{notif.title}</p>
                  <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(notif.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{notif.message}</p>
                
                {notif.target_url && (
                  <div className="mt-2 text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1">
                    {notif.action_text || 'View details'} →
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-50 text-center">
        <button 
          onClick={() => { navigate('/notifications'); onClose(); }}
          className="text-xs font-bold text-slate-400 hover:text-slate-600"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;

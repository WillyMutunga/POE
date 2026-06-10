import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, Search, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import NotificationDropdown from './NotificationDropdown';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-20 md:h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 md:px-10 sticky top-0 z-20">
      <div className="flex items-center gap-3 flex-1 md:flex-initial mr-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 md:hidden active:scale-95 transition-all"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full max-w-[160px] xs:max-w-[200px] sm:max-w-xs md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2.5 sm:p-3 rounded-xl transition-all ${isOpen ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${isOpen ? 'bg-white text-[#0000FE] border-[#0000FE]' : 'bg-red-500 text-white border-white shadow-lg shadow-red-100'}`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <NotificationDropdown 
            notifications={notifications} 
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onClose={() => setIsOpen(false)}
          />
        )}

        <div className="h-8 w-[1px] bg-slate-100 mx-1 sm:mx-2"></div>
        
        <Link to="/profile" className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
              {(profile?.first_name || profile?.last_name) ? `${profile.first_name} ${profile.last_name}`.trim() : (profile?.username || user?.username || '')}
            </p>
            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{user?.role}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0000FE] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <User size={20} className="sm:hidden" />
            <User size={24} className="hidden sm:block" />
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;

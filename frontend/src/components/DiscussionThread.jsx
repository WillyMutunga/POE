import React, { useState } from 'react';
import { Send, User, MessageSquare, Clock } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DiscussionThread = ({ portfolioId, comments, onCommentAdded }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/poe/comments/', {
        portfolio: portfolioId,
        message: newMessage
      });
      setNewMessage('');
      onCommentAdded(response.data);
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 flex flex-col h-[600px]">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-[#0000FE] rounded-xl flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 tracking-tight">Portfolio Discussion</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interactive Feedback Thread</p>
          </div>
        </div>
        <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          {comments?.length || 0} Messages
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
        {comments?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <MessageSquare size={48} className="mb-4 text-slate-300" />
            <p className="font-bold text-slate-400">No messages yet.</p>
            <p className="text-xs font-medium text-slate-400">Start a conversation about this evidence.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMe = comment.user === user.id;
            return (
              <div key={comment.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white font-black text-xs ${
                    comment.user_role === 'STUDENT' ? 'bg-[#0000FE]' : 'bg-red-500'
                  }`}>
                    {comment.user_name?.[0]?.toUpperCase() || <User size={14} />}
                  </div>
                  <div className={`space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    <div className={`p-4 rounded-2xl text-sm font-medium ${
                      isMe 
                      ? 'bg-[#0000FE] text-white rounded-tr-none shadow-md shadow-blue-100' 
                      : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                    }`}>
                      {comment.message}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-1">
                      <span>{comment.user_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-50 rounded-b-[40px]">
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text"
            placeholder="Type your message here..."
            className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#0000FE] transition-all font-medium text-slate-700 placeholder:text-slate-300"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || isSubmitting}
            className="absolute right-2 top-2 w-12 h-12 bg-[#0000FE] text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DiscussionThread;

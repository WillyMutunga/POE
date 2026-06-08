import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-3xl',
    xxl: 'max-w-5xl',
    full: 'max-w-[90vw]'
  }[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`bg-white rounded-[40px] shadow-2xl w-full ${sizeClasses} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300`}>
        <div className="flex justify-between items-center p-8 border-b border-slate-50 flex-shrink-0">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

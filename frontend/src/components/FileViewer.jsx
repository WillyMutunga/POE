import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

const getAbsoluteUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const host = apiBase.replace(/\/api\/?$/, '');
  return `${host}${fileUrl}`;
};

const FileViewer = ({ url, onClose, title }) => {
  if (!url) return null;

  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|jfif|pjpeg|pjp)$/i);
  const isPdf = url.match(/\.pdf$/i);
  const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);

  const absoluteUrl = getAbsoluteUrl(url);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-6xl h-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 tracking-tight line-clamp-1">{title || 'Evidence Preview'}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Document Preview</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href={absoluteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </a>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 bg-slate-900 overflow-hidden flex items-center justify-center relative">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {isImage ? (
            <div className="w-full h-full p-4 md:p-8 flex items-center justify-center">
              <img src={absoluteUrl} alt="Evidence" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-500" />
            </div>
          ) : isPdf ? (
            <div className="text-center p-12 md:p-20 bg-white rounded-[40px] border border-slate-100 shadow-2xl max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="w-24 h-24 bg-blue-50 text-[#0000FE] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
                <FileText size={48} />
              </div>
              <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">PDF Document</h4>
              <p className="text-slate-500 font-medium mb-10">To view this PDF document, please open it in a new browser tab.</p>
              <a 
                href={absoluteUrl} 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-10 py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 gap-2"
              >
                <ExternalLink size={20} />
                Open PDF
              </a>
            </div>
          ) : isVideo ? (
            <div className="w-full h-full p-4 md:p-8 flex items-center justify-center bg-black">
              <video 
                src={absoluteUrl} 
                controls 
                autoPlay 
                className="max-w-full max-h-full rounded-xl shadow-2xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="text-center p-12 md:p-20 bg-white rounded-[40px] border border-slate-100 shadow-2xl max-w-md mx-4">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Download size={48} />
              </div>
              <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Unsupported Preview</h4>
              <p className="text-slate-500 font-medium mb-10">This file type cannot be previewed in-browser. Please download it to view on your device.</p>
              <a 
                href={absoluteUrl} 
                download
                className="w-full inline-flex items-center justify-center px-10 py-5 bg-[#0000FE] text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-[#0000FE] transition-all active:scale-95"
              >
                Download File
              </a>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">POE Management System • Secure Evidence Viewer</p>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;

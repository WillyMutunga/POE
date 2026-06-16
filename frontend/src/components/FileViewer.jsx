import React, { useState } from 'react';
import { X, ExternalLink, Download, FileText, ZoomIn, ZoomOut } from 'lucide-react';

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

  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
            <div className="w-full h-full flex items-center justify-center relative">
              <div 
                className="w-full h-full p-4 md:p-8 flex items-center justify-center overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              >
                <img 
                  src={absoluteUrl} 
                  alt="Evidence" 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl select-none pointer-events-none" 
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              </div>

              {/* Floating Zoom Toolbar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-6 py-2.5 rounded-2xl flex items-center gap-4 text-white border border-white/10 shadow-2xl z-20">
                <button 
                  onClick={handleZoomOut} 
                  className="p-1.5 hover:text-blue-400 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="font-mono text-xs font-black min-w-[3.5rem] text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button 
                  onClick={handleZoomIn} 
                  className="p-1.5 hover:text-blue-400 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={18} />
                </button>
                <div className="w-[1px] h-4 bg-white/20"></div>
                <button 
                  onClick={handleResetZoom} 
                  className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                  title="Reset Zoom"
                >
                  Reset
                </button>
              </div>
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { 
  BookOpen, 
  Award, 
  GraduationCap, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Lock, 
  Laptop, 
  Library, 
  Home, 
  Menu, 
  X, 
  Star, 
  ExternalLink,
  MessageSquare,
  ChevronDown,
  CheckCircle,
  XCircle,
  FileText,
  Check
} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null); // 'courses' or 'services' or null
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  // Counter and visual states
  const [stats, setStats] = useState({ courses: 0, bodies: 0, depts: 0 });
  const [activeDeptTab, setActiveDeptTab] = useState('it');
  const [activePortalTab, setActivePortalTab] = useState('dashboard');
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  // Animate counters on component mount
  useEffect(() => {
    const duration = 2000; // ms
    const steps = 50;
    const stepTime = duration / steps;
    
    let currentStep = 0;
    const targetCourses = 96;
    const targetBodies = 8;
    const targetDepts = 6;

    const timer = setInterval(() => {
      currentStep++;
      setStats({
        courses: Math.min(Math.ceil((targetCourses / steps) * currentStep), targetCourses),
        bodies: Math.min(Math.ceil((targetBodies / steps) * currentStep), targetBodies),
        depts: Math.min(Math.ceil((targetDepts / steps) * currentStep), targetDepts),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { label: 'Home', href: '#home' },
    { label: 'About Us', href: '#about' },
    { label: 'Why e-PoE', href: '#why-epoe' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Courses', href: '#courses' },
    { label: 'FAQ', href: '#faq' }
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#141313] font-sans antialiased scroll-smooth animate-fade-in" id="home">
      <SEO 
        title="Digital Portfolio of Evidence | Headway College POE Portal"
        description="Access the official Headway College e-PoE Portal. Track assessment units, upload competency evidence, receive instructor feedback, and sit exams online."
        keywords="Headway College POE, Portfolio of Evidence, Headway College Portfolio of Evidence, Headway Student Portal, POE Portal Headway College, headway college, poe headway, headway college ac ke"
      />

      {/* Top Announcement Alert Bar */}
      <div className="bg-[#EF1B1B] text-white text-xs md:text-sm font-extrabold py-2.5 px-4 text-center select-none border-b border-red-700 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 tracking-wide uppercase">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>May 2026 Intake is Ongoing! Apply to Headway College of Professional Studies Today!</span>
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-md border-b border-slate-100/50 transition-all h-24">
        <div className="w-full px-4 sm:px-6 lg:px-12 h-full flex items-center justify-between">
          {/* Logo Section */}
          <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center select-none shrink-0 h-full py-1.5">
            <img 
              src="/logo.png" 
              alt="Headway College Logo" 
              className="h-full w-auto object-contain"
              style={{ filter: 'brightness(1.12) contrast(1.05)' }}
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-x-5 h-full">
            {menuItems.map((item) => (
              <a 
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-slate-600 hover:text-[#0000FE] text-sm font-black uppercase tracking-wider transition-colors py-2 cursor-pointer"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Auth Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="px-6 py-3 bg-[#0000FE] hover:bg-[#EF1B1B] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border-none"
            >
              Student Login
            </button>
            <a 
              href="https://headwaycollege.ac.ke/home/admission" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black uppercase tracking-widest rounded-xl border border-slate-200 shadow-xs hover:-translate-y-0.5 transition-all duration-300"
            >
              Apply Online
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border-none cursor-pointer"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-24 left-0 w-full bg-white border-b border-slate-100 shadow-xl py-6 px-4 space-y-4 z-40 transition-all">
            <nav className="flex flex-col gap-3">
              {menuItems.map((item) => (
                <a 
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-slate-700 hover:text-[#0000FE] text-xs font-black uppercase tracking-wider py-2 transition-colors border-b border-slate-50 cursor-pointer"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-3 bg-[#0000FE] text-white font-bold rounded-xl text-center shadow-md active:scale-98 cursor-pointer border-none"
              >
                Student Login
              </button>
              <a
                href="https://headwaycollege.ac.ke/home/admission"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-white text-slate-800 font-bold rounded-xl text-center border border-slate-200 shadow-xs active:scale-98"
              >
                Apply Online
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section: SaaS Split-Screen Style */}
      <section className="relative min-h-[580px] lg:min-h-[660px] flex items-center bg-slate-900 overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0000FE]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#EF1B1B]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline and Call-To-Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EF1B1B]/15 text-[#EF1B1B] text-xs font-black uppercase tracking-widest rounded-full border border-[#EF1B1B]/35 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF1B1B] animate-pulse" />
                e-PoE Assessment Center
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">
                Get Your e-PoE Ready For <span className="text-[#0000FE] bg-gradient-to-r from-blue-500 to-[#0000FE] bg-clip-text text-transparent">Assessment & Verification</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Headway College helps trainees check registered assessment units, upload project documents, receive direct lecturer feedback early, and sit online competency modules exams smoothly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <button
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#0000FE] hover:bg-[#EF1B1B] text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-900/20 hover:shadow-red-600/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  Enter Student Portal <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    const whySec = document.getElementById('why-epoe');
                    if (whySec) whySec.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-2xl border border-white/15 hover:border-white/35 transition-all backdrop-blur-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  Why e-PoE?
                </button>
              </div>
            </div>

            {/* Right Column: High-Fidelity e-PoE Portal Preview */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#0000FE]/20 to-[#EF1B1B]/20 rounded-3xl blur-xl opacity-60 pointer-events-none" />
              
              <div className="relative w-full max-w-sm bg-slate-900/80 backdrop-blur-lg rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5 text-left text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">headway_poe_v2.0</span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0000FE]/10 border border-[#0000FE]/20 flex items-center justify-center text-[#0000FE]">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white leading-none">John Doe</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">Trainee Reg No: 0890</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-400">ICT Portfolio Submissions</span>
                      <span className="text-emerald-400">12 / 12 Submitted</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Assigned Online Exam</p>
                      <p className="text-[11px] font-black text-white">Computer Applications</p>
                    </div>
                    <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black uppercase rounded-lg animate-pulse">
                      Live
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[9px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1"><Award size={10} className="text-[#0000FE]" /> TVET CDACC Accredited</span>
                  <span>100% Verifiable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accreditations Trust Badge Strip */}
      <div className="bg-slate-950 border-y border-slate-900 py-8 select-none" id="exam-bodies">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">Accredited Examination & Assessment Partners</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            {['TVET CDACC', 'KASNEB', 'NITA', 'ICDL Foundation', 'ICM UK', 'TVETA Kenya'].map((body) => (
              <span 
                key={body} 
                className="text-slate-400 font-extrabold text-xs sm:text-sm tracking-widest hover:text-white transition-colors cursor-default"
              >
                {body}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Section: The Problem We Solve (Box Files vs. e-PoE Portal) */}
      <section className="py-24 bg-slate-50 border-b border-slate-200" id="why-epoe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">The e-PoE Edge</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Your Portfolio Should Not Be Trapped In Box Files</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">
              Traditional physical files get damaged, misplaced, or forgotten. Move from cluttered box folders to a structured digital workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* The Old Way: Paper Files */}
            <div className="bg-white p-8 md:p-10 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <XCircle size={20} />
                </span>
                <h3 className="text-lg font-black text-slate-900">The Old Way (Box Files & WhatsApp)</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Box files get damaged, stained, or lost.",
                  "Phone photos and evidence files disappear when needed most.",
                  "WhatsApp evidence gets buried in old chats and threads.",
                  "Instructors struggle to review scattered folders and logs early.",
                  "Trainees discover gaps in unit coverage too late during assessment week."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                    <span className="text-red-500 pt-0.5 font-bold"><X size={16} /></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The New Way: Headway Portal */}
            <div className="bg-slate-900 p-8 md:p-10 rounded-[32px] border border-slate-800 shadow-xl space-y-6 text-slate-300">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle size={20} />
                </span>
                <h3 className="text-lg font-black text-white">The Headway Way (Digital e-PoE Portal)</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "100% secure cloud storage of all your competence files.",
                  "Zero print costs — upload files directly from your phone or PC.",
                  "Direct instructor comments and early milestone reviews.",
                  "Structured checklist of modules and registered units.",
                  "Immediate readiness status indicators before official assessments start."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-400 text-xs md:text-sm font-medium leading-relaxed">
                    <span className="text-emerald-400 pt-0.5 font-bold"><Check size={16} /></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Highlight Banner */}
          <div className="bg-[#0000FE]/5 border border-[#0000FE]/10 rounded-2xl p-6 text-center max-w-4xl mx-auto">
            <p className="text-slate-700 text-xs md:text-sm lg:text-base font-bold leading-relaxed">
              👉 <span className="text-[#0000FE] font-black">Pro Tip:</span> Uploading evidence early gives lecturers time to review and guide you, minimizing last-minute pressure.
            </p>
          </div>
        </div>
      </section>

      {/* Section: How It Works (Step by Step) */}
      <section className="py-24 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">Trainee Path</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">How Your e-PoE Journey Flows</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">
              Experience a streamlined, step-by-step digital process from unit registration to certified outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Upload Evidence",
                desc: "Upload photos, videos, and documents for your competency units directly from your phone or computer."
              },
              {
                step: "02",
                title: "Get Reviewed",
                desc: "Instructors inspect your submissions online and provide direct feedback and grading outcomes."
              },
              {
                step: "03",
                title: "Sit Assessments",
                desc: "Participate in integrated online exams and practical tests right inside the secure portal environment."
              },
              {
                step: "04",
                title: "Receive Certificates",
                desc: "Download high-resolution, secure Certificate of Competence files complete with digital QR verification seals."
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm relative group hover:border-[#0000FE] hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <span className="absolute top-4 right-6 text-4xl font-black text-slate-200/80 group-hover:text-[#0000FE]/20 transition-colors">
                  {item.step}
                </span>
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                  <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Executive Welcome & Director Quote Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-200" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center" id="welcome-section">
            {/* Welcome Card & Image on Left */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#0000FE]/10 to-[#EF1B1B]/10 rounded-[32px] blur-2xl opacity-60 pointer-events-none" />
              <div className="relative bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 group">
                <img 
                  src="https://headwaycollege.ac.ke/uploads/frontend/home_page/wellcome1.jpeg" 
                  alt="Headway College campus environment" 
                  className="w-full h-[380px] object-cover group-hover:scale-103 transition-transform duration-700"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent p-6 text-white">
                  <p className="text-sm font-black tracking-wider uppercase text-[#EF1B1B]">Embakasi Campus</p>
                  <p className="text-xs text-slate-300 font-semibold mt-1">Airport View Plaza, Eastern Bypass, Nairobi</p>
                </div>
              </div>
            </div>

            {/* Welcome Quote Content on Right */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">Director's Message</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Leading the Future of Professional Competence
              </h2>
              <div className="w-12 h-1 bg-[#0000FE] rounded-full" />
              
              {/* Blockquote Quote */}
              <div className="relative pl-6 border-l-4 border-[#EF1B1B]/30 space-y-4">
                <p className="text-slate-600 font-bold italic text-base md:text-lg leading-relaxed">
                  "Welcome to Headway College of Professional Studies. We nurture talent, foster creativity, and equip students with job-ready competencies in today's digital landscape. Our Portfolio of Evidence (PoE) portal is a testament to our commitment to innovation and educational integrity."
                </p>
              </div>
              
              <p className="text-slate-500 font-medium text-xs md:text-sm leading-relaxed text-justify">
                At Headway College, we prioritize hands-on skill-building over standard theoretical models. Our programs are closely integrated with exam bodies like TVET CDACC, KASNEB, and NITA, guaranteeing accredited, industry-focused qualifications. We guide each student through structured learning outcomes, helping them build proof of their knowledge dynamically.
              </p>

              {/* Signature Title */}
              <div className="pt-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-extrabold text-[#0000FE] border border-slate-200">
                  HW
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Office of the Director</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Headway College of Professional Studies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Course Finder & Department Filter */}
      <section className="py-24 bg-white" id="courses">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">Find Your Path</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Explore Our Professional Courses</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              Select a department to view featured programs accredited by national and global certification boards.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex justify-center gap-4 border-b border-slate-100 pb-4 max-w-md mx-auto">
            {[
              { id: 'it', label: 'IT & Digital' },
              { id: 'business', label: 'Business & Finance' },
              { id: 'technical', label: 'Technical & Beauty' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDeptTab(tab.id)}
                className={`pb-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer border-none bg-transparent ${
                  activeDeptTab === tab.id
                    ? 'border-[#0000FE] text-[#0000FE]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeDeptTab === 'it' && [
              { name: "Diploma in ICT (Level 6)", body: "TVET CDACC", duration: "2 Years", desc: "Advanced training in systems development, networking, and IT infrastructure administration." },
              { name: "Certificate in ICT (Level 5)", body: "TVET CDACC", duration: "1 Year", desc: "Foundation training in computer applications, databases, and software support." },
              { name: "International Computer Driving License (ICDL)", body: "ICDL Foundation", duration: "3 Months", desc: "Globally accredited standard certification for essential work computing skills." }
            ].map((course, i) => (
              <div key={i} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#0000FE] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 bg-[#0000FE]/10 text-[#0000FE] text-xs font-black rounded-lg">{course.body}</span>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">{course.name}</h3>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">{course.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-200/60 mt-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration: {course.duration}</span>
                  <button 
                    onClick={() => window.open('https://headwaycollege.ac.ke/home/admission', '_blank')}
                    className="text-xs font-black uppercase text-[#0000FE] hover:text-[#EF1B1B] transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    Apply <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}

            {activeDeptTab === 'business' && [
              { name: "KASNEB Professional Courses (CPA)", body: "KASNEB", duration: "2.5 Years", desc: "Professional accounting training covering taxation, audit, and financial management." },
              { name: "Diploma in Business Management", body: "KNEC / ICM", duration: "2 Years", desc: "Comprehensive business administration studies covering operations, HR, and marketing." },
              { name: "Certificate in Hospitality Management", body: "ICM / KNEC", duration: "1.5 Years", desc: "Foundational training in food & beverage management, catering, and front office operations." }
            ].map((course, i) => (
              <div key={i} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#0000FE] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 bg-[#0000FE]/10 text-[#0000FE] text-xs font-black rounded-lg">{course.body}</span>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">{course.name}</h3>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">{course.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-200/60 mt-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration: {course.duration}</span>
                  <button 
                    onClick={() => window.open('https://headwaycollege.ac.ke/home/admission', '_blank')}
                    className="text-xs font-black uppercase text-[#0000FE] hover:text-[#EF1B1B] transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    Apply <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}

            {activeDeptTab === 'technical' && [
              { name: "Diploma in Fashion Design", body: "KNEC / NITA", duration: "2 Years", desc: "Creative garment styling, pattern construction, textile sciences, and clothing technology." },
              { name: "Certificate in Hairdressing & Beauty Therapy", body: "NITA / KNEC", duration: "1 Year", desc: "Comprehensive training in salon work, hair styling, cosmetology, and skin care aesthetics." },
              { name: "NITA Grade III/II/I Trade Test Preparations", body: "NITA Board", duration: "6 Months", desc: "Practical hands-on bootcamps preparing learners for government trades assessments." }
            ].map((course, i) => (
              <div key={i} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#0000FE] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 bg-[#0000FE]/10 text-[#0000FE] text-xs font-black rounded-lg">{course.body}</span>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">{course.name}</h3>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">{course.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-200/60 mt-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration: {course.duration}</span>
                  <button 
                    onClick={() => window.open('https://headwaycollege.ac.ke/home/admission', '_blank')}
                    className="text-xs font-black uppercase text-[#0000FE] hover:text-[#EF1B1B] transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    Apply <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200" id="facilities">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">Support Services</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Why Learn With Us?</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              Providing modern facilities and holistic assistance to support students academically and logistically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#EF1B1B] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#0000FE]/5 group-hover:bg-[#0000FE]/10 flex items-center justify-center text-[#0000FE] mb-6 transition-colors">
                <Laptop size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">Online Classes</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                Flexible online classes designed to fit your busy professional schedule, keeping you on track from home.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#EF1B1B] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#0000FE]/5 group-hover:bg-[#0000FE]/10 flex items-center justify-center text-[#0000FE] mb-6 transition-colors">
                <GraduationCap size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">Scholarships</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                Assisting deserving trainees with merit-based tuition support to lower barriers to entry.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#EF1B1B] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#0000FE]/5 group-hover:bg-[#0000FE]/10 flex items-center justify-center text-[#0000FE] mb-6 transition-colors">
                <Library size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">Books & Library</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                Vast physical and digital research archives ensuring students have access to verified study texts.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#EF1B1B] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#0000FE]/5 group-hover:bg-[#0000FE]/10 flex items-center justify-center text-[#0000FE] mb-6 transition-colors">
                <Home size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">Hostels</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                Safe, comfortable, and affordable student housing blocks adjacent to the Embakasi campus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* "Inside the PoE Portal" Mockup Preview Section */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">Digital Innovation</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Our Modern Student PoE Portal</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              A sneak peek inside our state-of-the-art student management portal. Experience learning, exam participation, and evidence submission digitized.
            </p>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="flex justify-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 max-w-lg mx-auto shadow-sm">
            {[
              { id: 'dashboard', label: 'Trainee Dashboard' },
              { id: 'exam', label: 'Online Exam Portal' },
              { id: 'verification', label: 'Certificate Verification' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePortalTab(tab.id)}
                className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all border-none cursor-pointer ${
                  activePortalTab === tab.id
                    ? 'bg-[#0000FE] text-white shadow-md'
                    : 'text-slate-500 hover:text-[#0000FE] hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Screen Display */}
          <div className="max-w-4xl mx-auto bg-[#1E293B] rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 text-white relative">
            <div className="absolute top-4 left-6 flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>

            {/* Dashboard Screen */}
            {activePortalTab === 'dashboard' && (
              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <h4 className="text-lg font-black">Student Dashboard Overview</h4>
                    <p className="text-xs text-slate-400">Welcome back, John Doe (Trainee ID: 0890)</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase rounded-lg">Active Session</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700/50 space-y-2">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Registered Units</p>
                    <p className="text-3xl font-black text-[#0000FE]">4 Units</p>
                  </div>
                  <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700/50 space-y-2">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Submitted Evidence</p>
                    <p className="text-3xl font-black text-emerald-400">12 Files</p>
                  </div>
                  <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700/50 space-y-2">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Online Exams Assigned</p>
                    <p className="text-3xl font-black text-[#EF1B1B]">1 Active</p>
                  </div>
                </div>
              </div>
            )}

            {/* Exam Screen */}
            {activePortalTab === 'exam' && (
              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <h4 className="text-lg font-black">Online Assessment: Computer Applications</h4>
                    <p className="text-xs text-slate-400">Read the questions carefully before submitting.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg text-xs font-bold animate-pulse">
                    <Clock size={14} /> Time Remaining: 44:12
                  </div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 space-y-4 text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#EF1B1B]">Question 3 of 40</span>
                  <p className="font-bold text-sm md:text-base text-slate-200">Which Microsoft Office tool is primarily used for constructing spreadsheet data and performing calculations?</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {['Microsoft Word', 'Microsoft Excel', 'Microsoft Access', 'Microsoft Publisher'].map((opt, i) => (
                      <div key={i} className={`p-4 rounded-xl border text-xs font-bold transition-all ${
                        opt === 'Microsoft Excel'
                          ? 'border-[#0000FE] bg-[#0000FE]/5 text-white'
                          : 'border-slate-700 bg-slate-900/40 text-slate-400'
                      }`}>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Verification Screen */}
            {activePortalTab === 'verification' && (
              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <h4 className="text-lg font-black">Digital Credential Verification</h4>
                    <p className="text-xs text-slate-400">Tamper-proof verifiable credentials powered by PoE Systems.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase rounded-lg">Verified</span>
                </div>

                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 flex flex-col md:flex-row items-center gap-6 text-left">
                  <div className="w-20 h-20 bg-white p-2 rounded-2xl flex items-center justify-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-lg" /> {/* QR Mock */}
                  </div>
                  <div className="space-y-2 flex-1">
                    <h5 className="font-black text-sm text-slate-100">Certificate Reference: HEADWAY-2026-0890</h5>
                    <p className="text-xs text-slate-400">Recipient Trainee: <span className="text-white font-bold">John Doe</span></p>
                    <p className="text-xs text-slate-400">Awarded: <span className="text-white font-bold">Proficiency in Computer Applications</span></p>
                    <p className="text-xs text-slate-400">Authentic Signature verified: <span className="text-emerald-400 font-bold">Director of Studies</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Counters & Statistics Section */}
      <section 
        className="py-20 relative bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 254, 0.9), rgba(0, 0, 254, 0.9)), url(https://headwaycollege.ac.ke/uploads/frontend/home_page/counter-parallax1.jpg)`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Let The Numbers Speak</h2>
            <p className="text-blue-100 font-semibold max-w-xl mx-auto text-sm">
              Headway College continues to excel in professional studies across multiple disciplines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-900/30 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-lg space-y-4">
              <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Courses Offered</p>
              <p className="text-5xl font-black text-white tracking-tight">{stats.courses}+</p>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full" style={{ width: `${(stats.courses / 96) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-900/30 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-lg space-y-4">
              <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Assessing Bodies</p>
              <p className="text-5xl font-black text-white tracking-tight">{stats.bodies}+</p>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full" style={{ width: `${(stats.bodies / 8) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-900/30 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-lg space-y-4">
              <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Departments</p>
              <p className="text-5xl font-black text-white tracking-tight">{stats.depts}+</p>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full" style={{ width: `${(stats.depts / 6) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teachers / Description Section */}
      <section 
        className="py-24 relative bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(https://headwaycollege.ac.ke/uploads/frontend/home_page/featured-parallax1.jpg)`
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">Expert Faculty</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Experienced Teaching Team</h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium text-justify md:text-center">
            At Headway College of Professional Studies, we take pride in our team of dedicated and highly skilled educators who bring a wealth of knowledge and expertise to every class. Our faculty members hold advanced degrees and certifications in their respective fields, ensuring top-notch education for our students. With years of experience in both academia and industry, our teachers blend theory with practical insights, making learning relevant and engaging.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200" id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">FAQ</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              Got questions? We have answers. Find general details regarding our curriculum formats, accreditations, and portal access below.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is a Portfolio of Evidence (PoE) and how does it work?",
                a: "A Portfolio of Evidence (PoE) is a cumulative collection of all your academic assignments, lab reports, and assessments showing your competencies. Rather than depending on a single terminal exam, instructors evaluate your learning milestones continuously through the portal."
              },
              {
                q: "Are Headway College courses accredited by TVETA and CDACC?",
                a: "Yes! Headway College is a fully TVETA-registered institution. Our courses are certified by national examination bodies including TVET CDACC, KASNEB, NITA, and the globally recognized ICDL Foundation."
              },
              {
                q: "Can I choose between online learning and on-campus classes?",
                a: "Absolutely. We offer day, evening, Saturday, and distance learning online classes to cater to different students' schedules and needs."
              },
              {
                q: "How do I verify the authenticity of a Headway College certificate?",
                a: "Every certificate has a unique Reference Number and an official QR code. Employers and students can scan the QR code to verify the certificate's validity instantly against our database records."
              }
            ].map((faq, index) => {
              const isOpen = faqOpenIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left font-black text-slate-950 hover:text-[#0000FE] transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <span className="text-sm md:text-base pr-4">{faq.q}</span>
                    <span className={`text-slate-400 font-bold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown size={20} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-6 pt-0 border-t border-slate-50 text-slate-600 text-xs md:text-sm font-medium leading-relaxed bg-slate-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Application Banner */}
      <section className="bg-[#EF1B1B] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <h3 className="text-2xl font-black tracking-tight">Ready to start your professional journey?</h3>
            <p className="text-red-100 font-semibold text-xs md:text-sm">Apply online today and reserve your spot for the upcoming intake.</p>
          </div>
          <a 
            href="https://headwaycollege.ac.ke/home/admission" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full md:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-[#EF1B1B] text-center text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            Apply Online Now
          </a>
        </div>
      </section>

      {/* Unified Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          {/* Logo & Intro */}
          <div className="space-y-4 md:col-span-1">
            <img 
              src="/logo.png" 
              alt="Headway College Logo" 
              className="h-16 w-auto object-contain brightness-0 invert" 
            />
            <p className="text-xs font-semibold leading-relaxed text-slate-500">
              Where Excellence Meets Opportunity. Embakasi Campus, Nairobi.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-black text-xs uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <a 
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h4 className="text-white font-black text-xs uppercase tracking-wider">Programs</h4>
            <ul className="space-y-2 text-xs">
              <li>IT & Computer Science</li>
              <li>Business & Accounting</li>
              <li>Vocational Programs</li>
              <li>Cosmetology & Beauty</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-white font-black text-xs uppercase tracking-wider">Contact Info</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#EF1B1B] shrink-0 mt-0.5" />
                <span>Airport View Plaza, 3rd Floor, Eastern Bypass, Embakasi, Nairobi</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#EF1B1B] shrink-0" />
                <a href="tel:+254709230000" className="hover:text-white transition-colors">+254 709 230 000</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-[#EF1B1B] shrink-0" />
                <a href="mailto:info@headwaycollege.ac.ke" className="hover:text-white transition-colors">info@headwaycollege.ac.ke</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-12 border-t border-slate-900/60 text-center text-[10px] font-bold text-slate-600 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Headway College of Professional Studies. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="https://headwaycollege.ac.ke/home/privacy_policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="https://headwaycollege.ac.ke/home/terms_conditions" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp chat widget */}
      <div className="fixed bottom-6 right-6 z-40 space-y-3">
        {whatsappOpen && (
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 max-w-[280px] text-left animate-slide-up text-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold font-sans shrink-0">
                H
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-900 leading-none">Headway Admissions</h4>
                <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded-sm">Online</span>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-2">
                  Hello! How can we assist you with admissions, course selection, or portal access today?
                </p>
              </div>
            </div>
            <a 
              href="https://wa.me/254709230000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 text-decoration-none"
            >
              Start Chat <ArrowRight size={14} />
            </a>
          </div>
        )}
        <button 
          onClick={() => setWhatsappOpen(!whatsappOpen)}
          className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-none ml-auto"
        >
          <MessageSquare size={24} />
        </button>
      </div>
    </div>
  );
};

export default Landing;

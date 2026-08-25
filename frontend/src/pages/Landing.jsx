import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import {
  Award,
  GraduationCap,
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Laptop,
  Library,
  Home,
  Menu,
  X,
  ExternalLink,
  MessageSquare,
  ChevronDown,
  CheckCircle,
  XCircle,
  Check
} from 'lucide-react';

const BRAND_BLUE = '#0000FE';
const BRAND_RED = '#EF1B1B';
const INK = '#141313';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const [stats, setStats] = useState({ courses: 0, bodies: 0, depts: 0 });
  const [activeDeptTab, setActiveDeptTab] = useState('it');
  const [activePortalTab, setActivePortalTab] = useState('dashboard');
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  useEffect(() => {
    const duration = 1600;
    const steps = 40;
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
      if (currentStep >= steps) clearInterval(timer);
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

  const evidenceUnits = [
    { code: 'ICT/OS/CU/01/1', name: 'Install Computer Hardware', status: 'done' },
    { code: 'ICT/OS/CU/03/2', name: 'Configure Operating Systems', status: 'pending' },
    { code: 'ICT/OS/CU/04/2', name: 'Troubleshoot System Faults', status: 'done' },
    { code: 'ICT/OS/CU/05/3', name: 'Perform Backup and Recovery', status: 'missing' },
  ];

  const statusStyles = {
    done: { label: 'Verified', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25' },
    pending: { label: 'Awaiting sign-off', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/25' },
    missing: { label: 'Evidence missing', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/25' },
  };

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const courseData = {
    it: [
      { name: 'Diploma in ICT (Level 6)', body: 'TVET CDACC', duration: '2 Years', desc: 'Advanced training in systems development, networking, and IT infrastructure administration.' },
      { name: 'Certificate in ICT (Level 5)', body: 'TVET CDACC', duration: '1 Year', desc: 'Foundation training in computer applications, databases, and software support.' },
      { name: 'International Computer Driving License (ICDL)', body: 'ICDL Foundation', duration: '3 Months', desc: 'Globally accredited standard certification for essential work computing skills.' }
    ],
    business: [
      { name: 'KASNEB Professional Courses (CPA)', body: 'KASNEB', duration: '2.5 Years', desc: 'Professional accounting training covering taxation, audit, and financial management.' },
      { name: 'Diploma in Business Management', body: 'KNEC / ICM', duration: '2 Years', desc: 'Comprehensive business administration studies covering operations, HR, and marketing.' },
      { name: 'Certificate in Hospitality Management', body: 'ICM / KNEC', duration: '1.5 Years', desc: 'Foundational training in food & beverage management, catering, and front office operations.' }
    ],
    technical: [
      { name: 'Diploma in Fashion Design', body: 'KNEC / NITA', duration: '2 Years', desc: 'Creative garment styling, pattern construction, textile sciences, and clothing technology.' },
      { name: 'Certificate in Hairdressing & Beauty Therapy', body: 'NITA / KNEC', duration: '1 Year', desc: 'Comprehensive training in salon work, hair styling, cosmetology, and skin care aesthetics.' },
      { name: 'NITA Grade III/II/I Trade Test Preparations', body: 'NITA Board', duration: '6 Months', desc: 'Practical hands-on bootcamps preparing learners for government trades assessments.' }
    ]
  };

  const faqData = [
    { q: 'What is a Portfolio of Evidence (PoE) and how does it work?', a: 'A Portfolio of Evidence (PoE) is a cumulative collection of all your academic assignments, lab reports, and assessments showing your competencies. Rather than depending on a single terminal exam, instructors evaluate your learning milestones continuously through the portal.' },
    { q: 'Are Headway College courses accredited by TVETA and CDACC?', a: 'Yes! Headway College is a fully TVETA-registered institution. Our courses are certified by national examination bodies including TVET CDACC, KASNEB, NITA, and the globally recognized ICDL Foundation.' },
    { q: 'Can I choose between online learning and on-campus classes?', a: 'Absolutely. We offer day, evening, Saturday, and distance learning online classes to cater to different students\' schedules and needs.' },
    { q: 'How do I verify the authenticity of a Headway College certificate?', a: 'Every certificate has a unique reference number and an official QR code. Employers and students can scan the QR code to verify the certificate\'s validity instantly against our database records.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased scroll-smooth" style={{ color: INK }} id="home">
      <SEO
        title="Digital Portfolio of Evidence | Headway College e-PoE Portal"
        description="Access the official Headway College e-PoE Portal. Track assessment units, upload competency evidence, receive instructor feedback, and sit exams online."
        keywords="Headway College POE, Portfolio of Evidence, Headway College Portfolio of Evidence, Headway Student Portal, POE Portal Headway College, headway college, poe headway, headway college ac ke"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      {/* Announcement bar */}
      <div className="text-white text-xs md:text-sm font-semibold py-2.5 px-4 text-center select-none" style={{ backgroundColor: BRAND_RED }}>
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 tracking-wide uppercase font-['IBM_Plex_Mono']">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>May 2026 intake is ongoing — apply to Headway College today</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 h-20">
        <div className="w-full px-4 sm:px-6 lg:px-12 h-full flex items-center justify-between">
          <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center select-none shrink-0 h-full py-2">
            <img src="/logo.png" alt="Headway College Logo" className="h-full w-auto object-contain" />
          </a>

          <nav className="hidden lg:flex items-center gap-x-8 h-full">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-slate-600 text-sm font-semibold tracking-wide transition-colors py-2 cursor-pointer"
                style={{ '--hover-color': BRAND_BLUE }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BRAND_BLUE)}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              Student Login
            </button>
            <a
              href="https://headwaycollege.ac.ke/home/admission"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-white text-slate-800 text-sm font-semibold rounded-lg border border-slate-300 hover:border-slate-400 transition-all duration-200"
            >
              Apply Online
            </a>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border-none cursor-pointer"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-lg py-6 px-4 space-y-4 z-40">
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-slate-700 text-sm font-semibold py-2.5 border-b border-slate-50 cursor-pointer"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full py-3 text-white font-semibold rounded-lg text-center cursor-pointer border-none"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                Student Login
              </button>
              <a
                href="https://headwaycollege.ac.ke/home/admission"
                target="_blank" rel="noopener noreferrer"
                className="w-full py-3 bg-white text-slate-800 font-semibold rounded-lg text-center border border-slate-300"
              >
                Apply Online
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28" style={{ backgroundColor: '#0a0e1a' }}>
        <div
          className="absolute top-0 right-0 w-[440px] h-[440px] rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ backgroundColor: BRAND_BLUE }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium uppercase tracking-widest rounded-md border font-['IBM_Plex_Mono']"
                style={{ color: '#8fa0ff', borderColor: 'rgba(0,0,254,0.4)', backgroundColor: 'rgba(0,0,254,0.12)' }}
              >
                e-PoE Assessment Center
              </span>
              <h1 className="font-['Sora'] font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight">
                Every unit, evidenced —<br className="hidden lg:block" />
                <span style={{ color: '#5b6cff' }}>ready before verification day.</span>
              </h1>
              <p className="text-slate-400 text-base lg:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Register your units, upload evidence as you complete it, get lecturer feedback early, and sit your online competency exams — all inside one portal instead of a box file.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                  className="w-full sm:w-auto px-8 py-4 text-white text-sm font-semibold rounded-lg shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-none"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  Enter Student Portal <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => document.getElementById('why-epoe')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto px-8 py-4 text-white text-sm font-semibold rounded-lg border border-white/20 hover:border-white/40 transition-all cursor-pointer bg-transparent"
                >
                  Why e-PoE?
                </button>
              </div>
            </div>

            {/* Signature visual: evidence readiness ledger */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-white/10 bg-[#0f1626] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div>
                    <p className="text-white text-sm font-semibold">John Doe · Reg 0890</p>
                    <p className="text-slate-500 text-xs font-['IBM_Plex_Mono']">Diploma in ICT · Cohort 4</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    2 / 4 verified
                  </span>
                </div>
                <div className="divide-y divide-white/5">
                  {evidenceUnits.map((u) => {
                    const s = statusStyles[u.status];
                    return (
                      <div key={u.code} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="text-slate-500 text-[10px] font-['IBM_Plex_Mono'] mb-0.5">{u.code}</p>
                          <p className="text-slate-200 text-sm font-medium">{u.name}</p>
                        </div>
                        <span className={`shrink-0 ml-4 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${s.bg} ${s.text} ${s.border}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 py-3.5 flex items-center justify-between text-[10px] font-['IBM_Plex_Mono'] text-slate-500 border-t border-white/10">
                  <span className="flex items-center gap-1.5"><Award size={12} style={{ color: '#5b6cff' }} /> TVET CDACC ACCREDITED</span>
                  <span>UPDATED LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div className="bg-white border-b border-slate-200 py-7 select-none" id="exam-bodies">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-[0.2em] font-['IBM_Plex_Mono']">Accredited examination &amp; assessment partners</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {['TVET CDACC', 'KASNEB', 'NITA', 'ICDL Foundation', 'ICM UK', 'TVETA Kenya'].map((body) => (
              <span key={body} className="text-slate-500 font-semibold text-sm tracking-wide">{body}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Why e-PoE */}
      <section className="py-24 bg-slate-50 border-b border-slate-200" id="why-epoe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']" style={{ color: BRAND_RED }}>The e-PoE edge</span>
            <h2 className="font-['Sora'] text-3xl md:text-4xl font-bold tracking-tight">Your portfolio shouldn't live in a box file</h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">Paper files get damaged, misplaced, or forgotten. Move from a cluttered folder to a structured digital record.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-8 md:p-10 rounded-xl border border-slate-200 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="w-8 h-8 rounded-md bg-red-50 text-red-600 flex items-center justify-center"><XCircle size={18} /></span>
                <h3 className="font-['Sora'] text-lg font-semibold">The old way</h3>
              </div>
              <ul className="space-y-3.5">
                {[
                  'Box files get damaged, stained, or lost.',
                  'Phone photos and evidence disappear when needed most.',
                  'Evidence sent on WhatsApp gets buried in old chats.',
                  'Instructors can\'t review scattered folders and logs early.',
                  'Gaps in unit coverage surface too late, during assessment week.'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-500 text-sm leading-relaxed">
                    <X size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 md:p-10 rounded-xl border border-slate-800 space-y-6" style={{ backgroundColor: '#0a0e1a' }}>
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <span className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><CheckCircle size={18} /></span>
                <h3 className="font-['Sora'] text-lg font-semibold text-white">The Headway way</h3>
              </div>
              <ul className="space-y-3.5">
                {[
                  'Secure cloud storage for every piece of competence evidence.',
                  'Zero print costs — upload directly from your phone or PC.',
                  'Direct instructor comments and early milestone reviews.',
                  'A structured checklist of every registered unit.',
                  'A readiness status you can see before assessment even starts.'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-400 text-sm leading-relaxed">
                    <Check size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl p-5 text-center max-w-3xl mx-auto border" style={{ backgroundColor: 'rgba(0,0,254,0.04)', borderColor: 'rgba(0,0,254,0.15)' }}>
            <p className="text-sm md:text-base font-medium leading-relaxed">
              <span className="font-semibold" style={{ color: BRAND_BLUE }}>Tip:</span> uploading evidence early gives lecturers time to review and guide you — that's what actually removes last-minute pressure.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']" style={{ color: BRAND_RED }}>Trainee path</span>
            <h2 className="font-['Sora'] text-3xl md:text-4xl font-bold tracking-tight">How your e-PoE journey flows</h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">The same sequence your assessment plan expects — nothing left to chase down on paper.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-6 left-0 right-0 h-px bg-slate-200" />
            {[
              { step: '01', title: 'Upload evidence', desc: 'Upload photos, videos and documents for each competency unit, straight from your phone or computer.' },
              { step: '02', title: 'Get reviewed', desc: 'Instructors inspect your submissions online and return direct feedback and grading outcomes.' },
              { step: '03', title: 'Sit assessments', desc: 'Participate in integrated online exams and practical tests inside the secure portal.' },
              { step: '04', title: 'Receive certificates', desc: 'Download secure Certificate of Competence files with a digital QR verification seal.' }
            ].map((item, idx) => (
              <div key={idx} className="relative space-y-4">
                <div
                  className="relative z-10 w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center font-['IBM_Plex_Mono'] text-sm font-medium"
                  style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}
                >
                  {item.step}
                </div>
                <h3 className="font-['Sora'] text-lg font-semibold">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Director's message */}
      <section className="py-24 bg-slate-50 border-y border-slate-200" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src="https://headwaycollege.ac.ke/uploads/frontend/home_page/wellcome1.jpeg"
                  alt="Headway College campus environment"
                  className="w-full h-[360px] object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 text-white">
                  <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#ff7373' }}>Embakasi Campus</p>
                  <p className="text-xs text-slate-200 mt-1">Airport View Plaza, Eastern Bypass, Nairobi</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']" style={{ color: BRAND_RED }}>Director's message</span>
              <h2 className="font-['Sora'] text-3xl md:text-4xl font-bold tracking-tight leading-tight">Leading the future of professional competence</h2>
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: BRAND_BLUE }} />

              <p className="text-slate-700 font-medium italic text-base md:text-lg leading-relaxed pl-5 border-l-2" style={{ borderColor: 'rgba(239,27,27,0.35)' }}>
                "Welcome to Headway College of Professional Studies. We nurture talent, foster creativity, and equip students with job-ready competencies. Our Portfolio of Evidence portal is a testament to our commitment to innovation and educational integrity."
              </p>

              <p className="text-slate-500 text-sm leading-relaxed">
                At Headway College, we prioritize hands-on skill-building over standard theoretical models. Our programs are closely integrated with exam bodies like TVET CDACC, KASNEB, and NITA, guaranteeing accredited, industry-focused qualifications.
              </p>

              <div className="pt-2 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-semibold border border-slate-200" style={{ color: BRAND_BLUE }}>HW</div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide">Office of the Director</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Headway College of Professional Studies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-24 bg-white" id="courses">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']" style={{ color: BRAND_RED }}>Find your path</span>
            <h2 className="font-['Sora'] text-3xl font-bold tracking-tight">Explore our professional courses</h2>
            <p className="text-slate-500 text-sm md:text-base">Select a department to view programs accredited by national and global certification boards.</p>
          </div>

          <div className="flex justify-center gap-6 border-b border-slate-200 max-w-lg mx-auto">
            {[
              { id: 'it', label: 'IT & Digital' },
              { id: 'business', label: 'Business & Finance' },
              { id: 'technical', label: 'Technical & Beauty' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDeptTab(tab.id)}
                className="pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer border-none bg-transparent"
                style={activeDeptTab === tab.id
                  ? { borderBottomColor: BRAND_BLUE, color: BRAND_BLUE, borderBottomWidth: '2px' }
                  : { borderBottomColor: 'transparent', color: '#94a3b8' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseData[activeDeptTab].map((course, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-7 border border-slate-200 hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md" style={{ backgroundColor: 'rgba(0,0,254,0.08)', color: BRAND_BLUE }}>{course.body}</span>
                  <h3 className="font-['Sora'] text-base font-semibold leading-snug">{course.name}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{course.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-5 border-t border-slate-200 mt-5">
                  <span className="text-xs font-medium text-slate-400 font-['IBM_Plex_Mono']">{course.duration}</span>
                  <button
                    onClick={() => window.open('https://headwaycollege.ac.ke/home/admission', '_blank')}
                    className="text-xs font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    style={{ color: BRAND_BLUE }}
                  >
                    Apply <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-24 bg-slate-50 border-t border-slate-200" id="facilities">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']" style={{ color: BRAND_RED }}>Support services</span>
            <h2 className="font-['Sora'] text-3xl font-bold tracking-tight">Why learn with us?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Laptop, title: 'Online classes', desc: 'Flexible online classes designed to fit your busy professional schedule.' },
              { icon: GraduationCap, title: 'Scholarships', desc: 'Merit-based tuition support that lowers the barrier to entry.' },
              { icon: Library, title: 'Books & library', desc: 'Physical and digital archives with access to verified study texts.' },
              { icon: Home, title: 'Hostels', desc: 'Safe, comfortable student housing adjacent to the Embakasi campus.' }
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-7 border border-slate-200 hover:border-slate-300 transition-all duration-200">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(0,0,254,0.08)', color: BRAND_BLUE }}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-['Sora'] text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal preview */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']" style={{ color: BRAND_RED }}>Digital innovation</span>
            <h2 className="font-['Sora'] text-3xl font-bold tracking-tight">Inside the student e-PoE portal</h2>
            <p className="text-slate-500 text-sm md:text-base">A look at the portal that digitizes learning, exam participation, and evidence submission.</p>
          </div>

          <div className="flex justify-center gap-2 bg-slate-100 p-1.5 rounded-lg max-w-lg mx-auto">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'exam', label: 'Online Exam' },
              { id: 'verification', label: 'Verification' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePortalTab(tab.id)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-md transition-all border-none cursor-pointer"
                style={activePortalTab === tab.id
                  ? { backgroundColor: BRAND_BLUE, color: '#fff' }
                  : { backgroundColor: 'transparent', color: '#64748b' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-4xl mx-auto rounded-xl p-6 md:p-8 border border-slate-800 text-white relative" style={{ backgroundColor: '#0f1626' }}>
            <div className="absolute top-5 left-6 flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>

            {activePortalTab === 'dashboard' && (
              <div className="space-y-6 pt-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h4 className="text-base font-semibold">Student dashboard</h4>
                    <p className="text-xs text-slate-500">Welcome back, John Doe (Trainee ID: 0890)</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold uppercase rounded-md">Active session</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-5 bg-white/5 rounded-lg border border-white/10 space-y-1.5">
                    <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide font-['IBM_Plex_Mono']">Registered units</p>
                    <p className="text-2xl font-semibold" style={{ color: '#5b6cff' }}>4</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-lg border border-white/10 space-y-1.5">
                    <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide font-['IBM_Plex_Mono']">Submitted evidence</p>
                    <p className="text-2xl font-semibold text-emerald-400">12 files</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-lg border border-white/10 space-y-1.5">
                    <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide font-['IBM_Plex_Mono']">Exams assigned</p>
                    <p className="text-2xl font-semibold text-red-400">1 active</p>
                  </div>
                </div>
              </div>
            )}

            {activePortalTab === 'exam' && (
              <div className="space-y-6 pt-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h4 className="text-base font-semibold">Computer Applications</h4>
                    <p className="text-xs text-slate-500">Read the questions carefully before submitting.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/25 rounded-md text-xs font-semibold">
                    <Clock size={13} /> 44:12
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-6 border border-white/10 space-y-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']" style={{ color: '#ff7373' }}>Question 3 of 40</span>
                  <p className="font-medium text-sm text-slate-200">Which Microsoft Office tool is primarily used for spreadsheet data and calculations?</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Microsoft Word', 'Microsoft Excel', 'Microsoft Access', 'Microsoft Publisher'].map((opt, i) => (
                      <div key={i} className="p-3.5 rounded-lg border text-xs font-medium transition-all"
                        style={opt === 'Microsoft Excel'
                          ? { borderColor: BRAND_BLUE, backgroundColor: 'rgba(0,0,254,0.08)', color: '#fff' }
                          : { borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePortalTab === 'verification' && (
              <div className="space-y-6 pt-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h4 className="text-base font-semibold">Digital credential verification</h4>
                    <p className="text-xs text-slate-500">Tamper-proof credentials powered by the e-PoE system.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold uppercase rounded-md">Verified</span>
                </div>
                <div className="bg-white/5 rounded-lg p-6 border border-white/10 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-white p-2 rounded-lg flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-[#0f1626] rounded-sm" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h5 className="font-semibold text-sm">Certificate Ref: HEADWAY-2026-0890</h5>
                    <p className="text-xs text-slate-500">Recipient: <span className="text-white font-medium">John Doe</span></p>
                    <p className="text-xs text-slate-500">Awarded: <span className="text-white font-medium">Proficiency in Computer Applications</span></p>
                    <p className="text-xs text-slate-500">Signature verified: <span className="text-emerald-400 font-medium">Director of Studies</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        className="py-20 relative bg-cover bg-center text-white"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,254,0.92), rgba(0,0,254,0.92)), url(https://headwaycollege.ac.ke/uploads/frontend/home_page/counter-parallax1.jpg)` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-3">
            <h2 className="font-['Sora'] text-3xl md:text-4xl font-bold tracking-tight">Let the numbers speak</h2>
            <p className="text-blue-100 max-w-xl mx-auto text-sm">Headway College continues to excel in professional studies across multiple disciplines.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { label: 'Courses offered', value: stats.courses, target: 96 },
              { label: 'Assessing bodies', value: stats.bodies, target: 8 },
              { label: 'Departments', value: stats.depts, target: 6 }
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-7 border border-white/15 space-y-3">
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']">{s.label}</p>
                <p className="text-4xl font-bold tracking-tight">{s.value}+</p>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full" style={{ width: `${(s.value / s.target) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty */}
      <section
        className="py-24 relative bg-cover bg-center text-white"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.85)), url(https://headwaycollege.ac.ke/uploads/frontend/home_page/featured-parallax1.jpg)` }}
      >
        <div className="max-w-3xl mx-auto px-4 text-center space-y-5">
          <span className="text-xs font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']" style={{ color: '#ff7373' }}>Expert faculty</span>
          <h2 className="font-['Sora'] text-3xl md:text-4xl font-bold tracking-tight">Experienced teaching team</h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Our faculty members hold advanced degrees and certifications in their respective fields. With years of experience in both academia and industry, they blend theory with practical insight, making learning relevant and engaging.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50 border-t border-slate-200" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest font-['IBM_Plex_Mono']" style={{ color: BRAND_RED }}>FAQ</span>
            <h2 className="font-['Sora'] text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqData.map((faq, index) => {
              const isOpen = faqOpenIndex === index;
              return (
                <div key={index} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-white py-12" style={{ backgroundColor: BRAND_RED }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1.5">
            <h3 className="font-['Sora'] text-2xl font-bold tracking-tight">Ready to start your professional journey?</h3>
            <p className="text-red-100 text-sm">Apply online today and reserve your spot for the upcoming intake.</p>
          </div>
          <a
            href="https://headwaycollege.ac.ke/home/admission"
            target="_blank" rel="noopener noreferrer"
            className="w-full md:w-auto px-8 py-3.5 bg-white text-center text-sm font-semibold rounded-lg shadow-md transition-transform duration-200 hover:-translate-y-0.5"
            style={{ color: BRAND_RED }}
          >
            Apply Online Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-slate-400 py-16 border-t border-slate-900" style={{ backgroundColor: '#0a0e1a' }} id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <img src="/logo.png" alt="Headway College Logo" className="h-14 w-auto object-contain brightness-0 invert" />
            <p className="text-xs leading-relaxed text-slate-500">Where excellence meets opportunity. Embakasi Campus, Nairobi.</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Quick links</h4>
            <ul className="space-y-2 text-xs">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <a href={item.href} onClick={(e) => handleNavClick(e, item.href)} className="hover:text-white transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Programs</h4>
            <ul className="space-y-2 text-xs">
              <li>IT &amp; Computer Science</li>
              <li>Business &amp; Accounting</li>
              <li>Vocational Programs</li>
              <li>Cosmetology &amp; Beauty</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: BRAND_RED }} />
                <span>Airport View Plaza, 3rd Floor, Eastern Bypass, Embakasi, Nairobi</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0" style={{ color: BRAND_RED }} />
                <a href="tel:+254709230000" className="hover:text-white transition-colors">+254 709 230 000</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="shrink-0" style={{ color: BRAND_RED }} />
                <a href="mailto:info@headwaycollege.ac.ke" className="hover:text-white transition-colors">info@headwaycollege.ac.ke</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-12 border-t border-white/10 text-center text-[11px] text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Headway College of Professional Studies. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="https://headwaycollege.ac.ke/home/privacy_policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="https://headwaycollege.ac.ke/home/terms_conditions" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* WhatsApp widget */}
      <div className="fixed bottom-6 right-6 z-40 space-y-3">
        {whatsappOpen && (
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 max-w-[280px]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold shrink-0">H</div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold leading-none">Headway Admissions</h4>
                <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-semibold uppercase rounded-sm">Online</span>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-2">Hello! How can we assist you with admissions, course selection, or portal access today?</p>
              </div>
            </div>
            <a
              href="https://wa.me/254709230000"
              target="_blank" rel="noopener noreferrer"
              className="mt-4 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wide rounded-lg flex items-center justify-center gap-1.5 no-underline"
            >
              Start Chat <ArrowRight size={13} />
            </a>
          </div>
        )}
        <button
          onClick={() => setWhatsappOpen(!whatsappOpen)}
          className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-none ml-auto"
        >
          <MessageSquare size={22} />
        </button>
      </div>
    </div>
  );
};

export default Landing;

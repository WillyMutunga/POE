import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  ChevronLeft, 
  ChevronRight, 
  Star, 
  ExternalLink,
  MessageSquare,
  ChevronDown
} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null); // 'courses' or 'services' or null
  const [currentSlide, setCurrentSlide] = useState(0);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  // Counter states for the stats section
  const [stats, setStats] = useState({ courses: 0, bodies: 0, depts: 0 });

  const slides = [
    {
      title: "Welcome To Headway College",
      subtitle: "Where Excellence Meets Opportunity",
      text: "Unlock Your Potential. Build Your Career. Transform Your Future.",
      bg: "https://headwaycollege.ac.ke/uploads/frontend/slider/home-slider-1735224955.jpg",
      primaryBtn: "Enter Portal",
      secondaryBtn: "Apply Online",
      primaryAction: () => navigate(isAuthenticated ? '/dashboard' : '/login'),
      secondaryAction: () => window.open('https://headwaycollege.ac.ke/home/admission', '_blank')
    },
    {
      title: "Why Headway College?",
      subtitle: "Discover the Headway Advantage",
      text: "Industry-Focused Programs, Expert Faculty, Modern Learning Facilities, Flexible Class Schedules.",
      bg: "https://headwaycollege.ac.ke/uploads/frontend/slider/home-slider-1735225032.jpg",
      primaryBtn: "Apply Online Now",
      secondaryBtn: "Learn More",
      primaryAction: () => window.open('https://headwaycollege.ac.ke/home/admission', '_blank'),
      secondaryAction: () => {
        const welcomeSec = document.getElementById('welcome-section');
        if (welcomeSec) welcomeSec.scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

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

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };


  const menuItems = [
    { label: 'Home', href: '#home' },
    { label: 'About Us', href: '#about' },
    { label: 'Facilities', href: '#facilities' },
    { label: 'Exam Bodies', href: '#exam-bodies' }
  ];

  const navItems = [
    { label: 'Home', href: '#home', type: 'link' }
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
    <div className="min-h-screen bg-slate-50 text-[#141313] font-sans antialiased scroll-smooth" id="home">
      {/* Top Announcement Alert Bar */}
      <div className="bg-[#EF1B1B] text-white text-xs md:text-sm font-extrabold py-2.5 px-4 text-center select-none border-b border-red-700 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 tracking-wide uppercase">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>May 2026 Intake is Ongoing! Apply to Headway College of Professional Studies Today!</span>
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md border-b border-slate-100 transition-all h-24">
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
          <nav className="hidden lg:flex items-center gap-x-3 xl:gap-x-5 h-full">
            {navItems.map((item) => {
              if (item.type === 'link') {
                const isActive = item.label === 'Home';
                return (
                  <a 
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`font-bold text-xs xl:text-[13px] transition-colors duration-150 py-2 ${
                      isActive 
                        ? 'text-[#7B849C]' 
                        : 'text-[#1E293B] hover:text-[#0000FE]'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              } else {
                return (
                  <div key={item.label} className="relative group flex items-center h-full">
                    <button className="flex items-center gap-0.5 text-[#1E293B] hover:text-[#0000FE] font-bold text-xs xl:text-[13px] transition-colors duration-150 py-2 bg-transparent border-none cursor-pointer">
                      <span>{item.label}</span>
                      <ChevronDown size={12} className="text-slate-400 group-hover:text-[#0000FE] transition-colors mt-0.5" />
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-72 bg-white shadow-xl border border-slate-100 rounded-b-2xl py-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-50">
                      {item.items.map((subItem) => {
                        if (subItem.href) {
                          return (
                            <a 
                              key={subItem.label}
                              href={subItem.href}
                              target={subItem.href.startsWith('http') ? "_blank" : undefined}
                              rel={subItem.href.startsWith('http') ? "noreferrer" : undefined}
                              className="block px-6 py-2.5 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#0000FE] hover:bg-slate-50 transition-colors"
                            >
                              {subItem.label}
                            </a>
                          );
                        } else {
                          return (
                            <button
                              key={subItem.label}
                              onClick={subItem.action}
                              className="w-full text-left block px-6 py-2.5 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#0000FE] hover:bg-slate-50 transition-colors bg-transparent border-none cursor-pointer"
                            >
                              {subItem.label}
                            </button>
                          );
                        }
                      })}
                    </div>
                  </div>
                );
              }
            })}
            
            {/* Login CTA */}
            <button
              onClick={() => navigate('/login')}
              className="ml-2 px-5 py-2.5 bg-[#0000FE] hover:bg-[#EF1B1B] text-white font-extrabold text-xs xl:text-sm rounded-xl transition-all shadow-md hover:shadow-blue-500/10 active:scale-95 cursor-pointer border-none"
            >
              Login
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-600 hover:text-[#0000FE] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3 shadow-inner">
            {navItems.map((item) => {
              if (item.type === 'link') {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="block py-2 text-base font-bold text-slate-600 hover:text-[#0000FE] rounded-lg px-3 hover:bg-slate-50 transition-colors"
                  >
                    {item.label}
                  </a>
                );
              } else {
                const isOpen = mobileDropdownOpen === item.dropdownType;
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => setMobileDropdownOpen(isOpen ? null : item.dropdownType)}
                      className="w-full flex items-center justify-between py-2 text-base font-bold text-slate-600 hover:text-[#0000FE] rounded-lg px-3 hover:bg-slate-50 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="pl-6 border-l border-slate-100 py-1 space-y-1">
                        {item.items.map((subItem) => {
                          if (subItem.href) {
                            return (
                              <a
                                key={subItem.label}
                                href={subItem.href}
                                target="_blank"
                                rel="noreferrer"
                                className="block py-2 text-sm font-bold text-slate-500 hover:text-[#0000FE] transition-colors"
                              >
                                {subItem.label}
                              </a>
                            );
                          } else {
                            return (
                              <button
                                key={subItem.label}
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  subItem.action();
                                }}
                                className="w-full text-left block py-2 text-sm font-bold text-slate-500 hover:text-[#0000FE] transition-colors bg-transparent border-none cursor-pointer"
                              >
                                {subItem.label}
                              </button>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>
                );
              }
            })}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-3 bg-[#0000FE] text-white font-bold rounded-xl text-center shadow-md active:scale-98 cursor-pointer border-none"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </header>


      {/* Hero Carousel Section */}
      <section className="relative h-[480px] md:h-[600px] overflow-hidden bg-slate-900 select-none">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background image with overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 scale-105"
              style={{ 
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.65)), url(${slide.bg})` 
              }}
            />
            
            {/* Slide Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center md:text-left">
                <div className="max-w-3xl space-y-6">
                  <span className="inline-block px-4 py-1.5 bg-[#EF1B1B] text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg">
                    Admissions Open
                  </span>
                  <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
                    {slide.title}
                  </h1>
                  <h2 className="text-xl md:text-2xl font-bold text-[#0000FE] tracking-wide">
                    {slide.subtitle}
                  </h2>
                  <p className="text-slate-300 text-sm md:text-lg leading-relaxed font-medium">
                    {slide.text}
                  </p>
                  
                  {/* Hero Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
                    <button
                      onClick={slide.primaryAction}
                      className="w-full sm:w-auto px-8 py-4 bg-[#0000FE] hover:bg-[#EF1B1B] text-white text-base font-black rounded-2xl shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {slide.primaryBtn} <ArrowRight size={18} />
                    </button>
                    <button
                      onClick={slide.secondaryAction}
                      className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-base font-bold rounded-2xl border border-white/20 hover:border-white/40 transition-all backdrop-blur-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {slide.secondaryBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Prev/Next Buttons */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white transition-all backdrop-blur-xs hover:scale-105 cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white transition-all backdrop-blur-xs hover:scale-105 cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlide 
                  ? 'bg-[#0000FE] w-8' 
                  : 'bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="about">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" id="welcome-section">
          {/* Welcome Text */}
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">About Headway</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Welcome Message
              </h2>
              <h3 className="text-lg font-bold text-[#0000FE]">
                Dear Students, Parents, and Stakeholders,
              </h3>
              <div className="w-16 h-1 bg-[#EF1B1B] rounded-full" />
            </div>
            
            <div className="text-slate-600 space-y-4 leading-relaxed font-medium text-sm md:text-base text-justify">
              <p>
                Welcome to Headway College of Professional Studies, where excellence in education meets innovation and opportunity. 
                At Headway College, we are committed to nurturing talent, fostering creativity, and equipping our students with the skills and knowledge needed to excel in today’s dynamic world. Our programs are tailored to meet industry demands, ensuring that every learner is prepared to face the challenges and opportunities of the professional landscape.
              </p>
              <p>
                Education is not just about acquiring knowledge but also about building character, confidence, and a sense of purpose. At our institution, we strive to create a supportive and inspiring learning environment where students can discover their potential and pursue their dreams.
              </p>
              <p>
                I invite you to join our community of learners, educators, and professionals dedicated to lifelong learning and success. Together, let us embark on a journey of transformation and achievement.
              </p>
              <p className="font-extrabold text-slate-800 italic">
                Once again, welcome to Headway College—where your future begins.
              </p>
            </div>
          </div>

          {/* Welcome Image/Card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#0000FE]/20 to-[#EF1B1B]/20 rounded-3xl blur-2xl opacity-70" />
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 group">
              <img 
                src="https://headwaycollege.ac.ke/uploads/frontend/home_page/wellcome1.jpeg" 
                alt="Headway College campus environment" 
                className="w-full h-[400px] object-cover group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 text-white">
                <p className="text-lg font-black tracking-tight">Embakasi Campus, Nairobi</p>
                <p className="text-xs text-slate-300 font-semibold mt-1">Airport View Plaza, Eastern Bypass</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities/Notification Section */}
      <section className="py-20 bg-slate-100 border-y border-slate-200" id="facilities">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">Facilities & Support</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Why Learn With Us?
            </h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              Providing modern facilities and holistic assistance to support students academically and logistically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Online Classes */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#EF1B1B] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#0000FE]/5 group-hover:bg-[#0000FE]/10 flex items-center justify-center text-[#0000FE] mb-6 transition-colors">
                <Laptop size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">Online Classes</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                Our online classes are designed to provide the same high-quality education as our on-campus programs, allowing you to learn at your own pace from the comfort of your home.
              </p>
            </div>

            {/* Scholarships */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#EF1B1B] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#0000FE]/5 group-hover:bg-[#0000FE]/10 flex items-center justify-center text-[#0000FE] mb-6 transition-colors">
                <GraduationCap size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">Scholarships</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                We believe in making education accessible to everyone. Our scholarship programs are designed to support deserving students who may need financial assistance for their studies.
              </p>
            </div>

            {/* Books & Library */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#EF1B1B] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#0000FE]/5 group-hover:bg-[#0000FE]/10 flex items-center justify-center text-[#0000FE] mb-6 transition-colors">
                <Library size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">Books & Library</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                Our well-equipped library and vast collection of books, journals, and digital resources ensure that you have everything you need for a rich and successful academic journey.
              </p>
            </div>

            {/* Hostels */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#EF1B1B] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#0000FE]/5 group-hover:bg-[#0000FE]/10 flex items-center justify-center text-[#0000FE] mb-6 transition-colors">
                <Home size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">Hostels</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                Our hostels offer a safe, affordable, and convenient environment for students who need accommodation while studying at the college with fully furnished and spacious rooms.
              </p>
            </div>
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
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Let The Numbers Speak
            </h2>
            <p className="text-blue-100 font-semibold max-w-xl mx-auto text-sm">
              Headway College continues to excel in professional studies across multiple disciplines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Courses Stats */}
            <div className="bg-slate-900/30 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-lg space-y-4">
              <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Courses Offered</p>
              <p className="text-5xl font-black text-white tracking-tight">
                {stats.courses}+
              </p>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#EF1B1B] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(stats.courses / 96) * 100}%` }}
                />
              </div>
            </div>

            {/* Exam Bodies Stats */}
            <div className="bg-slate-900/30 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-lg space-y-4">
              <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Accredited Exam Bodies</p>
              <p className="text-5xl font-black text-white tracking-tight">
                {stats.bodies}+
              </p>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#EF1B1B] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(stats.bodies / 8) * 100}%` }}
                />
              </div>
            </div>

            {/* Departments Stats */}
            <div className="bg-slate-900/30 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-lg space-y-4">
              <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Departments</p>
              <p className="text-5xl font-black text-white tracking-tight">
                {stats.depts}+
              </p>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#EF1B1B] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(stats.depts / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Bodies Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12" id="exam-bodies">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-[#EF1B1B]">Accreditations</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Our Certified Examination Bodies
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">
            We partner with leading local and global certification and regulatory boards to ensure valid, accredited credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              abbr: "CDACC",
              name: "Curriculum Development Assessment and Certification Council",
              desc: "Assesses learners through a competency-based assessment framework and issues certifications recognized by employers and industries."
            },
            {
              abbr: "KASNEB",
              name: "Kenya Accountants and Secretaries National Examinations Board",
              desc: "Offers professional certifications such as CPA, ATD, and other accounting, finance, and information technology qualifications."
            },
            {
              abbr: "NITA",
              name: "National Industrial Training Authority",
              desc: "Certifies technical and vocational training programs, including hairdressing, beauty therapy, fashion design, and other skilled trades."
            },
            {
              abbr: "ICDL",
              name: "International Computer Driving License",
              desc: "Offers globally recognized certification in computer proficiency, digital literacy, and essential work computing skills."
            },
            {
              abbr: "ICM",
              name: "Institute of Commercial Management",
              desc: "Provides internationally recognized qualifications in hospitality, business studies, engineering, media, and vocational training."
            },
            {
              abbr: "TVETA",
              name: "Technical and Vocational Education and Training Authority",
              desc: "Regulates and accredits technical and vocational institutions and programs to ensure quality standard compliance."
            }
          ].map((body) => (
            <div key={body.abbr} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 bg-[#0000FE]/10 text-[#0000FE] text-xs font-black rounded-lg">
                  {body.abbr}
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{body.name}</h3>
                <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">{body.desc}</p>
              </div>
            </div>
          ))}
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
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Experienced Teaching Team
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium text-justify md:text-center">
            At Headway College of Professional Studies, we take pride in our team of dedicated and highly skilled educators who bring a wealth of knowledge and expertise to every class. Our faculty members hold advanced degrees and certifications in their respective fields, ensuring top-notch education for our students. With years of experience in both academia and industry, our teachers blend theory with practical insights, making learning relevant and engaging. They employ modern teaching methods, including interactive learning, case studies, and hands-on training, to make concepts come alive.
          </p>
        </div>
      </section>



      {/* CTA Application Banner */}
      <section className="bg-[#EF1B1B] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-black">Call/Make an Online Course Application</h3>
            <p className="text-red-100 font-medium text-sm flex items-center justify-center lg:justify-start gap-2">
              <Phone size={18} /> Connect with Admissions directly at +254 742 425343
            </p>
          </div>
          <button 
            onClick={() => window.open('https://headwaycollege.ac.ke/home/admission', '_blank')}
            className="px-8 py-4 bg-white hover:bg-slate-900 text-[#EF1B1B] hover:text-white font-black text-base rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
          >
            Join Us Now <ExternalLink size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0000FE] text-white pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0000FE] font-black text-xl shadow-lg">
                H
              </div>
              <span className="text-lg font-black text-white tracking-tight">HEADWAY COLLEGE</span>
            </div>
            <p className="text-blue-100 text-xs md:text-sm leading-relaxed font-medium text-justify">
              Headway is a premier professional College located at Embakasi South Constituency at Airport View Plaza, Eastern Bypass Opposite Even Business Park (Kobil) Cabanas.
            </p>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h4 className="text-lg font-black tracking-tight border-b border-white/20 pb-2">Address & Contacts</h4>
            <ul className="space-y-3 text-blue-100 text-xs md:text-sm font-medium">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-white shrink-0 mt-0.5" />
                <span>PO BOX 27147-00100 Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-white shrink-0" />
                <span>+254 742 425343</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-white shrink-0" />
                <a href="mailto:info@headwaycollege.ac.ke" className="hover:underline">info@headwaycollege.ac.ke</a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-black tracking-tight border-b border-white/20 pb-2">Quick Navigation</h4>
            <ul className="grid grid-cols-2 gap-2 text-blue-100 text-xs md:text-sm font-medium">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <a 
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="hover:text-white hover:underline flex items-center gap-1"
                  >
                    <ArrowRight size={12} /> {item.label}
                  </a>
                </li>
              ))}
              <li>
                <button 
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                  className="hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight size={12} /> Student Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="bg-slate-900/25 border-t border-white/10 py-6 text-center text-xs text-blue-200">
          <div className="max-w-7xl mx-auto px-4">
            Copyright © {new Date().getFullYear()} Headway College of Professional Studies - Powered by Jisoft Systems
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp chat widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {whatsappOpen && (
          <div className="mb-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-emerald-600 p-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">G</div>
              <div>
                <h4 className="text-sm font-black">Gloriah - Receptionist</h4>
                <p className="text-[10px] text-emerald-100 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" /> Online & Available
                </p>
              </div>
            </div>
            <div className="p-4 space-y-3 bg-slate-50">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Welcome to Headway College of Professional Studies. Click below to start chatting with our customer care representative.
              </p>
              <a 
                href="https://wa.me/254742425343" 
                target="_blank" 
                rel="noreferrer"
                className="block w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center rounded-xl text-xs shadow-md transition-colors"
              >
                Send WhatsApp Message
              </a>
            </div>
          </div>
        )}
        <button
          onClick={() => setWhatsappOpen(!whatsappOpen)}
          className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
        >
          {whatsappOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      </div>
    </div>
  );
};

export default Landing;

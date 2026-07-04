import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Bell, 
  Settings, 
  LogOut,
  UserCheck,
  Shield,
  Users,
  User,
  TrendingUp,
  ClipboardList,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Download,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const [academicsOpen, setAcademicsOpen] = useState(false);
  const [courseMgmtOpen, setCourseMgmtOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);

  const studentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/units', icon: BookOpen, label: 'My Units' },
    { to: '/portfolios', icon: FileText, label: 'My Portfolios' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const instructorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/evaluation', icon: UserCheck, label: 'Evaluations' },
    { to: '/units-assigned', icon: BookOpen, label: 'My Units' },
    { to: '/instructor/gradebook', icon: ClipboardList, label: 'Gradebook' },
    { to: '/instructor/exams', icon: FileText, label: 'Exam Repository' },
    { to: '/instructor/students', icon: Users, label: 'Students' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/analytics', icon: TrendingUp, label: 'Cohort Analytics' },
    { to: '/admin/users', icon: Shield, label: 'User Management' },
    { to: '/admin/users?role=STUDENT', icon: Users, label: 'Students' },
    { to: '/admin/users?role=INSTRUCTOR', icon: UserCheck, label: 'Instructors' },
    { to: '/admin/academic', icon: BookOpen, label: 'Schools & Courses' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const cdaccLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/cdacc/students', icon: Users, label: 'Students' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const links = ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user.role) ? adminLinks : 
                user.role === 'STUDENT' ? studentLinks : 
                user.role === 'CDACC' ? cdaccLinks : instructorLinks;

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
      isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
    }`}>
      <div className="p-6 lg:p-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#0000FE] tracking-tight">PoE</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Management System</p>
        </div>
        <button
          onClick={closeSidebar}
          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden active:scale-95 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <nav 
        className="flex-1 px-4 space-y-2 overflow-y-auto" 
        onClick={(e) => {
          if (e.target.closest('a')) {
            closeSidebar();
          }
        }}
      >
        {user.role === 'STUDENT' ? (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0000FE]'
                }`
              }
            >
              <LayoutDashboard size={22} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/units"
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0000FE]'
                }`
              }
            >
              <BookOpen size={22} />
              <span>My Units</span>
            </NavLink>

            <NavLink
              to="/portfolios"
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0000FE]'
                }`
              }
            >
              <FileText size={22} />
              <span>My Portfolios</span>
            </NavLink>

            {/* Collapsible Academics Section */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setAcademicsOpen(!academicsOpen)}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-[#0000FE] transition-all"
              >
                <div className="flex items-center gap-4">
                  <GraduationCap size={22} />
                  <span>Academics</span>
                </div>
                {academicsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {academicsOpen && (
                <div className="pl-6 space-y-1 transition-all duration-300">
                  <NavLink
                    to="/student/registration"
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                        ? 'bg-blue-50 text-[#0000FE]' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#0000FE]'
                      }`
                    }
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-current"></div>
                    <span>Register Units</span>
                  </NavLink>
                  <NavLink
                    to="/student/results"
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                        ? 'bg-blue-50 text-[#0000FE]' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#0000FE]'
                      }`
                    }
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-current"></div>
                    <span>Provisional Results</span>
                  </NavLink>
                  <NavLink
                    to="/student/downloads"
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                        ? 'bg-blue-50 text-[#0000FE]' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#0000FE]'
                      }`
                    }
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-current"></div>
                    <span>Exam Downloads</span>
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink
              to="/profile"
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0000FE]'
                }`
              }
            >
              <User size={22} />
              <span>Profile</span>
            </NavLink>
          </>
        ) : ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user.role) ? (
          <>
            {/* PoE Management */}
            <NavLink
              to="/dashboard"
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0000FE]'
                }`
              }
            >
              <LayoutDashboard size={22} />
              <span>PoE Management</span>
            </NavLink>

            {/* Trainees (Expandable) */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setAcademicsOpen(!academicsOpen)}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-[#0000FE] transition-all"
              >
                <div className="flex items-center gap-4">
                  <Users size={22} />
                  <span>All Students</span>
                </div>
                {academicsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {academicsOpen && (
                <div className="pl-6 space-y-1 transition-all duration-300">
                  <NavLink
                    to="/admin/users?role=STUDENT"
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                        ? 'bg-blue-50 text-[#0000FE]' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#0000FE]'
                      }`
                    }
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-current"></div>
                    <span>Students</span>
                  </NavLink>
                  <NavLink
                    to="/admin/users?role=INSTRUCTOR"
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                        ? 'bg-blue-50 text-[#0000FE]' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#0000FE]'
                      }`
                    }
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-current"></div>
                    <span>Instructors</span>
                  </NavLink>
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                        ? 'bg-blue-50 text-[#0000FE]' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#0000FE]'
                      }`
                    }
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-current"></div>
                    <span>All Users</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* Units of Competence */}
            <NavLink
              to="/admin/academic"
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0000FE]'
                }`
              }
            >
              <BookOpen size={22} />
              <span>Units of Competence</span>
            </NavLink>

            {/* Curriculums */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setCourseMgmtOpen(!courseMgmtOpen)}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-[#0000FE] transition-all"
              >
                <div className="flex items-center gap-4">
                  <ClipboardList size={22} />
                  <span>Curriculums</span>
                </div>
                {courseMgmtOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {courseMgmtOpen && (
                <div className="pl-6 space-y-1 transition-all duration-300">
                  <NavLink
                    to="/admin/grading"
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                        ? 'bg-blue-50 text-[#0000FE]' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#0000FE]'
                      }`
                    }
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-current"></div>
                    <span>Grading Criteria</span>
                  </NavLink>
                  <NavLink
                    to="/admin/components"
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                        ? 'bg-blue-50 text-[#0000FE]' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#0000FE]'
                      }`
                    }
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-current"></div>
                    <span>Mark Components</span>
                  </NavLink>
                  <NavLink
                    to="/admin/exams"
                    className={({ isActive }) => 
                      `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                        ? 'bg-blue-50 text-[#0000FE]' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#0000FE]'
                      }`
                    }
                  >
                    <div className="w-2 h-2 rounded-full border-2 border-current"></div>
                    <span>Audit Exams</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* Reports */}
            <NavLink
              to="/admin/analytics"
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0000FE]'
                }`
              }
            >
              <TrendingUp size={22} />
              <span>Reports</span>
            </NavLink>

            {/* Subscription plans */}
            <NavLink
              to="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Subscription plans feature is under development.');
              }}
              className="flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-[#0000FE] transition-all"
            >
              <Bell size={22} />
              <span>Subscription plans</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0000FE]'
                }`
              }
            >
              <User size={22} />
              <span>Profile</span>
            </NavLink>
          </>
        ) : (
          links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#0000FE] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0000FE]'
                }`
              }
            >
              <link.icon size={22} />
              <span>{link.label}</span>
            </NavLink>
          ))
        )}
      </nav>

      <div className="p-6 border-t border-slate-50">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <LogOut size={18} />
          Logout System
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

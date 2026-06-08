import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import CreatePortfolio from './pages/student/CreatePortfolio';
import PortfolioDetail from './pages/student/PortfolioDetail';
import MyPortfolios from './pages/student/MyPortfolios';
import StudentRegistration from './pages/student/StudentRegistration';
import UserManagement from './pages/admin/UserManagement';
import AcademicStructure from './pages/admin/AcademicStructure';
import AdminDashboard from './pages/admin/AdminDashboard';
import CohortAnalytics from './pages/admin/CohortAnalytics';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import MyUnits from './pages/instructor/MyUnits';
import UnitPortfolios from './pages/instructor/UnitPortfolios';
import EvaluationPage from './pages/instructor/EvaluationPage';
import InstructorStudents from './pages/instructor/InstructorStudents';
import CDACCDashboard from './pages/cdacc/CDACCDashboard';
import CDACCPortfolioList from './pages/cdacc/CDACCPortfolioList';
import CDACCStudentList from './pages/cdacc/CDACCStudentList';
import CDACCStudentPortfolios from './pages/cdacc/CDACCStudentPortfolios';
import CDACCStudentsView from './pages/cdacc/CDACCStudentsView';
import CDACCStudentGlobalPortfolios from './pages/cdacc/CDACCStudentGlobalPortfolios';
import AdminPortfolioList from './pages/admin/AdminPortfolioList';
import SearchResults from './pages/SearchResults';
import Profile from './pages/student/Profile';
import ChangePassword from './pages/ChangePassword';
import SetupProfile from './pages/SetupProfile';
import Notifications from './pages/Notifications';
import NotificationDetail from './pages/NotificationDetail';
import Landing from './pages/Landing';
import ProvisionalResults from './pages/student/ProvisionalResults';
import StudentDownloads from './pages/student/StudentDownloads';
import Gradebook from './pages/instructor/Gradebook';
import ExamRepository from './pages/instructor/ExamRepository';
import GradingCriteria from './pages/admin/GradingCriteria';
import MarkComponents from './pages/admin/MarkComponents';
import AdminExams from './pages/admin/AdminExams';


// Placeholder components
const Dashboard = () => (
  <div className="space-y-6">
    <div className="flex flex-col">
      <h1 className="text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
      <p className="text-slate-500 font-medium">Welcome back to your POE Management dashboard.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Units</p>
        <p className="text-4xl font-black text-[#0000FE]">4</p>
      </div>
      <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Submissions</p>
        <p className="text-4xl font-black text-[#0000FE]">12</p>
      </div>
      <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Pending Grade</p>
        <p className="text-4xl font-black text-red-500">3</p>
      </div>
    </div>
  </div>
);

const Unauthorized = () => <div className="p-8"><h1>Unauthorized</h1><p>You do not have permission to access this page.</p></div>;



function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AuthContext.Consumer>
                    {({ user }) => (
                      user.role === 'STUDENT' ? <StudentDashboard /> : 
                      user.role === 'CDACC' ? <CDACCDashboard /> :
                      ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user.role) ? <AdminDashboard /> :
                      <InstructorDashboard />
                    )}
                  </AuthContext.Consumer>
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/evaluation" 
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR', 'MANAGER', 'DIRECTOR', 'CDACC', 'ADMIN']}>
                <DashboardLayout>
                  <InstructorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/evaluation/:id" 
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR', 'MANAGER', 'DIRECTOR', 'CDACC', 'ADMIN']}>
                <DashboardLayout>
                  <EvaluationPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/units" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/student/registration" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                  <StudentRegistration />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/student/results" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                  <ProvisionalResults />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/student/downloads" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                  <StudentDownloads />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />


          <Route 
            path="/portfolios/new" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                  <CreatePortfolio />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/portfolios/:id" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'MANAGER', 'DIRECTOR', 'CDACC', 'ADMIN']}>
                <DashboardLayout>
                  <PortfolioDetail />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/portfolios" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                  <MyPortfolios />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/search" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SearchResults />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/portfolios" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DIRECTOR']}>
                <DashboardLayout>
                  <AdminPortfolioList />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <UserManagement />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/academic" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <AcademicStructure />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/grading" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DIRECTOR']}>
                <DashboardLayout>
                  <GradingCriteria />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/components" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DIRECTOR']}>
                <DashboardLayout>
                  <MarkComponents />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/exams" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DIRECTOR', 'CDACC']}>
                <DashboardLayout>
                  <AdminExams />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/analytics" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DIRECTOR']}>
                <DashboardLayout>
                  <CohortAnalytics />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/units-assigned" 
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                <DashboardLayout>
                  <MyUnits />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/instructor/gradebook" 
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                <DashboardLayout>
                  <Gradebook />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/instructor/exams" 
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                <DashboardLayout>
                  <ExamRepository />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/units/:unitId/portfolios" 
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                <DashboardLayout>
                  <UnitPortfolios />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/instructor/students" 
            element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                <DashboardLayout>
                  <InstructorStudents />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/cdacc/units/:unitId/portfolios" 
            element={
              <ProtectedRoute allowedRoles={['CDACC', 'ADMIN']}>
                <DashboardLayout>
                  <CDACCPortfolioList />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cdacc/units/:unitId/students" 
            element={
              <ProtectedRoute allowedRoles={['CDACC', 'ADMIN']}>
                <DashboardLayout>
                  <CDACCStudentList />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cdacc/students" 
            element={
              <ProtectedRoute allowedRoles={['CDACC', 'ADMIN']}>
                <DashboardLayout>
                  <CDACCStudentsView />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cdacc/students/:studentId/portfolios" 
            element={
              <ProtectedRoute allowedRoles={['CDACC', 'ADMIN']}>
                <DashboardLayout>
                  <CDACCStudentGlobalPortfolios />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cdacc/units/:unitId/students/:studentId/portfolios" 
            element={
              <ProtectedRoute allowedRoles={['CDACC', 'ADMIN']}>
                <DashboardLayout>
                  <CDACCStudentGlobalPortfolios />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route path="/profile" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/change-password" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ChangePassword />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/setup-profile" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SetupProfile />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Notifications />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/notifications/:id" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NotificationDetail />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route path="/" element={<Landing />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

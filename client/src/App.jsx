import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { DashboardLayout } from './components/layout';

// Student pages
import StudentOverview from './pages/student/StudentOverview';
import StudentSkills from './pages/student/StudentSkills';
import StudentOpportunities from './pages/student/StudentOpportunities';
import StudentApplications from './pages/student/StudentApplications';
import StudentSkillGap from './pages/student/StudentSkillGap';
import StudentLearning from './pages/student/StudentLearning';
import StudentProjects from './pages/student/StudentProjects';
import StudentSettings from './pages/student/StudentSettings';

// Company pages
import CompanyOverview from './pages/company/CompanyOverview';
import CompanyOpportunities from './pages/company/CompanyOpportunities';
import CompanyApplicants from './pages/company/CompanyApplicants';
import CompanyProfile from './pages/company/CompanyProfile';
import CompanySettings from './pages/company/CompanySettings';

// Institution pages
import InstitutionOverview from './pages/institution/InstitutionOverview';
import InstitutionAnalytics from './pages/institution/InstitutionAnalytics';
import InstitutionStudents from './pages/institution/InstitutionStudents';
import InstitutionSkills from './pages/institution/InstitutionSkills';
import InstitutionSettings from './pages/institution/InstitutionSettings';

// ─── Landing Page (public) ───────────────────────────────────────
function LandingPage() {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-indigo-400 mb-3">
          SkillConnect
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Academia–Industry Collaboration & Skill Mapping Platform
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200"
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-xl border border-gray-700 transition-all duration-200"
        >
          Create Account
        </Link>
      </div>
    </main>
  );
}

// ─── Role-based route guards ─────────────────────────────────────
function StudentRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'student') return <Navigate to="/dashboard" replace />;
  
  return children;
}

function CompanyRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'company') return <Navigate to="/dashboard" replace />;
  
  return children;
}

function InstitutionRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'institution' && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  
  return children;
}

// ─── App Root ────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes - general dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/*"
            element={
              <StudentRoute>
                <DashboardLayout />
              </StudentRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<StudentOverview />} />
            <Route path="skills" element={<StudentSkills />} />
            <Route path="opportunities" element={<StudentOpportunities />} />
            <Route path="opportunities/:id" element={<StudentOpportunities />} />
            <Route path="applications" element={<StudentApplications />} />
            <Route path="skill-gap" element={<StudentSkillGap />} />
            <Route path="learning" element={<StudentLearning />} />
            <Route path="projects" element={<StudentProjects />} />
            <Route path="settings" element={<StudentSettings />} />
          </Route>

          {/* Company routes */}
          <Route
            path="/company/*"
            element={
              <CompanyRoute>
                <DashboardLayout />
              </CompanyRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<CompanyOverview />} />
            <Route path="opportunities" element={<CompanyOpportunities />} />
            <Route path="opportunities/:id" element={<CompanyOpportunities />} />
            <Route path="applicants" element={<CompanyApplicants />} />
            <Route path="profile" element={<CompanyProfile />} />
            <Route path="settings" element={<CompanySettings />} />
          </Route>

          {/* Institution routes */}
          <Route
            path="/institution/*"
            element={
              <InstitutionRoute>
                <DashboardLayout />
              </InstitutionRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<InstitutionOverview />} />
            <Route path="analytics" element={<InstitutionAnalytics />} />
            <Route path="students" element={<InstitutionStudents />} />
            <Route path="skills" element={<InstitutionSkills />} />
            <Route path="settings" element={<InstitutionSettings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
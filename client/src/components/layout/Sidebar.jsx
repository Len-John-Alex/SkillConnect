import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const STUDENT_NAV = [
  { path: '/student/overview', label: 'Overview', icon: '📊' },
  { path: '/student/skills', label: 'Skill Passport', icon: '🎯' },
  { path: '/student/opportunities', label: 'Opportunities', icon: '💼' },
  { path: '/student/applications', label: 'Applications', icon: '📋' },
  { path: '/student/skill-gap', label: 'Skill Gap Analysis', icon: '🔍' },
  { path: '/student/learning', label: 'Learning Roadmap', icon: '📚' },
  { path: '/student/projects', label: 'Projects', icon: '🚀' },
  { path: '/student/settings', label: 'Settings', icon: '⚙️' },
];

const COMPANY_NAV = [
  { path: '/company/overview', label: 'Overview', icon: '📊' },
  { path: '/company/opportunities', label: 'My Opportunities', icon: '💼' },
  { path: '/company/applicants', label: 'Applicants', icon: '👥' },
  { path: '/company/profile', label: 'Company Profile', icon: '🏢' },
  { path: '/company/settings', label: 'Settings', icon: '⚙️' },
];

const INSTITUTION_NAV = [
  { path: '/institution/overview', label: 'Overview', icon: '📊' },
  { path: '/institution/analytics', label: 'Analytics', icon: '📈' },
  { path: '/institution/students', label: 'Students', icon: '🎓' },
  { path: '/institution/skills', label: 'Skills Catalog', icon: '🎯' },
  { path: '/institution/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const navItems = user?.role === 'student' ? STUDENT_NAV :
                   user?.role === 'company' ? COMPANY_NAV :
                   (user?.role === 'institution' || user?.role === 'admin') ? INSTITUTION_NAV : [];
  
  const roleConfig = {
    student: { color: 'emerald', icon: '🎓', name: 'Student' },
    company: { color: 'blue', icon: '🏢', name: 'Company' },
    institution: { color: 'purple', icon: '🏛️', name: 'Institution' },
    admin: { color: 'amber', icon: '⚙️', name: 'Admin' },
  };
  
  const config = roleConfig[user?.role] || roleConfig.student;
  
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <span className="text-2xl">{config.icon}</span>
        <span className="text-xl font-bold text-indigo-400">SkillConnect</span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-indigo-500/10 text-indigo-300' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }
            `}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      {/* User info & logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <span className="text-lg">{config.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-red-400 hover:bg-gray-800/50 rounded-xl transition-all duration-200 text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
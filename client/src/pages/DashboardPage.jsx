import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_REDIRECTS = {
  student: '/student/overview',
  company: '/company/overview',
  institution: '/institution/overview',
  admin: '/institution/overview',
};

const ROLE_CONFIG = {
  student: {
    title: 'Student Dashboard',
    subtitle: 'Track skills, find opportunities, and grow your career',
    color: 'emerald',
    icon: '🎓',
  },
  company: {
    title: 'Company Dashboard',
    subtitle: 'Post opportunities and discover talented candidates',
    color: 'blue',
    icon: '🏢',
  },
  institution: {
    title: 'Institution Dashboard',
    subtitle: 'Manage programs, monitor student progress, and connect with industry',
    color: 'purple',
    icon: '🏛️',
  },
  admin: {
    title: 'Admin Dashboard',
    subtitle: 'Platform administration and oversight',
    color: 'amber',
    icon: '⚙️',
  },
};

const COLOR_MAP = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
  },
};

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role && ROLE_REDIRECTS[user.role]) {
    return <Navigate to={ROLE_REDIRECTS[user.role]} replace />;
  }

  const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student;
  const clr = COLOR_MAP[cfg.color];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-400 tracking-tight">SkillConnect</h1>
          <div className="flex items-center gap-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${clr.badge}`}>
              {user?.role}
            </span>
            <span className="text-sm text-gray-400">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className={`${clr.bg} border ${clr.border} rounded-2xl p-8 mb-8`}>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl">{cfg.icon}</span>
            <div>
              <h2 className={`text-2xl font-bold ${clr.text}`}>{cfg.title}</h2>
              <p className="text-gray-400 mt-1">{cfg.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
            Account Info
          </h3>
          <dl className="space-y-3 text-sm font-mono">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">Name</dt>
              <dd className="text-white">{user?.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">Email</dt>
              <dd className="text-white">{user?.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">Role</dt>
              <dd className="text-white">{user?.role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">Member since</dt>
              <dd className="text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</dd>
            </div>
          </dl>
        </div>

        <p className="text-center text-gray-700 text-xs mt-8">
          Dashboard features coming in the next phase.
        </p>
      </main>
    </div>
  );
}

import { useAuth } from '../../context/AuthContext';

export function TopBar({ title, subtitle, actions, onToggleSidebar }) {
  const { user, logout } = useAuth();
  
  const roleConfig = {
    student: { color: 'emerald', icon: '🎓', name: 'Student' },
    company: { color: 'blue', icon: '🏢', name: 'Company' },
    institution: { color: 'purple', icon: '🏛️', name: 'Institution' },
    admin: { color: 'amber', icon: '⚙️', name: 'Admin' },
  };
  
  const config = roleConfig[user?.role] || roleConfig.student;
  
  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile / tablet screens */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {title && (
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-gray-400">{subtitle}</p>}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {actions}
            
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full 
                ${config.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                 config.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                 config.color === 'purple' ? 'bg-purple-500/20 text-purple-300' :
                 'bg-amber-500/20 text-amber-300'}`}>
                {config.icon} {config.name}
              </span>
              <span className="text-sm text-gray-400 hidden sm:block">{user?.name}</span>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800/50 rounded-xl transition-all duration-200"
                aria-label="Sign out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
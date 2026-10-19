import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function DashboardLayout({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export function SimpleLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
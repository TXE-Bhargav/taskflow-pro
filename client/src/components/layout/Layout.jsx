// Layout.jsx — Mobile-responsive layout with hamburger menu

import { useState } from 'react';
import Sidebar from './Sidebar';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
  });

  return (
    <div className="flex min-h-screen bg-surface-1">
      <Sidebar
        workspaces={Array.isArray(workspaces) ? workspaces : []}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen sm:ml-56">
        {/* Mobile top bar */}
        <div className="sm:hidden flex items-center justify-between h-12 px-4 border-b border-border-1 bg-surface-1 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-ink-3 hover:text-ink-1 hover:bg-surface-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-accent rounded flex items-center justify-center text-surface-0 font-bold text-[10px]">T</div>
            <span className="font-semibold text-ink-1 text-[13px]">TaskFlow Pro</span>
          </div>
          <div className="w-8" /> {/* spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
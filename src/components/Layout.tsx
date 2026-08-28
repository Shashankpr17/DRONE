import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface text-on-surface">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Application Area */}
      <div className="flex flex-col flex-1 w-full md:pl-[280px] h-screen overflow-hidden transition-all duration-200">
        {/* Topbar */}
        <Topbar onToggleMobile={() => setMobileOpen((prev) => !prev)} />

        {/* Scrollable Page Outlet */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-surface-container-lowest/40">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

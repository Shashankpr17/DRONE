import React from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { name: 'Detection & Analysis', path: '/detection-analysis', icon: 'analytics' },
  { name: 'Flood Map', path: '/flood-map', icon: 'map' },
  { name: 'Drone Missions', path: '/drone-missions', icon: 'precision_manufacturing' },
  { name: 'Flood Spread Analysis', path: '/water-coverage', icon: 'water' },
  { name: 'Affected Settlements', path: '/affected-settlements', icon: 'location_city' },
  { name: 'Road Accessibility', path: '/road-accessibility', icon: 'alt_route' },
  { name: 'Infrastructure Impact', path: '/infrastructure-impact', icon: 'domain' },
  { name: 'Assessment Report', path: '/flood-report', icon: 'summarize' },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 md:z-20
          w-[280px] h-screen bg-surface border-r border-outline-variant
          flex flex-col py-lg
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header / Logo */}
        <div className="px-lg pb-lg border-b border-outline-variant mb-md flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Logo className="w-9 h-7 text-primary shrink-0" />
              <h1 className="font-display-lg text-headline-lg font-extrabold text-primary tracking-tight">
                SKY GUARDIANS
              </h1>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-on-surface-variant hover:text-on-surface rounded-lg"
              aria-label="Close sidebar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-md space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) => `
                flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 ease-in-out text-sm font-medium
                ${
                  isActive
                    ? 'bg-primary-fixed text-primary font-bold border-r-4 border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }
              `}
            >
              <span className="material-symbols-outlined shrink-0" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="font-label-md text-body-md truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

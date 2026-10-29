'use client';

import {
  Bus,
  CalendarCheck,
  ExternalLink,
  Globe,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AdminUser } from '../lib/types';

// Four top-level sections; Fleet and Website have sub-tabs, Settings opens from the profile card.
export const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'fleet', label: 'Fleet', icon: Bus },
  { id: 'website', label: 'Website', icon: Globe },
];

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  admin: AdminUser;
  onLogout: () => void;
  pendingBookingsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  admin,
  onLogout,
  pendingBookingsCount,
  isOpen,
  onClose,
}: SidebarProps) {
  const badges: Record<string, number> = { bookings: pendingBookingsCount };
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'http://localhost:3000';

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark">
              <Bus size={22} />
            </span>
            <div>
              <div className="brand-name">GM &amp; Dude</div>
              <div className="brand-sub">Admin Portal</div>
            </div>
          </div>
          <button className="icon-btn sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${currentTab === id ? 'active' : ''}`}
              onClick={() => {
                setCurrentTab(id);
                onClose();
              }}
            >
              <span className="nav-item-label">
                <Icon size={18} />
                {label}
              </span>
              {badges[id] > 0 && <span className="nav-badge">{badges[id]}</span>}
            </button>
          ))}
          <a className="nav-item nav-item-external" href={websiteUrl} target="_blank" rel="noopener noreferrer">
            <span className="nav-item-label">
              <ExternalLink size={18} />
              View website
            </span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <button
            className={`profile ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('settings');
              onClose();
            }}
            title="Account & settings"
          >
            <span className="avatar">{admin.name.charAt(0)}</span>
            <div className="profile-text">
              <div className="profile-name">{admin.name}</div>
              <div className="profile-role">
                <ShieldCheck size={12} /> {admin.role.replace('_', ' ').toLowerCase()}
              </div>
            </div>
            <Settings size={16} className="profile-gear" />
          </button>
          <button className="btn btn-danger btn-block" onClick={onLogout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

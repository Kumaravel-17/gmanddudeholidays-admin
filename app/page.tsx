'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Login from './components/Login';
import Sidebar, { NAV } from './components/Sidebar';
import Bookings from './components/sections/Bookings';
import BusTypes from './components/sections/BusTypes';
import Dashboard from './components/sections/Dashboard';
import Faqs from './components/sections/Faqs';
import Fleet from './components/sections/Fleet';
import Settings from './components/sections/Settings';
import SiteContent from './components/sections/SiteContent';
import { StoreProvider, useStore } from './lib/store';

const SESSION_KEY = 'gmd-admin-session';

// Sub-tabs inside the Fleet and Website sections; the first one opens by default.
const SUB_TABS: Record<string, { id: string; label: string }[]> = {
  fleet: [
    { id: 'buses', label: 'Buses' },
    { id: 'busTypes', label: 'Bus Types' },
  ],
  website: [
    { id: 'content', label: 'Content & Contact' },
    { id: 'faqs', label: 'FAQs' },
  ],
};

const SECTIONS = [...NAV.map((n) => n.id), 'settings'];

// Accepts "section" or "section/sub", e.g. "website/faqs". For bookings, sub is a booking id.
function parseView(view: string) {
  const [tab, sub = ''] = view.split('/');
  if (!SECTIONS.includes(tab)) return null;
  if (tab === 'bookings') return { tab, sub: decodeURIComponent(sub) };
  const subs = SUB_TABS[tab];
  return { tab, sub: subs ? (subs.some((s) => s.id === sub) ? sub : subs[0].id) : '' };
}

export default function Home() {
  return (
    <StoreProvider>
      <Admin />
    </StoreProvider>
  );
}

function Admin() {
  const { data, ready } = useStore();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [view, setView] = useState({ tab: 'dashboard', sub: '' });
  const [menuOpen, setMenuOpen] = useState(false);

  // sessionStorage and the URL hash only exist in the browser, so they're read after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSignedIn(sessionStorage.getItem(SESSION_KEY) === '1');
    // Follow the hash on load and when it changes (pasted links, back/forward).
    const sync = () => {
      const fromHash = parseView(window.location.hash.slice(1));
      if (fromHash) setView(fromHash);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const goTo = (target: string) => {
    const next = parseView(target);
    if (!next) return;
    setView(next);
    window.history.replaceState(null, '', `#${next.sub ? `${next.tab}/${next.sub}` : next.tab}`);
    window.scrollTo({ top: 0 });
  };
  const { tab, sub } = view;

  if (!ready || signedIn === null) return <div className="loading">Loading…</div>;

  if (!signedIn)
    return (
      <Login
        onLogin={() => {
          sessionStorage.setItem(SESSION_KEY, '1');
          setSignedIn(true);
        }}
      />
    );

  const label = NAV.find((n) => n.id === tab)?.label ?? 'Settings';
  const subs = SUB_TABS[tab];

  return (
    <div className="admin-shell">
      <Sidebar
        currentTab={tab}
        setCurrentTab={goTo}
        admin={data.admin}
        onLogout={() => {
          sessionStorage.removeItem(SESSION_KEY);
          setSignedIn(false);
        }}
        pendingBookingsCount={data.bookings.filter((b) => b.status === 'PENDING').length}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="admin-main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="topbar-title">{label}</span>
          <span className="topbar-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </header>

        {subs && (
          <nav className="subtabs" aria-label={`${label} sections`}>
            {subs.map((s) => (
              <button key={s.id} className={sub === s.id ? 'active' : ''} onClick={() => goTo(`${tab}/${s.id}`)}>
                {s.label}
              </button>
            ))}
          </nav>
        )}

        <main className="content animate-fade-in" key={`${tab}/${sub}`}>
          {tab === 'dashboard' && <Dashboard goTo={goTo} />}
          {tab === 'bookings' && <Bookings bookingId={sub} goTo={goTo} />}
          {sub === 'buses' && <Fleet />}
          {sub === 'busTypes' && <BusTypes />}
          {sub === 'content' && <SiteContent />}
          {sub === 'faqs' && <Faqs />}
          {tab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

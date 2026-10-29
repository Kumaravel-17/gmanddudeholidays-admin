'use client';

import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { INITIAL_DATA } from '../../lib/initialData';
import { downloadJson, useStore, websiteExport } from '../../lib/store';
import { AdminData, AdminUser } from '../../lib/types';
import { Card, Field, PageHeader } from '../ui';

export default function Settings() {
  const { data, setData, reset } = useStore();
  const [profile, setProfile] = useState<AdminUser>(data.admin);
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stamp = new Date().toISOString().slice(0, 10);

  const saveProfile = () => {
    setData((d) => ({ ...d, admin: { ...d.admin, name: profile.name, email: profile.email } }));
    setNotice({ tone: 'ok', text: 'Profile saved.' });
  };

  const changePassword = () => {
    if (password.current !== data.admin.password) return setNotice({ tone: 'error', text: 'Current password is wrong.' });
    if (password.next !== password.confirm) return setNotice({ tone: 'error', text: "New passwords don't match." });
    setData((d) => ({ ...d, admin: { ...d.admin, password: password.next } }));
    setPassword({ current: '', next: '', confirm: '' });
    setNotice({ tone: 'ok', text: 'Password changed.' });
  };

  const importBackup = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<AdminData>;
      if (!parsed.buses || !parsed.bookings || !parsed.settings) throw new Error();
      setData((d) => ({ ...d, ...parsed }));
      setNotice({ tone: 'ok', text: 'Backup restored.' });
    } catch {
      setNotice({ tone: 'error', text: "That file isn't an admin backup." });
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and the admin data." />
      {notice && <div className={`alert ${notice.tone === 'ok' ? 'alert-ok' : 'alert-error'}`}>{notice.text}</div>}

      <div className="two-col">
        <Card>
          <div className="card-header">
            <h2>Profile</h2>
          </div>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              saveProfile();
            }}
          >
            <Field label="Name" full>
              <input className="input" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <Field label="Login email" full>
              <input className="input" type="email" required value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </Field>
            <div className="field-full">
              <button className="btn btn-primary">Save profile</button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="card-header">
            <h2>Change password</h2>
          </div>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              changePassword();
            }}
          >
            <Field label="Current password" full>
              <input className="input" type="password" required value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} />
            </Field>
            <Field label="New password">
              <input className="input" type="password" required minLength={6} value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} />
            </Field>
            <Field label="Confirm new password">
              <input className="input" type="password" required value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} />
            </Field>
            <div className="field-full">
              <button className="btn btn-primary">Change password</button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <div className="card-header">
          <div>
            <h2>Data</h2>
            <p className="muted">Admin data is saved in this browser. Back it up regularly, and export it for the website.</p>
          </div>
        </div>
        <div className="data-actions">
          <div className="data-action">
            <div>
              <div className="strong">Export website data</div>
              <div className="muted">Fleet, booked dates per bus, bus types, cities, FAQs, contact details and banner text, in the website&apos;s format.</div>
            </div>
            <button className="btn btn-primary" onClick={() => downloadJson(`website-data-${stamp}.json`, websiteExport(data))}>
              <Download size={16} /> Export
            </button>
          </div>
          <div className="data-action">
            <div>
              <div className="strong">Full backup</div>
              <div className="muted">Everything, including bookings and their activity.</div>
            </div>
            <div className="row-actions">
              <button className="btn btn-ghost" onClick={() => downloadJson(`admin-backup-${stamp}.json`, data)}>
                <Download size={16} /> Download
              </button>
              <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
                <Upload size={16} /> Restore
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importBackup(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          <div className="data-action">
            <div>
              <div className="strong">Reset to defaults</div>
              <div className="muted">Replaces all admin data with the original website data.</div>
            </div>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm('Reset all admin data? Bookings you added will be lost.')) {
                  reset();
                  setProfile(INITIAL_DATA.admin);
                  setNotice({ tone: 'ok', text: 'Data reset to defaults.' });
                }
              }}
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}

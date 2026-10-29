'use client';

import { useState } from 'react';
import { Bus, Lock } from 'lucide-react';
import { useStore } from '../lib/store';

// Local sign-in against the admin account kept with the admin data. It only keeps casual visitors
// out of this browser's copy; real protection needs the backend's /api/auth.
export default function Login({ onLogin }: { onLogin: () => void }) {
  const { data } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="login-page">
      <form
        className="login-card animate-slide-up"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim().toLowerCase() === data.admin.email.toLowerCase() && password === data.admin.password) onLogin();
          else setError('Wrong email or password.');
        }}
      >
        <span className="brand-mark brand-mark-lg">
          <Bus size={28} />
        </span>
        <h1>GM &amp; Dude Holidays</h1>
        <p className="muted">Sign in to the admin portal</p>
        {error && <div className="alert alert-error">{error}</div>}
        <label className="field">
          <span className="field-label">Email</span>
          <input className="input" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn btn-primary btn-block btn-lg">
          <Lock size={16} /> Sign in
        </button>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { useStore } from '../../lib/store';
import { HeroText, SiteSettings } from '../../lib/types';
import { Card, Field, ListEditor, PageHeader } from '../ui';

export default function SiteContent() {
  const { data, setData } = useStore();
  const [s, setS] = useState<SiteSettings>(data.settings);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(s) !== JSON.stringify(data.settings);

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => {
    setSaved(false);
    setS((x) => ({ ...x, [k]: v }));
  };
  const setHero = (k: 'homeHero' | 'contactHero', field: keyof HeroText, v: string) => set(k, { ...s[k], [field]: v });

  const save = () => {
    setData((d) => ({ ...d, settings: s }));
    setSaved(true);
  };

  const hero = (k: 'homeHero' | 'contactHero', title: string) => (
    <Card>
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="form-grid">
        <Field label="Small heading (eyebrow)">
          <input className="input" value={s[k].eyebrow} onChange={(e) => setHero(k, 'eyebrow', e.target.value)} />
        </Field>
        <Field label="Headline">
          <input className="input" value={s[k].title} onChange={(e) => setHero(k, 'title', e.target.value)} />
        </Field>
        <Field label="Highlighted line (orange)">
          <input className="input" value={s[k].highlight} onChange={(e) => setHero(k, 'highlight', e.target.value)} />
        </Field>
        <Field label="Description">
          <input className="input" value={s[k].description} onChange={(e) => setHero(k, 'description', e.target.value)} />
        </Field>
        <div className="hero-preview field-full">
          <span className="hero-eyebrow">{s[k].eyebrow}</span>
          <span className="hero-title">{s[k].title}</span>
          <span className="hero-highlight">{s[k].highlight}</span>
          <span className="muted">{s[k].description}</span>
        </div>
      </div>
    </Card>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <PageHeader
        title="Website Content"
        subtitle="Contact details, banner text, footer and booking rules shown across the website."
        action={
          <button type="submit" className="btn btn-primary" disabled={!dirty}>
            <Save size={16} /> {saved && !dirty ? 'Saved' : 'Save changes'}
          </button>
        }
      />

      <div className="stack">
        <Card>
          <div className="card-header">
            <h2>Business & contact details</h2>
          </div>
          <p className="muted section-note">Shown in the header, footer, FAQ call button and the Contact page.</p>
          <div className="form-grid">
            <Field label="Business name">
              <input className="input" required value={s.businessName} onChange={(e) => set('businessName', e.target.value)} />
            </Field>
            <Field label="Phone number">
              <input className="input" type="tel" required value={s.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="WhatsApp number" hint="Used for the WhatsApp buttons and enquiry form">
              <input className="input" type="tel" required value={s.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" required value={s.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Office address" full>
              <textarea className="input" rows={2} value={s.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Google Maps search" full hint="Address or business name as listed on Google Maps; drives the map on the Contact page.">
              <input className="input" value={s.mapQuery} onChange={(e) => set('mapQuery', e.target.value)} />
            </Field>
            <Field label="Facebook URL">
              <input className="input" type="url" value={s.socials.facebook} onChange={(e) => set('socials', { ...s.socials, facebook: e.target.value })} />
            </Field>
            <Field label="Instagram URL">
              <input className="input" type="url" value={s.socials.instagram} onChange={(e) => set('socials', { ...s.socials, instagram: e.target.value })} />
            </Field>
            <Field label="YouTube URL">
              <input className="input" type="url" value={s.socials.youtube} onChange={(e) => set('socials', { ...s.socials, youtube: e.target.value })} />
            </Field>
          </div>
          {s.mapQuery && (
            <iframe
              title="Map preview"
              className="map-preview"
              src={`https://www.google.com/maps?q=${encodeURIComponent(s.mapQuery)}&output=embed`}
              loading="lazy"
            />
          )}
        </Card>

        {hero('homeHero', 'Home page banner')}
        {hero('contactHero', 'Contact page banner')}

        <Card>
          <div className="card-header">
            <h2>Footer & SEO</h2>
          </div>
          <div className="form-grid">
            <Field label="Footer about text" full>
              <textarea className="input" rows={3} value={s.footerAbout} onChange={(e) => set('footerAbout', e.target.value)} />
            </Field>
            <Field label="Page title (browser tab / Google)" full hint={`${s.seo.title.length}/60 characters`}>
              <input className="input" value={s.seo.title} onChange={(e) => set('seo', { ...s.seo, title: e.target.value })} />
            </Field>
            <Field label="Meta description (Google snippet)" full hint={`${s.seo.description.length}/160 characters`}>
              <textarea className="input" rows={2} value={s.seo.description} onChange={(e) => set('seo', { ...s.seo, description: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="card-header">
            <h2>Booking rules & forms</h2>
          </div>
          <div className="form-grid">
            <Field label="Days customers can book ahead" hint="How far ahead the website date picker goes">
              <input className="input" type="number" min={1} max={365} required value={s.bookingDays} onChange={(e) => set('bookingDays', Number(e.target.value))} />
            </Field>
            <Field label="Advance to confirm (%)">
              <input className="input" type="number" min={0} max={100} required value={s.advancePercent} onChange={(e) => set('advancePercent', Number(e.target.value))} />
            </Field>
            <Field label="Pickup / destination cities" full hint="Suggestions in the booking form">
              <ListEditor values={s.cities} onChange={(v) => set('cities', v.slice().sort())} placeholder="City name" />
            </Field>
            <Field label='Contact form "trip type" options' full>
              <ListEditor values={s.tripTypes} onChange={(v) => set('tripTypes', v)} placeholder="e.g. College Tour" />
            </Field>
          </div>
        </Card>
      </div>
    </form>
  );
}

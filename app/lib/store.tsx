'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { INITIAL_DATA } from './initialData';
import { ActivityKind, AdminData, Booking, BookingActivity } from './types';

// Spread over the defaults so data saved before a new field was added still loads, and bring
// older saves up to date: time slots, routes, the seat timetable and messages are gone, bookings
// gained an end date and an activity log.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(saved: any): AdminData {
  const settings = { ...INITIAL_DATA.settings, ...saved.settings };
  if (!saved.settings?.cities) {
    const routeCities = (saved.routes ?? []).flatMap((r: { from: string; to: string }) => [r.from, r.to]);
    settings.cities = [...new Set<string>([...routeCities, ...(settings.extraCities ?? [])])].sort();
  }
  delete settings.extraCities;
  delete settings.maxSeats;

  const bookings = (saved.bookings ?? INITIAL_DATA.bookings).map((old: Booking & { slotId?: string }) => {
    const b = { ...old, endDate: old.endDate || old.date };
    delete b.slotId;
    b.activity ??= [{ id: `${b.id}-A1`, at: b.createdAt, kind: 'CREATED', text: 'Booking created', by: '—' }];
    return b;
  });

  const data = { ...INITIAL_DATA, ...saved, settings, bookings };
  delete data.routes;
  delete data.departures;
  delete data.daySlots;
  delete data.contacts;
  return data;
}

// There's no admin API for most of this data yet, so it's kept in the browser (localStorage).
// Use Settings → "Export website data" to hand it to the website, or swap these calls for the API.
const STORAGE_KEY = 'gmd-admin-data-v2';

type CollectionKey = {
  [K in keyof AdminData]: AdminData[K] extends { id: string }[] ? K : never;
}[keyof AdminData];

interface Store {
  data: AdminData;
  ready: boolean;
  setData: (updater: (d: AdminData) => AdminData) => void;
  upsert: <K extends CollectionKey>(key: K, item: AdminData[K][number]) => void;
  remove: (key: CollectionKey, id: string) => void;
  reset: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<AdminData>(INITIAL_DATA);
  const [ready, setReady] = useState(false);

  // localStorage only exists in the browser, so it's read after hydration.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setDataState(migrate(JSON.parse(saved)));
    } catch {
      // Corrupt storage: fall back to the defaults.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const setData = useCallback((updater: (d: AdminData) => AdminData) => setDataState(updater), []);

  const upsert = useCallback(<K extends CollectionKey>(key: K, item: AdminData[K][number]) => {
    setDataState((d) => {
      const list = d[key] as { id: string }[];
      const exists = list.some((x) => x.id === item.id);
      return { ...d, [key]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item] };
    });
  }, []);

  const remove = useCallback((key: CollectionKey, id: string) => {
    setDataState((d) => ({ ...d, [key]: (d[key] as { id: string }[]).filter((x) => x.id !== id) }));
  }, []);

  const reset = useCallback(() => setDataState(INITIAL_DATA), []);

  return (
    <StoreContext.Provider value={{ data, ready, setData, upsert, remove, reset }}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const inr = (n: number | undefined) => `₹${new Intl.NumberFormat('en-IN').format(n ?? 0)}`;

export function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// Number of days a booking holds the bus, counting both ends.
export function tripDays(b: Pick<Booking, 'date' | 'endDate'>) {
  const ms = new Date(`${b.endDate || b.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime();
  return Number.isNaN(ms) ? 1 : Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function formatDateRange(b: Pick<Booking, 'date' | 'endDate'>) {
  if (!b.endDate || b.endDate === b.date) return formatDate(b.date);
  return `${formatDate(b.date)} – ${formatDate(b.endDate)}`;
}

// Two bookings clash when they hold the same bus on any of the same days.
export function datesOverlap(a: Pick<Booking, 'date' | 'endDate'>, b: Pick<Booking, 'date' | 'endDate'>) {
  return a.date <= (b.endDate || b.date) && b.date <= (a.endDate || a.date);
}

type ActivityEntry = { kind: ActivityKind; text: string };

// Activity lines describing what an edit changed, so the timeline shows who changed what.
export function describeChanges(prev: Booking, next: Booking, busName: (id: string) => string): ActivityEntry[] {
  const out: ActivityEntry[] = [];
  const low = (s: string) => s.toLowerCase();
  if (prev.status !== next.status) out.push({ kind: 'STATUS', text: `Status changed: ${low(prev.status)} → ${low(next.status)}` });
  if ((prev.advancePaid ?? 0) !== (next.advancePaid ?? 0))
    out.push({ kind: 'PAYMENT', text: `Amount received: ${inr(prev.advancePaid)} → ${inr(next.advancePaid)}` });
  if (prev.paymentStatus !== next.paymentStatus)
    out.push({ kind: 'PAYMENT', text: `Payment status: ${low(prev.paymentStatus)} → ${low(next.paymentStatus)}` });
  if ((prev.totalAmount ?? 0) !== (next.totalAmount ?? 0))
    out.push({ kind: 'PAYMENT', text: `Total amount: ${inr(prev.totalAmount)} → ${inr(next.totalAmount)}` });
  if (prev.date !== next.date || prev.endDate !== next.endDate)
    out.push({ kind: 'TRIP', text: `Travel dates: ${formatDateRange(prev)} → ${formatDateRange(next)}` });
  if (prev.busId !== next.busId) out.push({ kind: 'TRIP', text: `Bus changed: ${busName(prev.busId)} → ${busName(next.busId)}` });
  if (prev.from !== next.from || prev.to !== next.to)
    out.push({ kind: 'TRIP', text: `Trip changed: ${prev.from} → ${prev.to} to ${next.from} → ${next.to}` });
  if (prev.passengers !== next.passengers) out.push({ kind: 'TRIP', text: `Passengers: ${prev.passengers} → ${next.passengers}` });
  if (prev.customerName !== next.customerName || prev.phone !== next.phone || (prev.email ?? '') !== (next.email ?? ''))
    out.push({ kind: 'EDIT', text: 'Customer details updated' });
  if ((prev.notes ?? '') !== (next.notes ?? '')) out.push({ kind: 'EDIT', text: 'Booking notes updated' });
  return out;
}

export function addActivity(b: Booking, entries: ActivityEntry[], by: string): Booking {
  if (entries.length === 0) return b;
  const at = nowLocal();
  const added: BookingActivity[] = entries.map((e) => ({ ...e, id: newId('ACT'), at, by }));
  return { ...b, activity: [...(b.activity ?? []), ...added] };
}

export function digits(phone: string) {
  return phone.replace(/\D/g, '');
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// The public parts of the data, in the shapes the website's lib/booking.ts and lib/contact.ts use.
export function websiteExport(d: AdminData) {
  return {
    contact: {
      PHONE: d.settings.phone,
      WHATSAPP: d.settings.whatsapp,
      EMAIL: d.settings.email,
      ADDRESS: d.settings.address,
      MAP_QUERY: d.settings.mapQuery,
      SOCIALS: d.settings.socials,
    },
    content: {
      businessName: d.settings.businessName,
      footerAbout: d.settings.footerAbout,
      homeHero: d.settings.homeHero,
      contactHero: d.settings.contactHero,
      tripTypes: d.settings.tripTypes,
      seo: d.settings.seo,
    },
    booking: {
      BOOKING_DAYS: d.settings.bookingDays,
      advancePercent: d.settings.advancePercent,
      cities: d.settings.cities,
    },
    busTypes: d.busTypes.map((b) => ({
      name: b.name,
      tagline: b.tagline,
      capacity: b.capacity,
      pricePerKm: b.pricePerKm,
      features: b.features,
      popular: b.popular,
    })),
    fleet: d.buses
      .filter((b) => b.status === 'ACTIVE')
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        images: b.images,
        position: b.imagePosition,
        ...(b.tag ? { tag: b.tag } : {}),
        description: b.description,
        amenities: b.amenities,
        pricePerKm: b.pricePerKm,
        seats: b.seats,
      })),
    // Days each bus is already taken, so the website can grey them out in its date picker.
    bookedDates: Object.fromEntries(
      d.buses.map((bus) => [
        bus.id,
        d.bookings
          .filter((b) => b.busId === bus.id && b.status !== 'CANCELLED')
          .map((b) => ({ from: b.date, to: b.endDate || b.date })),
      ]),
    ),
    faqs: d.faqs.map(({ question, answer }) => ({ question, answer })),
  };
}

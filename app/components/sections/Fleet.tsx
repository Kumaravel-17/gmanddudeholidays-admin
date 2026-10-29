'use client';

import { useState } from 'react';
import { Pencil, Trash2, Users } from 'lucide-react';
import { inr, slugify, useStore } from '../../lib/store';
import { AMENITIES, Bus, BUS_TYPES, BusType } from '../../lib/types';
import { AddButton, Badge, CheckGroup, confirmDelete, Empty, Field, FormModal, ListEditor, PageHeader } from '../ui';

const blank: Bus = {
  id: '',
  name: '',
  type: 'AC Seater',
  pricePerKm: 55,
  tag: '',
  description: '',
  amenities: ['ac'],
  images: [],
  imagePosition: 'object-center',
  status: 'ACTIVE',
  seats: 40,
  registrationNumber: '',
  driverName: '',
  driverPhone: '',
};

const amenityLabel = (id: string) => AMENITIES.find((a) => a.id === id)?.label ?? id;

export default function Fleet() {
  const { data, upsert, remove } = useStore();
  const [editing, setEditing] = useState<Bus | null>(null);
  const [isNew, setIsNew] = useState(false);

  return (
    <>
      <PageHeader
        title="Fleet / Buses"
        subtitle="Each active bus gets its own booking page on the website (/booking/<id>)."
        action={
          <AddButton
            label="Add bus"
            onClick={() => {
              setIsNew(true);
              setEditing(blank);
            }}
          />
        }
      />

      {data.buses.length === 0 ? (
        <Empty text="No buses yet." />
      ) : (
        <div className="bus-grid">
          {data.buses.map((bus) => (
            <article key={bus.id} className="bus-card">
              <div className="bus-photo">
                {bus.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bus.images[0]} alt={bus.name} />
                ) : (
                  <span>No photo</span>
                )}
                {bus.tag && <span className="bus-tag">{bus.tag}</span>}
              </div>
              <div className="bus-body">
                <div className="bus-title">
                  <div>
                    <h3>{bus.name}</h3>
                    <div className="muted">
                      {bus.type} · {bus.registrationNumber || 'No reg. no.'}
                    </div>
                  </div>
                  <Badge value={bus.status} />
                </div>
                <p className="bus-desc">{bus.description}</p>
                <div className="bus-meta">
                  <span>
                    <Users size={14} /> {bus.seats} {bus.type === 'AC Sleeper' ? 'berths' : 'seats'}
                  </span>
                  <span className="strong">{inr(bus.pricePerKm)}/km</span>
                </div>
                <div className="chips">
                  {bus.amenities.map((a) => (
                    <span key={a} className="chip chip-soft">
                      {amenityLabel(a)}
                    </span>
                  ))}
                </div>
                <div className="bus-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => upsert('buses', { ...bus, status: bus.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' })}
                  >
                    {bus.status === 'ACTIVE' ? 'Mark maintenance' : 'Mark active'}
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setIsNew(false);
                      setEditing(bus);
                    }}
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    title="Delete"
                    onClick={() => {
                      const used = data.bookings.some((b) => b.busId === bus.id);
                      if (used) return window.alert(`${bus.name} has bookings. Mark it as maintenance instead of deleting.`);
                      if (confirmDelete(bus.name)) remove('buses', bus.id);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <BusForm
          initial={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={(bus) => {
            upsert('buses', bus);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function BusForm({ initial, isNew, onClose, onSave }: { initial: Bus; isNew: boolean; onClose: () => void; onSave: (b: Bus) => void }) {
  const { data } = useStore();
  const [b, setB] = useState(initial);
  const set = <K extends keyof Bus>(k: K, v: Bus[K]) => setB((x) => ({ ...x, [k]: v }));
  const idTaken = isNew && data.buses.some((x) => x.id === b.id);

  return (
    <FormModal title={isNew ? 'Add bus' : `Edit ${initial.name}`} onClose={onClose} onSave={() => !idTaken && onSave(b)} wide>
      <Field label="Bus name">
        <input
          className="input"
          required
          value={b.name}
          onChange={(e) => setB((x) => ({ ...x, name: e.target.value, id: isNew ? slugify(e.target.value) : x.id }))}
        />
      </Field>
      <Field label="Page URL id" hint={idTaken ? 'Another bus already uses this id.' : `Website: /booking/${b.id || '…'}`}>
        <input className="input" required pattern="[a-z0-9-]+" disabled={!isNew} value={b.id} onChange={(e) => set('id', slugify(e.target.value))} />
      </Field>
      <Field label="Bus type">
        <select className="input" value={b.type} onChange={(e) => set('type', e.target.value as BusType)}>
          {BUS_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select className="input" value={b.status} onChange={(e) => set('status', e.target.value as Bus['status'])}>
          <option value="ACTIVE">Active (shown on website)</option>
          <option value="MAINTENANCE">Maintenance (hidden)</option>
        </select>
      </Field>
      <Field label="Hire price per km (₹)">
        <input className="input" type="number" min={0} required value={b.pricePerKm} onChange={(e) => set('pricePerKm', Number(e.target.value))} />
      </Field>
      <Field label="Seats / berths">
        <input className="input" type="number" min={1} required value={b.seats} onChange={(e) => set('seats', Number(e.target.value))} />
      </Field>
      <Field label="Registration number">
        <input className="input" value={b.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value.toUpperCase())} placeholder="TN 00 AA 0000" />
      </Field>
      <Field label="Badge / tag (optional)" hint="e.g. Most Popular">
        <input className="input" value={b.tag ?? ''} onChange={(e) => set('tag', e.target.value)} />
      </Field>
      <Field label="Driver name (internal)">
        <input className="input" value={b.driverName ?? ''} onChange={(e) => set('driverName', e.target.value)} />
      </Field>
      <Field label="Driver phone (internal)">
        <input className="input" type="tel" value={b.driverPhone ?? ''} onChange={(e) => set('driverPhone', e.target.value)} />
      </Field>
      <Field label="Description" full>
        <textarea className="input" rows={3} required value={b.description} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <Field label="Amenities" full>
        <CheckGroup options={AMENITIES} values={b.amenities} onChange={(v) => set('amenities', v)} />
      </Field>
      <Field label="Photos" full hint="Image paths or URLs, e.g. /images/fleet/bus5.jpeg. The first is the main photo; more show as a gallery.">
        <ListEditor values={b.images} onChange={(v) => set('images', v)} placeholder="/images/fleet/…" />
      </Field>
      <Field label="Main photo crop position" full hint="Tailwind object-position class, e.g. object-[30%_center], keeps the bus in frame.">
        <input className="input" value={b.imagePosition} onChange={(e) => set('imagePosition', e.target.value)} />
      </Field>
    </FormModal>
  );
}

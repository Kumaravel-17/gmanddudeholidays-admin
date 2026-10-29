'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2, Users } from 'lucide-react';
import { inr, newId, useStore } from '../../lib/store';
import { BUS_TYPES, BusType, BusTypeCard } from '../../lib/types';
import { AddButton, confirmDelete, Empty, Field, FormModal, ListEditor, PageHeader, Toggle } from '../ui';

export default function BusTypes() {
  const { data, remove, setData } = useStore();
  const [editing, setEditing] = useState<BusTypeCard | null>(null);
  const unused = BUS_TYPES.filter((t) => !data.busTypes.some((b) => b.name === t));

  const save = (card: BusTypeCard) => {
    // Only one card can carry the "Most popular" ribbon.
    setData((d) => {
      const list = card.popular ? d.busTypes.map((b) => ({ ...b, popular: false })) : d.busTypes;
      const exists = list.some((b) => b.id === card.id);
      return { ...d, busTypes: exists ? list.map((b) => (b.id === card.id ? card : b)) : [...list, card] };
    });
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="Bus Types"
        subtitle={`The "Our fleet — Choose your perfect ride" cards on the home page.`}
        action={
          unused.length > 0 && (
            <AddButton
              label="Add bus type"
              onClick={() =>
                setEditing({ id: '', name: unused[0], tagline: '', capacity: '', pricePerKm: 50, features: [], popular: false })
              }
            />
          )
        }
      />

      {data.busTypes.length === 0 ? (
        <Empty text="No bus type cards." />
      ) : (
        <div className="type-grid">
          {data.busTypes.map((t) => (
            <article key={t.id} className={`type-card ${t.popular ? 'type-card-popular' : ''}`}>
              {t.popular && <span className="ribbon">Most popular</span>}
              <h3>{t.name}</h3>
              <p className="muted">{t.tagline}</p>
              <p className="type-capacity">
                <Users size={14} /> {t.capacity}
              </p>
              <ul>
                {t.features.map((f) => (
                  <li key={f}>
                    <Check size={14} /> {f}
                  </li>
                ))}
              </ul>
              <div className="type-price">
                <span className="muted">Starting from</span>
                <strong>{inr(t.pricePerKm)}</strong>/km
              </div>
              <div className="bus-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(t)}>
                  <Pencil size={14} /> Edit
                </button>
                <button
                  className="icon-btn icon-btn-danger"
                  onClick={() => confirmDelete(`the ${t.name} card`) && remove('busTypes', t.id)}
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <BusTypeForm initial={editing} onClose={() => setEditing(null)} onSave={(c) => save(c.id ? c : { ...c, id: newId('BT') })} />}
    </>
  );
}

function BusTypeForm({ initial, onClose, onSave }: { initial: BusTypeCard; onClose: () => void; onSave: (c: BusTypeCard) => void }) {
  const { data } = useStore();
  const [c, setC] = useState(initial);
  const set = <K extends keyof BusTypeCard>(k: K, v: BusTypeCard[K]) => setC((x) => ({ ...x, [k]: v }));
  const options = BUS_TYPES.filter((t) => t === initial.name || !data.busTypes.some((b) => b.name === t));

  return (
    <FormModal title={initial.id ? `Edit ${initial.name}` : 'Add bus type'} onClose={onClose} onSave={() => onSave(c)}>
      <Field label="Bus type">
        <select className="input" value={c.name} onChange={(e) => set('name', e.target.value as BusType)}>
          {options.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Starting price per km (₹)">
        <input className="input" type="number" min={0} required value={c.pricePerKm} onChange={(e) => set('pricePerKm', Number(e.target.value))} />
      </Field>
      <Field label="Tagline" full>
        <input className="input" required value={c.tagline} onChange={(e) => set('tagline', e.target.value)} />
      </Field>
      <Field label="Capacity" hint="e.g. 40–45 seats" full>
        <input className="input" required value={c.capacity} onChange={(e) => set('capacity', e.target.value)} />
      </Field>
      <Field label="Features (ticked list)" full>
        <ListEditor values={c.features} onChange={(v) => set('features', v)} placeholder="e.g. Push-back seats" />
      </Field>
      <div className="field-full">
        <Toggle checked={c.popular} onChange={(v) => set('popular', v)} label='Highlight as "Most popular"' />
      </div>
    </FormModal>
  );
}

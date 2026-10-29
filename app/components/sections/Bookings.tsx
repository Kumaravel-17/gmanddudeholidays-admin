'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  CalendarDays,
  CircleDollarSign,
  MessageCircle,
  NotebookPen,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Trash2,
  Users,
} from 'lucide-react';
import {
  addActivity,
  datesOverlap,
  describeChanges,
  digits,
  formatDateRange,
  formatDateTime,
  inr,
  newId,
  nowLocal,
  tripDays,
  useStore,
} from '../../lib/store';
import { ActivityKind, Booking, BOOKING_STATUSES, BookingStatus, PAYMENT_STATUSES, PaymentStatus } from '../../lib/types';
import { AddButton, Badge, Card, confirmDelete, Empty, Field, FormModal, PageHeader, SearchBox } from '../ui';

const today = () => new Date().toISOString().slice(0, 10);

const blank = (busId: string): Booking => ({
  id: '',
  customerName: '',
  phone: '',
  email: '',
  busId,
  from: '',
  to: '',
  passengers: 1,
  date: today(),
  endDate: today(),
  status: 'PENDING',
  paymentStatus: 'UNPAID',
  createdAt: '',
  activity: [],
});

// Shared by the list and the details page: every change goes through here so it lands in the activity log.
function useBookingActions() {
  const { data, upsert, remove } = useStore();
  const busName = (id: string) => data.buses.find((b) => b.id === id)?.name ?? id;
  const by = data.admin.name;

  const save = (next: Booking) => {
    if (!next.id) {
      const id = newId('BK');
      upsert('bookings', addActivity({ ...next, id, createdAt: nowLocal(), activity: [] }, [{ kind: 'CREATED', text: 'Booking created by admin' }], by));
      return id;
    }
    const prev = data.bookings.find((b) => b.id === next.id);
    upsert('bookings', prev ? addActivity(next, describeChanges(prev, next, busName), by) : next);
    return next.id;
  };

  const addNote = (b: Booking, text: string) => upsert('bookings', addActivity(b, [{ kind: 'NOTE', text }], by));

  return { save, addNote, remove: (id: string) => remove('bookings', id), busName };
}

export default function Bookings({ bookingId, goTo }: { bookingId: string; goTo: (view: string) => void }) {
  const { data } = useStore();
  const booking = bookingId ? data.bookings.find((b) => b.id === bookingId) : undefined;

  if (bookingId && booking) return <BookingDetails booking={booking} onBack={() => goTo('bookings')} />;
  if (bookingId)
    return (
      <>
        <button className="btn btn-ghost btn-sm back-btn" onClick={() => goTo('bookings')}>
          <ArrowLeft size={15} /> All bookings
        </button>
        <Empty text={`Booking ${bookingId} was not found. It may have been deleted.`} />
      </>
    );
  return <BookingList open={(id) => goTo(`bookings/${id}`)} />;
}

function BookingList({ open }: { open: (id: string) => void }) {
  const { data } = useStore();
  const { bookings, buses } = data;
  const { save, busName } = useBookingActions();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [busFilter, setBusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [editing, setEditing] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return bookings
      .filter((b) => status === 'ALL' || b.status === status)
      .filter((b) => busFilter === 'ALL' || b.busId === busFilter)
      .filter((b) => !dateFilter || datesOverlap(b, { date: dateFilter, endDate: dateFilter }))
      .filter((b) => !q || [b.id, b.customerName, b.phone, b.email, b.from, b.to].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [bookings, query, status, busFilter, dateFilter]);

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Whole-bus hire, booked by date. Click a booking to see its details and activity."
        action={<AddButton label="New booking" onClick={() => setEditing(blank(buses[0]?.id ?? ''))} />}
      />

      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search name, phone, city, ID…" />
        <select className="input input-auto" value={busFilter} onChange={(e) => setBusFilter(e.target.value)}>
          <option value="ALL">All buses</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className="input input-auto"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          title="Show bookings on this date"
          aria-label="Filter by date"
        />
        <div className="segmented">
          {(['ALL', ...BOOKING_STATUSES] as const).map((s) => (
            <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>
              {s === 'ALL' ? 'All' : s.toLowerCase()}
              <span>{s === 'ALL' ? bookings.length : bookings.filter((b) => b.status === s).length}</span>
            </button>
          ))}
        </div>
      </div>

      <Card className="card-flush">
        {filtered.length === 0 ? (
          <Empty text="No bookings match these filters." />
        ) : (
          <div className="table-wrap">
            {/* On phones each row becomes a card; data-label names each value */}
            <table className="table table-stack">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Travel dates</th>
                  <th>Bus / trip</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="row-link" onClick={() => open(b.id)}>
                    <td data-label="Booking">
                      <div className="strong mono">{b.id}</div>
                      <div className="muted">{formatDateTime(b.createdAt)}</div>
                    </td>
                    <td data-label="Customer">
                      <div className="strong">{b.customerName}</div>
                      <div className="muted">{b.phone}</div>
                    </td>
                    <td data-label="Travel dates">
                      <div className="strong">{formatDateRange(b)}</div>
                      <div className="muted">
                        {tripDays(b)} day{tripDays(b) > 1 ? 's' : ''} · {b.passengers} pax
                      </div>
                    </td>
                    <td data-label="Bus / trip">
                      <div className="strong">{busName(b.busId)}</div>
                      <div className="muted">
                        {b.from} → {b.to}
                      </div>
                    </td>
                    <td data-label="Amount">
                      <div className="strong">{inr(b.totalAmount)}</div>
                      <Badge value={b.paymentStatus} label={`${b.paymentStatus.toLowerCase()}${b.advancePaid ? ` · ${inr(b.advancePaid)}` : ''}`} />
                    </td>
                    <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                      <StatusSelect booking={b} onChange={(s) => save({ ...b, status: s })} />
                    </td>
                    <td className="table-stack-arrow">
                      <div className="row-actions">
                        <ArrowRight size={16} className="row-link-arrow" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <BookingForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(b) => {
            const id = save(b);
            setEditing(null);
            open(id);
          }}
        />
      )}
    </>
  );
}

function StatusSelect({ booking, onChange }: { booking: Booking; onChange: (s: BookingStatus) => void }) {
  return (
    <select
      className={`status-select status-${booking.status.toLowerCase()}`}
      value={booking.status}
      onChange={(e) => onChange(e.target.value as BookingStatus)}
      aria-label="Booking status"
    >
      {BOOKING_STATUSES.map((st) => (
        <option key={st} value={st}>
          {st.toLowerCase()}
        </option>
      ))}
    </select>
  );
}

const activityIcons: Record<ActivityKind, typeof Plus> = {
  CREATED: Plus,
  STATUS: RefreshCw,
  PAYMENT: CircleDollarSign,
  TRIP: CalendarDays,
  EDIT: Pencil,
  NOTE: NotebookPen,
};

function BookingDetails({ booking: b, onBack }: { booking: Booking; onBack: () => void }) {
  const { data } = useStore();
  const { save, addNote, remove, busName } = useBookingActions();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState('');

  const bus = data.buses.find((x) => x.id === b.busId);
  const paid = b.advancePaid ?? 0;
  const balance = Math.max(0, (b.totalAmount ?? 0) - paid);
  const advanceDue = b.totalAmount ? Math.round((b.totalAmount * data.settings.advancePercent) / 100) : 0;
  const days = tripDays(b);
  const activity = (b.activity ?? []).slice().reverse();

  const recordPayment = () => {
    const amount = Number(payment);
    if (!amount || amount <= 0) return;
    const total = paid + amount;
    const paymentStatus: PaymentStatus = b.totalAmount && total >= b.totalAmount ? 'PAID' : 'ADVANCE';
    save({ ...b, advancePaid: total, paymentStatus });
    setPayment('');
  };

  return (
    <>
      <button className="btn btn-ghost btn-sm back-btn" onClick={onBack}>
        <ArrowLeft size={15} /> All bookings
      </button>

      <div className="page-header">
        <div>
          <h1 className="detail-title">
            {b.customerName}
            <Badge value={b.status} />
          </h1>
          <p>
            <span className="mono">{b.id}</span> · booked {formatDateTime(b.createdAt)}
          </p>
        </div>
        <div className="page-header-actions">
          <a className="btn btn-ghost" href={`tel:+${digits(b.phone)}`}>
            <Phone size={15} /> Call
          </a>
          <a className="btn btn-ghost" href={`https://wa.me/${digits(b.phone)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={15} /> WhatsApp
          </a>
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit
          </button>
        </div>
      </div>

      <div className="detail-layout">
        <div className="stack">
          <Card>
            <div className="card-header">
              <h2>
                <RouteIcon size={18} /> Trip
              </h2>
              <StatusSelect booking={b} onChange={(s) => save({ ...b, status: s })} />
            </div>
            <div className="trip-hero">
              <div>
                <span className="muted">From</span>
                <strong>{b.from}</strong>
              </div>
              <ArrowRight size={20} className="trip-arrow" />
              <div className="text-right">
                <span className="muted">To</span>
                <strong>{b.to}</strong>
              </div>
            </div>
            <dl className="details details-wide">
              <dt>
                <CalendarDays size={14} /> Dates
              </dt>
              <dd>
                {formatDateRange(b)}
                <span className="muted">
                  {' '}
                  · {days} day{days > 1 ? 's' : ''}
                </span>
              </dd>
              <dt>
                <Bus size={14} /> Bus
              </dt>
              <dd>
                {busName(b.busId)}
                {bus && (
                  <span className="muted">
                    {' '}
                    · {bus.type} · {bus.registrationNumber}
                  </span>
                )}
              </dd>
              <dt>
                <Users size={14} /> Passengers
              </dt>
              <dd>
                {b.passengers}
                {bus && <span className="muted"> of {bus.seats} seats</span>}
              </dd>
              {bus?.driverName && (
                <>
                  <dt>Driver</dt>
                  <dd>
                    {bus.driverName}
                    {bus.driverPhone && <span className="muted"> · {bus.driverPhone}</span>}
                  </dd>
                </>
              )}
            </dl>
            {b.notes && <div className="message-body">{b.notes}</div>}
          </Card>

          <Card>
            <div className="card-header">
              <h2>Customer</h2>
            </div>
            <dl className="details details-wide">
              <dt>Name</dt>
              <dd>{b.customerName}</dd>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:+${digits(b.phone)}`}>{b.phone}</a>
              </dd>
              <dt>Email</dt>
              <dd>{b.email ? <a href={`mailto:${b.email}`}>{b.email}</a> : '—'}</dd>
            </dl>
          </Card>

          <Card>
            <div className="card-header">
              <h2>
                <CircleDollarSign size={18} /> Payment
              </h2>
              <Badge value={b.paymentStatus} />
            </div>
            <div className="pay-grid">
              <div>
                <span className="muted">Total</span>
                <strong>{inr(b.totalAmount)}</strong>
              </div>
              <div>
                <span className="muted">Received</span>
                <strong className="text-green">{inr(paid)}</strong>
              </div>
              <div>
                <span className="muted">Balance</span>
                <strong className={balance ? 'text-red' : ''}>{inr(balance)}</strong>
              </div>
            </div>
            {b.totalAmount ? (
              <div className="pay-track" title={`${Math.round((paid / b.totalAmount) * 100)}% received`}>
                <span style={{ width: `${Math.min(100, (paid / b.totalAmount) * 100)}%` }} />
              </div>
            ) : null}
            {advanceDue > 0 && paid < advanceDue && (
              <p className="muted">
                Advance to confirm ({data.settings.advancePercent}%): {inr(advanceDue)}
              </p>
            )}
            {b.status !== 'CANCELLED' && balance > 0 && (
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  recordPayment();
                }}
              >
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  placeholder="Amount received (₹)"
                  aria-label="Amount received"
                />
                <button type="submit" className="btn btn-ghost">
                  Record payment
                </button>
              </form>
            )}
          </Card>

          <button
            className="btn btn-danger"
            onClick={() => {
              if (!confirmDelete(`booking ${b.id}`)) return;
              remove(b.id);
              onBack();
            }}
          >
            <Trash2 size={15} /> Delete booking
          </button>
        </div>

        <Card className="activity-card">
          <div className="card-header">
            <h2>Activity</h2>
            <span className="muted">{activity.length} events</span>
          </div>

          <form
            className="note-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              addNote(b, note.trim());
              setNote('');
            }}
          >
            <textarea
              className="input"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note: call with customer, pickup change…"
              aria-label="New note"
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!note.trim()}>
              Add note
            </button>
          </form>

          {activity.length === 0 ? (
            <Empty text="No activity yet." />
          ) : (
            <ol className="timeline">
              {activity.map((a) => {
                const Icon = activityIcons[a.kind] ?? Pencil;
                return (
                  <li key={a.id} className={`timeline-item timeline-${a.kind.toLowerCase()}`}>
                    <span className="timeline-dot">
                      <Icon size={13} />
                    </span>
                    <div className="timeline-body">
                      <div className={a.kind === 'NOTE' ? 'timeline-note-text' : 'strong'}>{a.text}</div>
                      <div className="muted">
                        {formatDateTime(a.at)} · {a.by}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>

      {editing && (
        <BookingForm
          initial={b}
          onClose={() => setEditing(false)}
          onSave={(next) => {
            save(next);
            setEditing(false);
          }}
        />
      )}
    </>
  );
}

function BookingForm({ initial, onClose, onSave }: { initial: Booking; onClose: () => void; onSave: (b: Booking) => void }) {
  const { data } = useStore();
  const [b, setB] = useState(initial);
  const set = <K extends keyof Booking>(k: K, v: Booking[K]) => setB((x) => ({ ...x, [k]: v }));
  const bus = data.buses.find((x) => x.id === b.busId);
  const clash = data.bookings.find((x) => x.id !== b.id && x.busId === b.busId && x.status !== 'CANCELLED' && datesOverlap(x, b));

  return (
    <FormModal title={initial.id ? `Edit booking ${initial.id}` : 'New booking'} onClose={onClose} onSave={() => onSave(b)} wide>
      <Field label="Customer name">
        <input className="input" required value={b.customerName} onChange={(e) => set('customerName', e.target.value)} />
      </Field>
      <Field label="Phone">
        <input className="input" required type="tel" value={b.phone} onChange={(e) => set('phone', e.target.value)} />
      </Field>
      <Field label="Email (optional)">
        <input className="input" type="email" value={b.email ?? ''} onChange={(e) => set('email', e.target.value)} />
      </Field>
      <Field label="Passengers" hint={bus ? `${bus.name} has ${bus.seats} seats` : undefined}>
        <input className="input" type="number" min={1} max={bus?.seats} required value={b.passengers} onChange={(e) => set('passengers', Number(e.target.value))} />
      </Field>
      <Field label="Pickup city">
        <input className="input" list="cities" required value={b.from} onChange={(e) => set('from', e.target.value)} />
      </Field>
      <Field label="Destination">
        <input className="input" list="cities" required value={b.to} onChange={(e) => set('to', e.target.value)} />
      </Field>
      <datalist id="cities">
        {data.settings.cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <Field label="Bus" full>
        <select className="input" required value={b.busId} onChange={(e) => set('busId', e.target.value)}>
          {data.buses.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} — {x.type}
              {x.status === 'MAINTENANCE' ? ' (maintenance)' : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="From date">
        <input
          className="input"
          type="date"
          required
          value={b.date}
          onChange={(e) => setB((x) => ({ ...x, date: e.target.value, endDate: x.endDate < e.target.value ? e.target.value : x.endDate }))}
        />
      </Field>
      <Field label="To date" hint={`${tripDays(b)} day${tripDays(b) > 1 ? 's' : ''}`}>
        <input className="input" type="date" required min={b.date} value={b.endDate} onChange={(e) => set('endDate', e.target.value)} />
      </Field>
      <Field label="Booking status">
        <select className="input" value={b.status} onChange={(e) => set('status', e.target.value as BookingStatus)}>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Total amount (₹)">
        <input className="input" type="number" min={0} value={b.totalAmount ?? ''} onChange={(e) => set('totalAmount', e.target.value === '' ? undefined : Number(e.target.value))} />
      </Field>
      <Field label="Advance / paid (₹)" hint={`Advance to confirm: ${data.settings.advancePercent}%${b.totalAmount ? ` = ${inr(Math.round((b.totalAmount * data.settings.advancePercent) / 100))}` : ''}`}>
        <input className="input" type="number" min={0} value={b.advancePaid ?? ''} onChange={(e) => set('advancePaid', e.target.value === '' ? undefined : Number(e.target.value))} />
      </Field>
      <Field label="Payment status">
        <select className="input" value={b.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value as PaymentStatus)}>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes" full>
        <textarea className="input" rows={3} value={b.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder="Pickup point, stops, special requests…" />
      </Field>
      {clash && b.status !== 'CANCELLED' && (
        <div className="alert alert-warn field-full">
          {bus?.name} is already booked {formatDateRange(clash)} ({clash.id}, {clash.customerName}).
        </div>
      )}
    </FormModal>
  );
}

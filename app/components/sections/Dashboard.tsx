'use client';

import { Bus, CalendarCheck, CalendarDays, IndianRupee, TrendingUp } from 'lucide-react';
import { datesOverlap, formatDateRange, inr, tripDays, useStore } from '../../lib/store';
import { Badge, Card, Empty, PageHeader } from '../ui';

export default function Dashboard({ goTo }: { goTo: (tab: string) => void }) {
  const { data } = useStore();
  const { bookings, buses } = data;

  const today = new Date().toISOString().slice(0, 10);
  const live = bookings.filter((b) => b.status !== 'CANCELLED');
  const revenue = live.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);
  const collected = live.reduce((sum, b) => sum + (b.advancePaid ?? 0), 0);
  const pending = bookings.filter((b) => b.status === 'PENDING').length;
  const upcoming = bookings
    .filter((b) => (b.endDate || b.date) >= today && (b.status === 'CONFIRMED' || b.status === 'PENDING'))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const busName = (id: string) => buses.find((b) => b.id === id)?.name ?? id;
  const onTripToday = bookings.filter((b) => b.status !== 'CANCELLED' && datesOverlap(b, { date: today, endDate: today }));

  const stats = [
    { label: 'Total bookings', value: bookings.length, note: `${pending} pending`, icon: CalendarCheck, tab: 'bookings' },
    { label: 'Booking value', value: inr(revenue), note: `${inr(collected)} collected`, icon: IndianRupee, tab: 'bookings' },
    {
      label: 'Active buses',
      value: `${buses.filter((b) => b.status === 'ACTIVE').length}/${buses.length}`,
      note: `${buses.filter((b) => b.status === 'MAINTENANCE').length} in maintenance`,
      icon: Bus,
      tab: 'fleet',
    },
    { label: 'Buses out today', value: onTripToday.length, note: `${Math.max(0, buses.filter((b) => b.status === 'ACTIVE').length - onTripToday.length)} free`, icon: CalendarDays, tab: 'bookings' },
  ];

  const byStatus = (['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((s) => ({
    status: s,
    count: bookings.filter((b) => b.status === s).length,
  }));

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${data.admin.name}. Here's what's happening.`} />

      <div className="stat-grid">
        {stats.map(({ label, value, note, icon: Icon, tab }) => (
          <button key={label} className="stat-card" onClick={() => goTo(tab)}>
            <span className="stat-icon">
              <Icon size={20} />
            </span>
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
            <span className="stat-note">{note}</span>
          </button>
        ))}
      </div>

      <div className="two-col">
        <Card>
          <div className="card-header">
            <h2>Upcoming trips</h2>
            <button className="link-btn" onClick={() => goTo('bookings')}>
              View all
            </button>
          </div>
          {upcoming.length === 0 ? (
            <Empty text="No upcoming trips." />
          ) : (
            <div className="table-wrap">
              <table className="table table-stack">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Bus</th>
                    <th>Trip</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((b) => (
                    <tr key={b.id} className="row-link" onClick={() => goTo(`bookings/${b.id}`)}>
                      <td data-label="Date">
                        <div className="strong">{formatDateRange(b)}</div>
                        <div className="muted">
                          {tripDays(b)} day{tripDays(b) > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td data-label="Customer">{b.customerName}</td>
                      <td data-label="Bus">{busName(b.busId)}</td>
                      <td data-label="Trip">
                        {b.from} → {b.to}
                      </td>
                      <td data-label="Status">
                        <Badge value={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="card-header">
            <h2>
              <TrendingUp size={18} /> Bookings by status
            </h2>
          </div>
          <div className="bars">
            {byStatus.map(({ status, count }) => (
              <div key={status} className="bar-row">
                <span className="bar-label">{status.toLowerCase()}</span>
                <span className="bar-track">
                  <span className={`bar-fill bar-${status.toLowerCase()}`} style={{ width: `${bookings.length ? (count / bookings.length) * 100 : 0}%` }} />
                </span>
                <span className="bar-count">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

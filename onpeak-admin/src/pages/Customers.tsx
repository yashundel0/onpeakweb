import { useState, useMemo } from 'react';
import type { useAdminData } from '@/hooks/useAdminData';
import type { Booking } from '@/lib/types';
import { fmtDate, fmtDateTime, statusBadgeClass, paymentBadgeClass, paymentLabel } from '@/lib/utils';
import { navigate } from '@/lib/router';
import { Search, X, Phone, Mail, Calendar, Clock } from 'lucide-react';

type AdminData = ReturnType<typeof useAdminData>;

export default function Customers({ adminData }: { adminData: AdminData }) {
  const { bookings, loading } = adminData;
  const [q, setQ] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const customers = useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone: string; bookings: Booking[] }>();
    for (const b of bookings) {
      const email = b.customer_email || '(no email)';
      const existing = map.get(email);
      if (existing) {
        existing.bookings.push(b);
        if (!existing.name && b.customer_name) existing.name = b.customer_name;
        if (!existing.phone && b.customer_phone) existing.phone = b.customer_phone;
      } else {
        map.set(email, {
          name: b.customer_name || '—',
          email,
          phone: b.customer_phone || '—',
          bookings: [b],
        });
      }
    }
    const list = Array.from(map.values()).map((c) => ({
      ...c,
      count: c.bookings.length,
      totalSpent: c.bookings.filter((b) => b.payment_status === 'paid').reduce((s, b) => s + Number(b.final_price_aed), 0),
      lastBooking: c.bookings.reduce((latest, b) => b.created_at > latest ? b.created_at : latest, c.bookings[0]?.created_at || ''),
    }));
    list.sort((a, b) => b.lastBooking.localeCompare(a.lastBooking));
    return list;
  }, [bookings]);

  const filtered = customers.filter((c) => {
    if (!q) return true;
    const ql = q.toLowerCase();
    return c.name.toLowerCase().includes(ql) || c.email.toLowerCase().includes(ql) || c.phone.toLowerCase().includes(ql);
  });

  const selected = selectedEmail ? customers.find((c) => c.email === selectedEmail) : null;

  if (selected) {
    return <CustomerDetail customer={selected} onBack={() => setSelectedEmail(null)} />;
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-xl font-bold text-brand-cream">Customers</h2>
        <p className="text-sm text-brand-cream/40">{customers.length} customers with bookings</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-cream/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone" className="op-input pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center py-16 text-brand-cream/40"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-mid border-t-brand-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep/40 p-8 text-center text-sm text-brand-cream/40">No customers found.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-mid/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-deep text-brand-cream/50">
              <tr>
                {['Name', 'Email', 'Phone', 'Bookings', 'Total Spent', 'Last Booking', ''].map((h, i) => (
                  <th key={i} className="whitespace-nowrap px-3 py-2 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.email} className="cursor-pointer border-t border-brand-mid/15 hover:bg-brand-mid/10" onClick={() => setSelectedEmail(c.email)}>
                  <td className="px-3 py-2.5 font-semibold text-brand-cream">{c.name}</td>
                  <td className="px-3 py-2.5 text-brand-cream/60">{c.email}</td>
                  <td className="px-3 py-2.5 text-brand-cream/60">{c.phone}</td>
                  <td className="px-3 py-2.5 text-brand-cream/80">{c.count}</td>
                  <td className="px-3 py-2.5 font-semibold text-brand-accent">AED {c.totalSpent.toFixed(0)}</td>
                  <td className="px-3 py-2.5 text-brand-cream/50">{fmtDate(c.lastBooking.slice(0, 10))}</td>
                  <td className="px-3 py-2.5 text-brand-cream/30">→</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CustomerDetail({ customer, onBack }: { customer: { name: string; email: string; phone: string; bookings: Booking[]; count: number; totalSpent: number }; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-brand-cream/60 hover:text-brand-cream">
        <X className="h-4 w-4" /> Back to customers
      </button>

      <div className="op-card mb-5 p-6">
        <h3 className="font-display text-lg font-bold text-brand-cream">{customer.name}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-brand-cream/40" />
            <span className="text-brand-cream/60">{customer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-brand-cream/40" />
            <span className="text-brand-cream/60">{customer.phone}</span>
          </div>
          <div className="text-sm">
            <span className="text-brand-cream/40">Total spent: </span>
            <span className="font-bold text-brand-accent">AED {customer.totalSpent.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-cream/50">Booking History ({customer.bookings.length})</h4>
      <div className="space-y-2">
        {customer.bookings.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((b) => (
          <div key={b.id} onClick={() => navigate(`/bookings?id=${b.id}`)} className="flex cursor-pointer items-center justify-between rounded-xl border border-brand-mid/20 bg-brand-deep p-3 text-xs hover:bg-brand-mid/15">
            <div>
              <span className="font-mono font-bold text-brand-accent">{b.booking_code}</span>
              <span className="ml-2 text-brand-cream">{fmtDate(b.booking_date)}</span>
              <span className="ml-2 text-brand-cream/50">{b.start_time.slice(0, 5)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-cream">AED {Number(b.final_price_aed).toFixed(0)}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(b.booking_status)}`}>{b.booking_status}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClass(b.payment_status)}`}>{paymentLabel(b.payment_status)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

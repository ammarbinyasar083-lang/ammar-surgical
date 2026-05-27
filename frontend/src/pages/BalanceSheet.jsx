import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { fmt, addOneDay, today } from '../utils/helpers';
import { exportBalanceSheet, exportClosedDays } from '../utils/export';

function BalancePanel({ b, isClosed }) {
  const lhs = b.opening + b.cashSales + b.custPayments;
  const rhs = b.supplierCashOut + b.expensesTotal + b.closing;
  const diff = Math.abs(lhs - rhs);
  const balanced = diff < 0.01;

  return (
    <div>
      {isClosed && (
        <div className="alert" style={{ background: '#0d2318', border: '1px solid var(--success)', color: 'var(--success)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <div><strong>Day Closed</strong> — Snapshot locked. Closing cash <strong>{fmt(b.closing)}</strong> carried forward as next day's opening.</div>
        </div>
      )}

      <div className="cards-grid">
        {[
          ['Opening Cash', b.opening, 'teal'],
          ['+ Cash from Sales', b.cashSales, 'green'],
          ['+ Customer Payments', b.custPayments, 'green'],
          ['− Supplier Payments', b.supplierCashOut, 'amber'],
          ['− Expenses', b.expensesTotal, 'red'],
          ['Net Cash Flow', b.netFlow, b.netFlow >= 0 ? 'green' : 'red'],
          ['= Closing Cash', b.closing, 'teal'],
          ['Daily Profit', b.dayProfit, b.dayProfit >= 0 ? 'green' : 'red'],
          ['Daily Outstanding', b.outstandingToday, 'amber'],
        ].map(([label, val, cls]) => (
          <div key={label} className="card">
            <div className="card-label">{label}</div>
            <div className={`card-value ${cls} mono`}>{fmt(val)}</div>
          </div>
        ))}
      </div>

      {/* LHS = RHS accounting check */}
      <div style={{ marginTop: 20, marginBottom: 4 }}>
        <div className="balance-check-grid">
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14, fontWeight: 700 }}>◀ Sources (LHS)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Opening Cash', b.opening, 'var(--accent)'], ['Cash from Sales', b.cashSales, 'var(--success)'], ['Customer Payments', b.custPayments, 'var(--success)']].map(([lbl, val, color]) => (
                <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{lbl}</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 600, color }}>{fmt(val)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Total Sources</span>
                <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{fmt(lhs)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', background: 'var(--surface2)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: 80, gap: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: balanced ? 'var(--success)' : 'var(--danger)' }}>=</div>
            <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '4px 10px', borderRadius: 20, background: balanced ? '#16341c' : '#2d0f0f', color: balanced ? 'var(--success)' : 'var(--danger)', border: `1px solid ${balanced ? 'var(--success)' : 'var(--danger)'}` }}>
              {balanced ? '✓ BALANCED' : '✗ ERROR'}
            </div>
            {!balanced && <div className="mono" style={{ fontSize: 10, color: 'var(--danger)', textAlign: 'center' }}>Δ {fmt(diff)}</div>}
          </div>

          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14, fontWeight: 700 }}>Uses (RHS) ▶</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Supplier Payments', b.supplierCashOut, 'var(--warn)'], ['Expenses', b.expensesTotal, 'var(--danger)'], ['Closing Cash', b.closing, 'var(--accent)']].map(([lbl, val, color]) => (
                <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{lbl}</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 600, color }}>{fmt(val)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Total Uses</span>
                <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{fmt(rhs)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash movements */}
      <div className="table-wrap" style={{ marginTop: 16 }}>
        <div className="table-header"><h3>Cash Movements — {b.d}</h3></div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Type</th><th>Reference</th><th>In</th><th>Out</th></tr></thead>
            <tbody>
              {[
                ...b.sales.filter(s => s.paid > 0).map(s => (
                  <tr key={s.id}><td>Sale</td><td>{s.customer} — {s.invoiceNo || s.id}</td><td className="mono" style={{ color: 'var(--success)' }}>{fmt(s.paid)}</td><td /></tr>
                )),
                ...b.pus.filter(p => p.paid > 0).map(p => (
                  <tr key={p.id}><td>Purchase</td><td>{p.supplier} — {p.purchaseNo || p.id}</td><td /><td className="mono" style={{ color: 'var(--warn)' }}>{fmt(p.paid)}</td></tr>
                )),
                ...b.exps.map(e => (
                  <tr key={e.id}><td>Expense</td><td>{e.category || ''} — {e.desc || ''}</td><td /><td className="mono" style={{ color: 'var(--danger)' }}>{fmt(e.amount)}</td></tr>
                )),
              ].length ? [
                ...b.sales.filter(s => s.paid > 0).map(s => (
                  <tr key={s.id}><td>Sale</td><td>{s.customer} — {s.invoiceNo || s.id}</td><td className="mono" style={{ color: 'var(--success)' }}>{fmt(s.paid)}</td><td /></tr>
                )),
                ...b.pus.filter(p => p.paid > 0).map(p => (
                  <tr key={p.id}><td>Purchase</td><td>{p.supplier} — {p.purchaseNo || p.id}</td><td /><td className="mono" style={{ color: 'var(--warn)' }}>{fmt(p.paid)}</td></tr>
                )),
                ...b.exps.map(e => (
                  <tr key={e.id}><td>Expense</td><td>{e.category || ''} — {e.desc || ''}</td><td /><td className="mono" style={{ color: 'var(--danger)' }}>{fmt(e.amount)}</td></tr>
                )),
              ] : <tr><td colSpan={4} className="empty"><p>No movements this day</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function BalanceSheet() {
  const { sessions, activeSession, lastClosedSession, createSession, closeDay, reopenDay, getBalanceForDate } = useData();
  const [viewDate, setViewDate] = useState(null); // null = live, string = history
  const [balanceData, setBalanceData] = useState(null);

  useEffect(() => {
    if (viewDate) {
      const session = sessions.find(s => s.date === viewDate);
      if (session) setBalanceData(getBalanceForDate(viewDate, session.opening || 0));
    } else if (activeSession) {
      setBalanceData(getBalanceForDate(activeSession.date, activeSession.opening || 0));
    } else {
      setBalanceData(null);
    }
  }, [viewDate, activeSession, sessions, getBalanceForDate]);

  const handleOpenNew = () => {
    if (activeSession) return alert('A session is already open. Close today before opening a new day.');
    const t = today();
    const nextFromLast = lastClosedSession ? addOneDay(lastClosedSession.date) : t;
    const suggestedDate = nextFromLast > t ? nextFromLast : t;

    if (!lastClosedSession) {
      const input = prompt(`First session — Enter opening cash (PKR):\nDate: ${suggestedDate}`, '0');
      if (input === null) return;
      createSession(suggestedDate, parseFloat(input) || 0);
    } else {
      const newOpening = lastClosedSession.closing != null ? lastClosedSession.closing : getBalanceForDate(lastClosedSession.date, lastClosedSession.opening || 0).closing;
      const dateInput = prompt(`Open new session\n\nSuggested date (YYYY-MM-DD):\nLast closed: ${lastClosedSession.date} → Next: ${suggestedDate}\n\nChange date if needed, or press OK to accept:`, suggestedDate);
      if (dateInput === null) return;
      const newDate = dateInput.trim() || suggestedDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return alert('Invalid date format. Use YYYY-MM-DD.');
      if (!confirm(`Open session?\n\nDate: ${newDate}\nOpening Cash: ${fmt(newOpening)}\n\nCarried forward from ${lastClosedSession.date}.`)) return;
      createSession(newDate, newOpening);
    }
  };

  const handleCloseDay = () => {
    if (!activeSession) return alert('No open session to close.');
    const b = getBalanceForDate(activeSession.date, activeSession.opening || 0);
    if (!confirm(`Close day ${activeSession.date}?\n\nClosing Cash: ${fmt(b.closing)}\nThis will carry forward as tomorrow's opening cash.`)) return;
    closeDay(activeSession.date, activeSession.opening || 0);
    alert(`Day ${activeSession.date} closed.\nClosing cash ${fmt(b.closing)} will be tomorrow's opening.`);
  };

  const handleReopen = date => {
    if (activeSession) return alert("Close today's open session first before reopening a past day.");
    if (!confirm(`Reopen day ${date}?\n\nThe closed snapshot will be removed and the session marked OPEN again.`)) return;
    reopenDay(date);
    setViewDate(null);
  };

  const viewingSession = viewDate ? sessions.find(s => s.date === viewDate) : null;
  const viewingClosed = viewingSession?.status === 'closed';

  return (
    <div>
      {/* Toolbar bars */}
      {!viewDate && activeSession && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div className="toolbar" style={{ alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>📅 Session Date:</span>
            <span className="mono" style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>{activeSession.date}</span>
            <span style={{ background: '#16341c', color: 'var(--success)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--success)' }}>● OPEN</span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Opening Cash:</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{fmt(activeSession.opening || 0)}</span>
          </div>
          <div className="toolbar">
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>🖨 Print</button>
            <button className="btn btn-secondary btn-sm" onClick={() => balanceData && exportBalanceSheet('pdf', balanceData)}>PDF</button>
            <button className="btn btn-secondary btn-sm" onClick={() => balanceData && exportBalanceSheet('xlsx', balanceData)}>Excel</button>
            <button className="btn btn-primary btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={handleCloseDay}>🔒 Close Day</button>
          </div>
        </div>
      )}

      {!viewDate && !activeSession && (
        <div style={{ marginBottom: 20 }}>
          <div className="alert alert-warn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong>No open session.</strong>
              <span style={{ marginLeft: 8, fontSize: 13 }}>
                {lastClosedSession
                  ? `Last closed: ${lastClosedSession.date} (closing cash: ${fmt(lastClosedSession.closing)}). New session will open on ${addOneDay(lastClosedSession.date)}.`
                  : 'No sessions yet. First session will open today with PKR 0 opening cash.'}
              </span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleOpenNew} style={{ whiteSpace: 'nowrap' }}>▶ Open New Day</button>
          </div>
        </div>
      )}

      {viewDate && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div className="toolbar" style={{ gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>📅 Viewing:</span>
            <span className="mono" style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 700 }}>{viewDate}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: viewingClosed ? '#16341c' : '#0f1e38', color: viewingClosed ? 'var(--success)' : 'var(--accent2)', border: `1px solid ${viewingClosed ? 'var(--success)' : 'var(--accent2)'}` }}>
              {viewingClosed ? '✓ CLOSED' : '● OPEN'}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setViewDate(null)}>← Back to Today</button>
          </div>
          <div className="toolbar">
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>🖨 Print</button>
            <button className="btn btn-secondary btn-sm" onClick={() => balanceData && exportBalanceSheet('pdf', balanceData)}>PDF</button>
            <button className="btn btn-secondary btn-sm" onClick={() => balanceData && exportBalanceSheet('xlsx', balanceData)}>Excel</button>
            {viewingClosed && <button className="btn-icon" title="Reopen day" style={{ color: 'var(--warn)', fontSize: 18 }} onClick={() => handleReopen(viewDate)}>🔓</button>}
          </div>
        </div>
      )}

      {/* Main panel */}
      {balanceData ? (
        <BalancePanel b={balanceData} isClosed={viewingClosed || false} />
      ) : !viewDate && !activeSession ? (
        <div className="empty"><p style={{ fontSize: 14 }}>Open a new day to start tracking cash flow.</p></div>
      ) : null}

      {/* Session history */}
      {sessions.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="table-wrap">
            <div className="table-header">
              <h3>📋 Session History</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => exportClosedDays('xlsx', sessions)}>📊 Excel</button>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Date</th><th>Status</th><th>Opening</th><th>Cash In</th><th>Cash Out</th><th>Net Flow</th><th>Closing Cash</th><th>Profit</th><th>Closed At</th><th></th></tr>
                </thead>
                <tbody>
                  {sessions.map(r => (
                    <tr key={r.date}>
                      <td className="mono" style={{ fontWeight: 600 }}>{r.date}</td>
                      <td>{r.status === 'open' ? <span className="badge badge-green">OPEN</span> : <span className="badge badge-blue">CLOSED</span>}</td>
                      <td className="mono">{fmt(r.opening)}</td>
                      <td className="mono" style={{ color: 'var(--success)' }}>{fmt((r.cashSales || 0) + (r.custPayments || 0))}</td>
                      <td className="mono" style={{ color: 'var(--warn)' }}>{fmt((r.supplierCashOut || 0) + (r.expensesTotal || 0))}</td>
                      <td className="mono" style={{ color: (r.netFlow || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(r.netFlow || 0)}</td>
                      <td className="mono" style={{ color: 'var(--accent)', fontWeight: 700 }}>{r.closing != null ? fmt(r.closing) : '—'}</td>
                      <td className="mono" style={{ color: (r.dayProfit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(r.dayProfit || 0)}</td>
                      <td style={{ color: 'var(--text3)', fontSize: 11 }}>{r.closedAt ? new Date(r.closedAt).toLocaleString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" title="View" onClick={() => setViewDate(r.date)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          {r.status === 'closed' && (
                            <button className="btn-icon" title="Reopen" style={{ color: 'var(--warn)' }} onClick={() => handleReopen(r.date)}>🔓</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const today = () => new Date().toISOString().slice(0, 10);
export const fmt = n => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });
export const fmtN = n => Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });

export const inRange = (dateStr, from, to) => {
  if (!from && !to) return true;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
};

export const deriveStatus = (total, paid) => {
  total = Number(total || 0);
  paid = Number(paid || 0);
  if (paid <= 0) return 'unpaid';
  if (paid + 0.01 >= total) return 'paid';
  return 'partial';
};

export const recomputeSale = sale => {
  sale.status = deriveStatus(sale.total, sale.paid);
  return sale;
};

export const recomputePurchase = p => {
  p.status = deriveStatus(p.total, p.paid);
  return p;
};

export const addOneDay = dateStr => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

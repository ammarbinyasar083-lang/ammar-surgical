function deriveStatus(total, paid) {
  paid = Number(paid || 0);
  total = Number(total || 0);
  if (paid <= 0) return 'unpaid';
  if (paid + 0.01 >= total) return 'paid';
  return 'partial';
}

module.exports = { deriveStatus };

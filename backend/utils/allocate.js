/**
 * FIFO payment allocation.
 * Given a sorted list of invoices (oldest first) and a payment delta,
 * distributes the amount across invoices and returns updated paid/status values.
 *
 * @param {Array} invoices  — Mongoose docs with .total, .paid, .status, .recompute()
 * @param {number} delta    — positive to apply payment, negative to reverse
 * @returns {Array}         — same array with mutated .paid and .status
 */
function allocateFIFO(invoices, delta) {
  let remaining = delta;

  if (delta > 0) {
    for (const inv of invoices) {
      if (remaining <= 0) break;
      const owed = inv.total - inv.paid;
      if (owed <= 0) continue;
      const apply = Math.min(remaining, owed);
      inv.paid = Math.round((inv.paid + apply) * 100) / 100;
      remaining = Math.round((remaining - apply) * 100) / 100;
      inv.recompute();
    }
  } else {
    // Reverse: walk newest-first to remove overpayment first
    const reversed = [...invoices].reverse();
    let toRemove = Math.abs(remaining);
    for (const inv of reversed) {
      if (toRemove <= 0) break;
      const remove = Math.min(toRemove, inv.paid);
      inv.paid = Math.round((inv.paid - remove) * 100) / 100;
      toRemove = Math.round((toRemove - remove) * 100) / 100;
      inv.recompute();
    }
  }

  return invoices;
}

module.exports = { allocateFIFO };

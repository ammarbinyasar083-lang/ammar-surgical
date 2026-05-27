const router = require('express').Router();
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const { allocateFIFO } = require('../utils/allocate');

async function applyAllocation(payment, delta) {
  if (payment.type === 'customer') {
    const invoices = await Sale.find({ customer: payment.party }).sort({ date: 1, createdAt: 1 });
    const updated = allocateFIFO(invoices, delta);
    for (const inv of updated) await inv.save();
  } else {
    const invoices = await Purchase.find({ supplier: payment.party }).sort({ date: 1, createdAt: 1 });
    const updated = allocateFIFO(invoices, delta);
    for (const inv of updated) await inv.save();
  }
}

// GET all
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ date: -1, createdAt: -1 });
    res.json(payments);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST — record payment and allocate FIFO
router.post('/', async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    await applyAllocation(payment, payment.amount);
    res.status(201).json(payment);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PUT — edit payment (reverse old, apply new)
router.put('/:id', async (req, res) => {
  try {
    const old = await Payment.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Not found' });

    // Reverse old allocation
    await applyAllocation(old, -old.amount);

    Object.assign(old, req.body);
    await old.save();

    // Apply new allocation
    await applyAllocation(old, old.amount);
    res.json(old);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE — reverse allocation then delete
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });

    await applyAllocation(payment, -payment.amount);
    await payment.deleteOne();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

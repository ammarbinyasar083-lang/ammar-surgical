const router = require('express').Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { deriveStatus } = require('../utils/helpers');

// GET all
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1, createdAt: -1 });
    res.json(sales);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST — create sale, deduct stock
router.post('/', async (req, res) => {
  try {
    const { items = [], ...rest } = req.body;

    // Deduct stock for each item
    for (const item of items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
      }
    }

    const sale = await Sale.create({ ...rest, items });
    res.status(201).json(sale);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE — restore stock
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Not found' });

    for (const item of sale.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
      }
    }

    await sale.deleteOne();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /:id/paid — update paid amount
router.patch('/:id/paid', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Not found' });

    sale.paid = Number(req.body.paid ?? sale.paid);
    sale.status = deriveStatus(sale.total, sale.paid);
    await sale.save();
    res.json(sale);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;

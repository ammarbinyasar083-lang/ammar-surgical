const router = require('express').Router();
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const { deriveStatus } = require('../utils/helpers');

// GET all
router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ date: -1, createdAt: -1 });
    res.json(purchases);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST — create purchase, upsert stock
router.post('/', async (req, res) => {
  try {
    const { items = [], ...rest } = req.body;

    for (const item of items) {
      const existing = await Product.findOne({ name: new RegExp(`^${item.name}$`, 'i') });
      if (existing) {
        existing.stock += item.qty;
        existing.cost = item.cost;
        await existing.save();
      } else {
        await Product.create({ name: item.name, stock: item.qty, cost: item.cost, sale: item.cost });
      }
    }

    const purchase = await Purchase.create({ ...rest, items });
    res.status(201).json(purchase);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE — reverse stock
router.delete('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ error: 'Not found' });

    for (const item of purchase.items) {
      await Product.findOneAndUpdate(
        { name: new RegExp(`^${item.name}$`, 'i') },
        { $inc: { stock: -item.qty } }
      );
    }

    await purchase.deleteOne();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /:id/paid
router.patch('/:id/paid', async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ error: 'Not found' });

    purchase.paid = Number(req.body.paid ?? purchase.paid);
    purchase.status = deriveStatus(purchase.total, purchase.paid);
    await purchase.save();
    res.json(purchase);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;

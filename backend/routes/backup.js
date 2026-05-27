const router = require('express').Router();
const Product  = require('../models/Product');
const Sale     = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Payment  = require('../models/Payment');
const Expense  = require('../models/Expense');
const Settings = require('../models/Settings');
const Session  = require('../models/Session');

// GET — full data export
router.get('/', async (req, res) => {
  try {
    const [products, sales, purchases, payments, expenses, settings, sessions] = await Promise.all([
      Product.find(), Sale.find(), Purchase.find(), Payment.find(),
      Expense.find(), Settings.findOne(), Session.find(),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      products, sales, purchases, payments, expenses,
      settings: settings || {},
      sessions,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST — restore from backup (wipes existing data)
router.post('/restore', async (req, res) => {
  try {
    const { products = [], sales = [], purchases = [], payments = [],
            expenses = [], settings = {}, sessions = [] } = req.body;

    await Promise.all([
      Product.deleteMany({}), Sale.deleteMany({}), Purchase.deleteMany({}),
      Payment.deleteMany({}), Expense.deleteMany({}),
      Settings.deleteMany({}), Session.deleteMany({}),
    ]);

    await Promise.all([
      products.length  && Product.insertMany(products),
      sales.length     && Sale.insertMany(sales),
      purchases.length && Purchase.insertMany(purchases),
      payments.length  && Payment.insertMany(payments),
      expenses.length  && Expense.insertMany(expenses),
      Object.keys(settings).length && Settings.create(settings),
      sessions.length  && Session.insertMany(sessions),
    ]);

    res.json({ ok: true, restoredAt: new Date().toISOString() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

const router = require('express').Router();
const Session = require('../models/Session');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

// GET all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ date: -1 });
    res.json(sessions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST — open a new session for today
router.post('/', async (req, res) => {
  try {
    const { date, opening = 0 } = req.body;
    const existing = await Session.findOne({ date, status: 'open' });
    if (existing) return res.status(409).json({ error: 'A session is already open for this date' });

    const session = await Session.create({ date, opening, status: 'open', openedAt: new Date() });
    res.status(201).json(session);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PATCH /:date/close — compute totals and close session
router.patch('/:date/close', async (req, res) => {
  try {
    const session = await Session.findOne({ date: req.params.date, status: 'open' });
    if (!session) return res.status(404).json({ error: 'No open session for this date' });

    const date = req.params.date;

    const sales     = await Sale.find({ date });
    const purchases = await Purchase.find({ date });
    const custPays  = await Payment.find({ date, type: 'customer' });
    const suppPays  = await Payment.find({ date, type: 'supplier' });
    const expenses  = await Expense.find({ date });

    const cashSales       = sales.reduce((s, x) => s + (x.paid || 0), 0);
    const custPayments    = custPays.reduce((s, x) => s + x.amount, 0);
    const supplierCashOut = suppPays.reduce((s, x) => s + x.amount, 0);
    const expensesTotal   = expenses.reduce((s, x) => s + x.amount, 0);
    const netFlow         = session.opening + cashSales + custPayments - supplierCashOut - expensesTotal;

    const totalSaleRevenue = sales.reduce((s, x) => s + x.total, 0);
    const totalCost        = sales.reduce((s, x) => s + x.items.reduce((a, i) => a + (i.cost * i.qty || 0), 0), 0);
    const dayProfit        = totalSaleRevenue - totalCost - expensesTotal;

    const outstandingToday = sales.reduce((s, x) => s + (x.total - x.paid), 0);

    session.cashSales       = cashSales;
    session.custPayments    = custPayments;
    session.supplierCashOut = supplierCashOut;
    session.expensesTotal   = expensesTotal;
    session.netFlow         = netFlow;
    session.dayProfit       = dayProfit;
    session.outstandingToday = outstandingToday;
    session.salesCount      = sales.length;
    session.purchasesCount  = purchases.length;
    session.closing         = req.body.closing ?? netFlow;
    session.status          = 'closed';
    session.closedAt        = new Date();

    await session.save();
    res.json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /:date/reopen
router.patch('/:date/reopen', async (req, res) => {
  try {
    const session = await Session.findOne({ date: req.params.date, status: 'closed' });
    if (!session) return res.status(404).json({ error: 'No closed session for this date' });

    session.status   = 'open';
    session.closedAt = null;
    session.closing  = null;
    await session.save();
    res.json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

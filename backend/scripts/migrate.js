require('dotenv').config();
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');

const Product  = require('../models/Product');
const Sale     = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Payment  = require('../models/Payment');
const Expense  = require('../models/Expense');
const Settings = require('../models/Settings');
const Session  = require('../models/Session');

const backupFile = path.join(__dirname, '../../ammar_surgical_backup_2026-05-27 (1).json');
const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Wipe existing data
  await Promise.all([
    Product.deleteMany({}), Sale.deleteMany({}), Purchase.deleteMany({}),
    Payment.deleteMany({}), Expense.deleteMany({}),
    Settings.deleteMany({}), Session.deleteMany({}),
  ]);
  console.log('Cleared existing collections');

  // --- Products ---
  // Build old-id → new ObjectId map for wiring up sale items
  const idMap = {};
  for (const p of data.products) {
    const doc = await Product.create({
      name: p.name, stock: p.stock, minStock: p.minStock, cost: p.cost, sale: p.sale,
    });
    idMap[p.id] = doc._id;
  }
  console.log(`Inserted ${data.products.length} products`);

  // --- Sales ---
  // insertMany skips pre-save hooks, so we pass invoiceNo explicitly
  const sales = data.sales.map(s => ({
    invoiceNo: s.invoiceNo,
    customer:  s.customer,
    date:      s.date,
    total:     s.total,
    paid:      s.paid,
    note:      s.note || '',
    status:    s.status,
    items: s.items.map(i => ({
      productId: idMap[i.productId] || null,
      name:      i.name,
      qty:       i.qty,
      price:     i.price,
      cost:      i.cost,
      total:     i.total,
    })),
  }));
  await Sale.insertMany(sales, { ordered: true });
  console.log(`Inserted ${sales.length} sales`);

  // --- Purchases ---
  const purchases = data.purchases.map(p => ({
    purchaseNo: p.purchaseNo,
    supplier:   p.supplier,
    date:       p.date,
    total:      p.total,
    paid:       p.paid,
    note:       p.note || '',
    status:     p.status,
    items: p.items.map(i => ({
      name:  i.name,
      qty:   i.qty,
      cost:  i.cost,
      total: i.total,
    })),
  }));
  await Purchase.insertMany(purchases, { ordered: true });
  console.log(`Inserted ${purchases.length} purchases`);

  // --- Payments ---
  const payments = data.payments.map(p => ({
    type:   p.type,
    party:  p.party,
    amount: p.amount,
    date:   p.date,
    note:   p.note || '',
  }));
  if (payments.length) await Payment.insertMany(payments);
  console.log(`Inserted ${payments.length} payments`);

  // --- Expenses ---
  const expenses = data.expenses.map(e => ({
    date:     e.date,
    category: e.category || '',
    desc:     e.desc || '',
    amount:   e.amount,
  }));
  if (expenses.length) await Expense.insertMany(expenses);
  console.log(`Inserted ${expenses.length} expenses`);

  // --- Settings ---
  const s = data.settings;
  await Settings.create({
    businessName: s.businessName,
    businessSub:  s.businessSub  || '',
    address:      s.address      || '',
    phone:        s.phone        || '',
    autoBackup:   s.autoBackup   || false,
    lastBackup:   s.lastBackup   ? new Date(s.lastBackup) : null,
  });
  console.log('Inserted settings');

  // --- Sessions (from closedDays) ---
  const sessions = (data.closedDays || []).map(d => ({
    date:            d.date,
    status:          d.status,
    opening:         d.opening,
    closing:         d.closing,
    openedAt:        d.openedAt  ? new Date(d.openedAt)  : null,
    closedAt:        d.closedAt  ? new Date(d.closedAt)  : null,
    cashSales:       d.cashSales,
    custPayments:    d.custPayments,
    supplierCashOut: d.supplierCashOut,
    expensesTotal:   d.expensesTotal,
    netFlow:         d.netFlow,
    dayProfit:       d.dayProfit,
    outstandingToday:d.outstandingToday,
    salesCount:      d.salesCount,
    purchasesCount:  d.purchasesCount,
  }));
  if (sessions.length) await Session.insertMany(sessions);
  console.log(`Inserted ${sessions.length} sessions`);

  console.log('\nMigration complete.');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });

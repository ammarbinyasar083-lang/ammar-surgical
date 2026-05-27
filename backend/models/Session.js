const { Schema, model } = require('mongoose');

// One doc per business day. status: 'open' | 'closed'
const sessionSchema = new Schema({
  date:            { type: String, required: true },  // YYYY-MM-DD
  status:          { type: String, enum: ['open', 'closed'], default: 'open' },
  opening:         { type: Number, default: 0 },
  closing:         { type: Number, default: null },
  openedAt:        { type: Date, default: Date.now },
  closedAt:        { type: Date, default: null },
  cashSales:       { type: Number, default: 0 },
  custPayments:    { type: Number, default: 0 },
  supplierCashOut: { type: Number, default: 0 },
  expensesTotal:   { type: Number, default: 0 },
  netFlow:         { type: Number, default: 0 },
  dayProfit:       { type: Number, default: 0 },
  outstandingToday:{ type: Number, default: 0 },
  salesCount:      { type: Number, default: 0 },
  purchasesCount:  { type: Number, default: 0 },
}, { timestamps: true });

module.exports = model('Session', sessionSchema);

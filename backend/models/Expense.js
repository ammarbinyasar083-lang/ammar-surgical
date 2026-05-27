const { Schema, model } = require('mongoose');

const expenseSchema = new Schema({
  date:     { type: String, required: true },   // YYYY-MM-DD
  category: { type: String, default: '' },
  desc:     { type: String, default: '' },
  amount:   { type: Number, required: true },
}, { timestamps: true });

module.exports = model('Expense', expenseSchema);

const { Schema, model } = require('mongoose');

const paymentSchema = new Schema({
  type:   { type: String, enum: ['customer', 'supplier'], required: true },
  party:  { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  date:   { type: String, required: true },   // YYYY-MM-DD
  note:   { type: String, default: '' },
}, { timestamps: true });

module.exports = model('Payment', paymentSchema);

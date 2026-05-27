const { Schema, model } = require('mongoose');

// Purchase items don't carry a productId — matched by name at stock-update time
const purchaseItemSchema = new Schema({
  name:  { type: String, required: true },
  qty:   { type: Number, required: true },
  cost:  { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const purchaseSchema = new Schema({
  purchaseNo: { type: String, unique: true },
  supplier:   { type: String, required: true, trim: true },
  date:       { type: String, required: true },   // YYYY-MM-DD
  items:      [purchaseItemSchema],
  total:      { type: Number, required: true },
  paid:       { type: Number, default: 0 },
  note:       { type: String, default: '' },
  status:     { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
}, { timestamps: true });

purchaseSchema.pre('save', async function (next) {
  if (this.isNew && !this.purchaseNo) {
    const count = await this.constructor.countDocuments();
    this.purchaseNo = 'PUR-' + String(count + 1).padStart(4, '0');
  }
  this.status = deriveStatus(this.total, this.paid);
  next();
});

purchaseSchema.methods.recompute = function () {
  this.status = deriveStatus(this.total, this.paid);
};

function deriveStatus(total, paid) {
  paid = Number(paid || 0); total = Number(total || 0);
  if (paid <= 0) return 'unpaid';
  if (paid + 0.01 >= total) return 'paid';
  return 'partial';
}

module.exports = model('Purchase', purchaseSchema);

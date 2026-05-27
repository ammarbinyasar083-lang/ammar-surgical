const { Schema, model } = require('mongoose');

const saleItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  name:  { type: String, required: true },
  qty:   { type: Number, required: true },
  price: { type: Number, required: true },
  cost:  { type: Number, default: 0 },
  total: { type: Number, required: true },
}, { _id: false });

const saleSchema = new Schema({
  invoiceNo: { type: String, unique: true },
  customer:  { type: String, required: true, trim: true },
  date:      { type: String, required: true },   // YYYY-MM-DD
  items:     [saleItemSchema],
  total:     { type: Number, required: true },
  paid:      { type: Number, default: 0 },
  note:      { type: String, default: '' },
  status:    { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
}, { timestamps: true });

// Auto-generate invoiceNo before saving
saleSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNo) {
    const count = await this.constructor.countDocuments();
    this.invoiceNo = 'INV-' + String(count + 1).padStart(4, '0');
  }
  this.status = deriveStatus(this.total, this.paid);
  next();
});

saleSchema.methods.recompute = function () {
  this.status = deriveStatus(this.total, this.paid);
};

function deriveStatus(total, paid) {
  paid = Number(paid || 0); total = Number(total || 0);
  if (paid <= 0) return 'unpaid';
  if (paid + 0.01 >= total) return 'paid';
  return 'partial';
}

module.exports = model('Sale', saleSchema);

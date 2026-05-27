const { Schema, model } = require('mongoose');

const productSchema = new Schema({
  name:     { type: String, required: true, trim: true },
  stock:    { type: Number, default: 0 },
  minStock: { type: Number, default: 10 },
  cost:     { type: Number, default: 0 },
  sale:     { type: Number, default: 0 },
}, { timestamps: true });

module.exports = model('Product', productSchema);

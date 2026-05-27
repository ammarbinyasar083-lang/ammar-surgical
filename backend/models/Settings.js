const { Schema, model } = require('mongoose');

// Single document — always upserted, never more than one
const settingsSchema = new Schema({
  businessName: { type: String, default: 'Ammar Surgical & Diagnostic' },
  businessSub:  { type: String, default: 'Diagnostic & Wholesale Suite' },
  address:      { type: String, default: '' },
  phone:        { type: String, default: '' },
  autoBackup:   { type: Boolean, default: false },
  lastBackup:   { type: Date, default: null },
}, { timestamps: true });

module.exports = model('Settings', settingsSchema);

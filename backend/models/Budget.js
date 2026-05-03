const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Transport', 'Housing', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Utilities', 'Travel', 'Other']
  },
  limit: { type: Number, required: true, min: 0 },
  period: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  month: { type: Number, min: 1, max: 12 },
  year: { type: Number },
  alertThreshold: { type: Number, default: 80, min: 0, max: 100 },
  color: { type: String, default: '#6366f1' }
}, { timestamps: true });

budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);

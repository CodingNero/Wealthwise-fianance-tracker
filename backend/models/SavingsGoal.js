const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, default: 0, min: 0 },
  deadline: { type: Date },
  category: {
    type: String,
    enum: ['Emergency Fund', 'Vacation', 'Education', 'Home', 'Car', 'Retirement', 'Investment', 'Other'],
    default: 'Other'
  },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  color: { type: String, default: '#10b981' },
  icon: { type: String, default: '🎯' },
  isCompleted: { type: Boolean, default: false },
  notes: { type: String, trim: true },
  contributions: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true }
  }]
}, { timestamps: true });

savingsGoalSchema.virtual('progressPercent').get(function() {
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

savingsGoalSchema.virtual('remaining').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

savingsGoalSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);

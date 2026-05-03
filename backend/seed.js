/**
 * Demo Data Seed Script
 * Run: node backend/seed.js
 * Creates a demo user + 6 months of realistic transactions, budgets, and savings goals
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker';

// Inline minimal schemas to avoid import issues
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  currency: { type: String, default: 'USD' }, monthlyIncome: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const expenseSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId, title: String, amount: Number,
  category: String, type: { type: String, default: 'expense' },
  date: { type: Date, default: Date.now }, notes: String
}, { timestamps: true });
const budgetSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId, category: String, limit: Number,
  period: { type: String, default: 'monthly' }, month: Number, year: Number,
  alertThreshold: { type: Number, default: 80 }, color: String
}, { timestamps: true });
const savingsSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId, title: String, targetAmount: Number,
  currentAmount: { type: Number, default: 0 }, deadline: Date, category: String,
  priority: { type: String, default: 'medium' }, color: String, icon: String,
  isCompleted: { type: Boolean, default: false }, notes: String,
  contributions: [{ amount: Number, date: { type: Date, default: Date.now }, note: String }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const Budget = mongoose.model('Budget', budgetSchema);
const SavingsGoal = mongoose.model('SavingsGoal', savingsSchema);

const DEMO = { name: 'Sarah Smith', email: 'sarah@wealthwise.app', password: 'password123', monthlyIncome: 8000 };

const EXPENSES_TEMPLATES = [
  { title: 'Grocery Store', category: 'Food', min: 60, max: 180 },
  { title: 'Restaurant Lunch', category: 'Food', min: 15, max: 45 },
  { title: 'Coffee Shop', category: 'Food', min: 5, max: 18 },
  { title: 'Uber', category: 'Transport', min: 12, max: 35 },
  { title: 'Gas Station', category: 'Transport', min: 40, max: 80 },
  { title: 'Rent', category: 'Housing', min: 1200, max: 1200 },
  { title: 'Electricity Bill', category: 'Utilities', min: 60, max: 110 },
  { title: 'Internet Bill', category: 'Utilities', min: 55, max: 55 },
  { title: 'Netflix', category: 'Entertainment', min: 15, max: 15 },
  { title: 'Spotify', category: 'Entertainment', min: 10, max: 10 },
  { title: 'Cinema', category: 'Entertainment', min: 18, max: 30 },
  { title: 'Amazon Order', category: 'Shopping', min: 25, max: 120 },
  { title: 'Clothing Store', category: 'Shopping', min: 40, max: 150 },
  { title: 'Gym Membership', category: 'Healthcare', min: 35, max: 35 },
  { title: 'Pharmacy', category: 'Healthcare', min: 15, max: 60 },
  { title: 'Online Course', category: 'Education', min: 29, max: 99 },
  { title: 'Books', category: 'Education', min: 15, max: 40 },
  { title: 'Flight Ticket', category: 'Travel', min: 120, max: 450 },
];

const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randDate = (year, month) => {
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clean existing demo user
  const existing = await User.findOne({ email: DEMO.email });
  if (existing) {
    await Expense.deleteMany({ user: existing._id });
    await Budget.deleteMany({ user: existing._id });
    await SavingsGoal.deleteMany({ user: existing._id });
    await User.deleteOne({ _id: existing._id });
    console.log('🗑️  Cleared old demo data');
  }

  const hashedPw = await bcrypt.hash(DEMO.password, 12);
  const user = await User.create({ ...DEMO, password: hashedPw });
  console.log(`👤 Created demo user: ${DEMO.email} / ${DEMO.password}`);

  const now = new Date();
  const expenseDocs = [];

  // 6 months of data
  for (let m = 5; m >= 0; m--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    // Salary income
    expenseDocs.push({ user: user._id, title: 'Monthly Salary', amount: DEMO.monthlyIncome, category: 'Other', type: 'income', date: new Date(year, month, 1), notes: 'Regular salary' });

    // Occasional freelance
    if (Math.random() > 0.5) {
      expenseDocs.push({ user: user._id, title: 'Freelance Project', amount: rand(300, 800), category: 'Other', type: 'income', date: randDate(year, month), notes: 'Side project income' });
    }

    // Generate 15-25 expenses per month
    const count = Math.floor(Math.random() * 10) + 15;
    const chosen = [...EXPENSES_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, count);
    chosen.forEach(t => {
      expenseDocs.push({ user: user._id, title: t.title, amount: rand(t.min, t.max), category: t.category, type: 'expense', date: randDate(year, month) });
    });

    // Always include rent
    if (!chosen.find(c => c.title === 'Rent')) {
      expenseDocs.push({ user: user._id, title: 'Rent', amount: 1200, category: 'Housing', type: 'expense', date: new Date(year, month, 1) });
    }
  }

  await Expense.insertMany(expenseDocs);
  console.log(`💸 Inserted ${expenseDocs.length} transactions`);

  // Current month budgets
  const cm = now.getMonth() + 1;
  const cy = now.getFullYear();
  const budgets = [
    { category: 'Food', limit: 600, color: '#fb923c' },
    { category: 'Transport', limit: 250, color: '#60a5fa' },
    { category: 'Housing', limit: 1300, color: '#a78bfa' },
    { category: 'Entertainment', limit: 150, color: '#facc15' },
    { category: 'Shopping', limit: 300, color: '#f97316' },
    { category: 'Utilities', limit: 180, color: '#94a3b8' },
    { category: 'Healthcare', limit: 200, color: '#34d399' },
    { category: 'Education', limit: 100, color: '#0ea5e9' },
  ];
  await Budget.insertMany(budgets.map(b => ({ ...b, user: user._id, period: 'monthly', month: cm, year: cy, alertThreshold: 80 })));
  console.log(`📋 Inserted ${budgets.length} budgets`);

  // Savings goals
  const goals = [
    { title: 'Emergency Fund', targetAmount: 10000, currentAmount: 3200, category: 'Emergency Fund', priority: 'high', color: '#34d399', icon: '🛡️', notes: '3 months of expenses target', contributions: [{ amount: 500, note: 'Jan deposit' }, { amount: 500, note: 'Feb deposit' }, { amount: 400, note: 'Mar deposit' }] },
    { title: 'Europe Trip 2025', targetAmount: 4500, currentAmount: 1800, category: 'Vacation', priority: 'medium', color: '#60a5fa', icon: '✈️', deadline: new Date(now.getFullYear(), now.getMonth() + 6, 1), notes: 'Paris and Rome itinerary', contributions: [{ amount: 600, note: 'Initial' }, { amount: 600, note: 'Month 2' }, { amount: 600, note: 'Month 3' }] },
    { title: 'New MacBook Pro', targetAmount: 2500, currentAmount: 2500, category: 'Other', priority: 'medium', color: '#7c6af7', icon: '💻', isCompleted: true, notes: 'For remote work setup', contributions: [{ amount: 2500, note: 'Saved up!' }] },
    { title: 'Investment Portfolio', targetAmount: 20000, currentAmount: 5400, category: 'Investment', priority: 'high', color: '#f87171', icon: '📈', deadline: new Date(now.getFullYear() + 2, 0, 1), notes: 'Long-term wealth building', contributions: [{ amount: 1000, note: 'Q1' }, { amount: 1200, note: 'Q2' }] },
    { title: 'Home Down Payment', targetAmount: 50000, currentAmount: 12000, category: 'Home', priority: 'high', color: '#fbbf24', icon: '🏠', deadline: new Date(now.getFullYear() + 3, 0, 1), notes: '20% down payment goal' },
  ];
  await SavingsGoal.insertMany(goals.map(g => ({ ...g, user: user._id })));
  console.log(`🎯 Inserted ${goals.length} savings goals`);

  console.log('\n🎉 Seed complete!');
  console.log(`📧 Login: ${DEMO.email}`);
  console.log(`🔑 Password: ${DEMO.password}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });

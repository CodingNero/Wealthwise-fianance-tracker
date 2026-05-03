const express = require('express');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all expenses with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { category, type, startDate, endDate, limit = 50, page = 1, sort = '-date' } = req.query;
    const query = { user: req.user._id };

    if (category) query.category = category;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ expenses, total, pages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get expense summary/analytics — uses aggregation to avoid N+1
router.get('/summary', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Current month totals
    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);

    const byCategory = {};
    expenses.filter(e => e.type === 'expense').forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    // Last 6 months trend — single aggregation query
    const trendStart = new Date(targetYear, targetMonth - 7, 1);
    const trendEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const trendRaw = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: trendStart, $lte: trendEnd }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Build trend map
    const trendMap = {};
    trendRaw.forEach(({ _id, total }) => {
      const key = `${_id.year}-${_id.month}`;
      if (!trendMap[key]) trendMap[key] = { income: 0, expenses: 0 };
      trendMap[key][_id.type === 'income' ? 'income' : 'expenses'] += total;
    });

    // Fill last 6 months in order
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetYear, targetMonth - 1 - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      trendData.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        expenses: trendMap[key]?.expenses || 0,
        income: trendMap[key]?.income || 0
      });
    }

    res.json({ totalExpenses, totalIncome, netSavings: totalIncome - totalExpenses, byCategory, trendData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create expense
router.post('/', auth, async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, user: req.user._id });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

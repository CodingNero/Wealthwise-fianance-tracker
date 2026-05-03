const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all budgets with current spending
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month: targetMonth, year: targetYear });

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
      const expenses = await Expense.find({
        user: req.user._id,
        category: budget.category,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      });
      const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const percentage = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;
      return {
        ...budget.toObject(),
        spent,
        remaining: Math.max(0, budget.limit - spent),
        percentage,
        isOverBudget: spent > budget.limit,
        isAlertThreshold: percentage >= budget.alertThreshold
      };
    }));

    res.json(budgetsWithSpending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update budget
router.post('/', auth, async (req, res) => {
  try {
    const { category, limit, period, month, year, alertThreshold, color } = req.body;
    const now = new Date();
    const budgetMonth = month || now.getMonth() + 1;
    const budgetYear = year || now.getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month: budgetMonth, year: budgetYear },
      { limit, period, alertThreshold, color, month: budgetMonth, year: budgetYear },
      { new: true, upsert: true }
    );
    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

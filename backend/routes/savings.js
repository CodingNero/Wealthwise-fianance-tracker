const express = require('express');
const SavingsGoal = require('../models/SavingsGoal');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all savings goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id }).sort('-createdAt');
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create savings goal
router.post('/', auth, async (req, res) => {
  try {
    const goal = await SavingsGoal.create({ ...req.body, user: req.user._id });
    res.status(201).json(goal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add contribution to goal
router.post('/:id/contribute', auth, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.currentAmount += parseFloat(amount);
    goal.contributions.push({ amount, note });
    if (goal.currentAmount >= goal.targetAmount) goal.isCompleted = true;

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update savings goal
router.put('/:id', auth, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete savings goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

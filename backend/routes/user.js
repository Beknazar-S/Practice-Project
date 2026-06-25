const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/user/profile
router.get('/profile', protect, async (req, res, next) => {
  try {
    const [taskCount, projectCount, completedTasks] = await Promise.all([
      Task.countDocuments({ owner: req.user._id }),
      Project.countDocuments({ owner: req.user._id }),
      Task.countDocuments({ owner: req.user._id, status: 'completed' }),
    ]);

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        preferences: req.user.preferences,
        createdAt: req.user.createdAt,
      },
      stats: { taskCount, projectCount, completedTasks },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/preferences
router.put('/preferences', protect, async (req, res, next) => {
  try {
    const { theme, defaultView } = req.body;
    const update = {};
    if (theme) update['preferences.theme'] = theme;
    if (defaultView) update['preferences.defaultView'] = defaultView;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ success: true, preferences: user.preferences });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

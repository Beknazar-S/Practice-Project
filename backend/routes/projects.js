const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, projectSchema } = require('../middleware/validate');
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/projects?search=&status=&page=1&limit=20
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    const filter = { owner: req.user._id };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      projects,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects
router.post('/', protect, validate(projectSchema), async (req, res, next) => {
  try {
    const project = await Project.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await Task.updateMany({ project: req.params.id }, { project: null });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

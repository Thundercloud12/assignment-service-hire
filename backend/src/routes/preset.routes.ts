import { Router } from 'express';
import { FilterPreset } from '../models/FilterPreset';
import { authMiddleware } from '../middleware/auth.middleware';
import { ApiError } from '../errors/ApiError';

export const presetRouter = Router();

presetRouter.use(authMiddleware);

// Get all saved filter presets for the current user
presetRouter.get('/', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const presets = await FilterPreset.find({ userId: req.user.id })
      .sort({ isFavorite: -1, createdAt: -1 });

    res.json({
      success: true,
      data: presets,
    });
  } catch (error) {
    next(error);
  }
});

// Save a new filter preset or update an existing one
presetRouter.post('/', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { name, filters, isFavorite } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ApiError('Preset name is required', 400);
    }

    if (!filters || typeof filters !== 'object') {
      throw new ApiError('Filters configuration is required', 400);
    }

    // Check if preset with the same name already exists for this user to update it
    let preset = await FilterPreset.findOne({ userId: req.user.id, name: name.trim() });

    if (preset) {
      preset.filters = filters;
      if (typeof isFavorite === 'boolean') {
        preset.isFavorite = isFavorite;
      }
      await preset.save();
    } else {
      preset = await FilterPreset.create({
        userId: req.user.id,
        name: name.trim(),
        filters,
        isFavorite: isFavorite || false,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Preset saved successfully',
      data: preset,
    });
  } catch (error) {
    next(error);
  }
});

// Delete a saved filter preset
presetRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { id } = req.params;
    const preset = await FilterPreset.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!preset) {
      throw new ApiError('Preset not found or unauthorized', 404);
    }

    res.json({
      success: true,
      message: 'Preset deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

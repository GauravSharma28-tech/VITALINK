import mongoose from 'mongoose';

const rangeSchema = new mongoose.Schema({
  min: Number,
  max: Number,
});

const thresholdSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  temperature: {
    mode: String,
    min: Number,
    max: Number,
  },
  heartRate: {
    mode: String,
    min: Number,
    max: Number,
  },
  geofence: {
    threshold: Number,
  },
  updatedAt: Date,
});

export const ThresholdModel = mongoose.model('Threshold', thresholdSchema);

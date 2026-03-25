import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  cattleId: { type: Number, required: true },
  message: { type: String, required: true },
  status: { type: String, required: true }, // e.g., 'unsafe', 'geofence'
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now, required: true },
});

export default mongoose.model('Notification', notificationSchema); 
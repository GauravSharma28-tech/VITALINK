import mongoose from 'mongoose';

const receiverConfigSchema = new mongoose.Schema({
  zoneName: { type: String, required: true, unique: true },
  zoneId: { type: Number, required: true, unique: true },
  receiverId: { type: Number, required: true, unique: true },
});

export const ConfigurationsModel = mongoose.model(
  'Configurations',
  receiverConfigSchema
);

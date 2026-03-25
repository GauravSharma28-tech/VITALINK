import { spawn } from 'child_process';
import mongoose from 'mongoose';

const cattleSchema = new mongoose.Schema(
  {
    cattleId: {
      type: Number,
      required: true,
      unique: true,
    },

    deviceId: {
      type: Number,
      required: false,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const Cattle = mongoose.model('Cattle', cattleSchema);
export default Cattle;

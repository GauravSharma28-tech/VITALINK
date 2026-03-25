import mongoose from 'mongoose';

const gpsLocation = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
  },

  longitude: {
    type: Number,
    required: true,
  },
});

const sensorDataSchema = new mongoose.Schema(
  {
    deviceId: {
      type: Number,
      required: true,
    },

    heartRate: {
      type: Number,
      required: true,
    },

    temperature: {
      type: Number,
      required: true,
    },

    gpsLocation: {
      type: gpsLocation,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const sensorData = mongoose.model('sensorData', sensorDataSchema);
export default sensorData;

import { ThresholdModel } from '../model/sensorThresholdModel';

module.exports.get = async (req: any, res: any) => {
  try {
    const thresholds = await ThresholdModel.findById('global');
    if (!thresholds) {
      return res.status(404).json({ message: 'Thresholds not found' });
    }
    res.status(200).json(thresholds);
  } catch (error: any) {
    res.status(500).json({
      message: 'Error fetching thresholds',
      error: error.message,
    });
  }
};

module.exports.update = async (req: any, res: any) => {
  const { temperature, heartRate, geofence } = req.body;

  try {
    const updatedThresholds = await ThresholdModel.findByIdAndUpdate(
      'global',
      {
        $set: {
          temperature,
          heartRate,
          geofence,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
    res.status(200).json(updatedThresholds);
  } catch (error: any) {
    res.status(500).json({
      message: 'Error updating thresholds',
      error: error.message,
    });
  }
};

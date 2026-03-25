import cattle from '../model/cattle';
import sensorData from '../model/sensorData';
import { CattleSensorData } from '../services/controls';
import { mqttClient } from '../services/mqttClient';

module.exports.getAll = async (req: any, res: any) => {
  try {
    const memoryData = mqttClient.getLatestUpdate(); // { deviceId1: {...}, deviceId2: {...}, ... }

    // Step 1: Get the latest sensor data per deviceId from the DB
    let dbSensorData = await sensorData.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$deviceId',
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);

    // Step 2: Replace DB entries with in-memory MQTT data if available
    const mergedSensorData = dbSensorData.map((dbDoc) => {
      const memDoc = memoryData[dbDoc.deviceId];
      return memDoc ? memDoc : dbDoc;
    });

    // Step 3: Get all cattle info and create a Map for fast lookup
    const cattleList = await cattle.find();
    const cattleMap = new Map(cattleList.map((c) => [c.deviceId, c]));

    // Step 4: Enrich sensor data with cattle info and sensor status/action
    const result = await Promise.all(
      mergedSensorData.map(async (sensor) => {
        const deviceId = sensor.deviceId;
        const cattleInfo = cattleMap.get(deviceId);
        // console.log(sensor);

        let locationStatus = 'UNKNOWN';
        try {
          if (
            sensor &&
            typeof sensor.gpsLocation?.latitude === 'number' &&
            typeof sensor.gpsLocation?.longitude === 'number'
          ) {
            locationStatus = await CattleSensorData.cattleZoneType(sensor);
          }
        } catch (err) {
          console.error(`Error determining zone for device ${deviceId}:`, err);
        }

        return {
          ...sensor,
          cattleId: cattleInfo ? cattleInfo.cattleId : null,
          locationStatus,
        };
      })
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cattle data' });
  }
};

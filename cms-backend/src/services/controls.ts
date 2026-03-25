import latestSensorData from '../model/sensorData';
import geoFenceController = require('../controller/geoFenceController');
import geoFenceModel from '../model/geoFenceModel';
import sensorData from '../model/sensorData';
import Notification from '../model/notificationModel';
import { getSocketIOInstance } from '../socket';
import { ThresholdModel } from '../model/sensorThresholdModel';
import cattle from '../model/cattle';

export enum ZoneStatus {
  Safe = 'SAFE',
  Warning = 'WARNING',
  Danger = 'DANGER',
  Unknown = 'UNKNOWN',
}

export enum HeartRateStatus {
  Safe = 'SAFE',
  Danger = 'DANGER',
}

export enum TemperatureStatus {
  Safe = 'SAFE',
  Danger = 'DANGER',
}

interface SensorDataInterface {
  deviceId: number;
  heartRate: number;
  temperature: number;
  gpsLocation?: {
    longitude: number;
    latitude: number;
  };
}

export class CattleSensorData {
  private static getThresholdValue = async () => {
    const threshold = await ThresholdModel.findById('global');
    if (!threshold) {
      throw new Error('Thresholds not found');
    }
    return threshold;
  };

  // ─── READ-ONLY safety status (for API endpoints) ───
  // Does NOT create any notifications. Safe to call from any API route.
  public static saftyStatus = async (sensor: SensorDataInterface) => {
    if (!sensor) {
      return 'no-data';
    }
    const cattleHeartRateStatus = await this.isHeartRateSafe(sensor);
    const cattleTemperatureStatus = await this.isTemperatureSafe(sensor);
    const cattleLocationStatus = await this.getZoneStatus(sensor);

    if (
      cattleHeartRateStatus === HeartRateStatus.Safe &&
      cattleTemperatureStatus === TemperatureStatus.Safe &&
      cattleLocationStatus === ZoneStatus.Safe
    ) {
      return 'safe';
    }
    return 'unsafe';
  };

  // ─── MQTT-ONLY safety status (creates ONE combined notification) ───
  // Call this ONLY from the MQTT message handler, not from API endpoints.
  public static saftyStatusWithNotify = async (sensor: SensorDataInterface) => {
    if (!sensor) {
      return 'no-data';
    }
    const cattleHeartRateStatus = await this.isHeartRateSafe(sensor);
    const cattleTemperatureStatus = await this.isTemperatureSafe(sensor);
    const cattleLocationStatus = await this.getZoneStatus(sensor);

    // Collect all issues into one combined notification
    const issues: string[] = [];
    let worstStatus: 'DANGER' | 'WARNING' = 'WARNING';

    if (cattleHeartRateStatus === HeartRateStatus.Danger) {
      issues.push('abnormal heart rate');
      worstStatus = 'DANGER';
    }

    if (cattleTemperatureStatus === TemperatureStatus.Danger) {
      issues.push('abnormal temperature');
      worstStatus = 'DANGER';
    }

    if (cattleLocationStatus === ZoneStatus.Danger) {
      issues.push('in danger zone or outside safe zones');
      worstStatus = 'DANGER';
    } else if (cattleLocationStatus === ZoneStatus.Warning) {
      issues.push('near zone boundary');
    }

    // Emit a SINGLE combined notification if there are any issues
    if (issues.length > 0) {
      const message = `Cattle ${sensor.deviceId}: ${issues.join(', ')}.`;
      await this.createAndEmitNotification(sensor.deviceId, message, worstStatus);
    }

    if (
      cattleHeartRateStatus === HeartRateStatus.Safe &&
      cattleTemperatureStatus === TemperatureStatus.Safe &&
      cattleLocationStatus === ZoneStatus.Safe
    ) {
      return 'safe';
    }
    return 'unsafe';
  };

  // Check if the temperature is safe for a specific cattle
  public static isTemperatureSafe = async (
    latestSensorData: SensorDataInterface
  ): Promise<TemperatureStatus> => {
    const threshold = await this.getThresholdValue();
    if (!threshold) {
      throw new Error('Thresholds not found');
    }
    if (!latestSensorData) {
      return TemperatureStatus.Danger;
    } else if (
      latestSensorData.temperature >= (threshold?.temperature?.min || 0) &&
      latestSensorData.temperature <= (threshold?.temperature?.max || 0)
    ) {
      return TemperatureStatus.Safe;
    }
    return TemperatureStatus.Danger;
  };

  public static isHeartRateSafe = async (
    latestSensorData: SensorDataInterface
  ): Promise<HeartRateStatus> => {
    const threshold = await this.getThresholdValue();
    if (!threshold) {
      throw new Error('Thresholds not found');
    }

    if (!latestSensorData) {
      return HeartRateStatus.Danger;
    } else if (
      latestSensorData.heartRate >= (threshold?.heartRate?.min || 0) &&
      latestSensorData.heartRate <= (threshold?.heartRate?.max || 0)
    ) {
      return HeartRateStatus.Safe;
    }
    return HeartRateStatus.Danger;
  };

  // ─── READ-ONLY zone status (no notifications) ───
  // Used by API endpoints and by saftyStatus
  public static getZoneStatus = async (
    latestSensorData: SensorDataInterface
  ): Promise<ZoneStatus> => {
    const threshold = await this.getThresholdValue();
    const warningBuffer = threshold?.geofence?.threshold || 0;

    const geoFences = await geoFenceModel.find();
    if (geoFences.length === 0) return ZoneStatus.Safe;

    if (!latestSensorData?.gpsLocation) return ZoneStatus.Unknown;

    let isInSafe = false;
    let isInWarning = false;

    // First check all danger zones
    for (const geoFence of geoFences.filter((g) => g.zoneType === 'danger')) {
      const distance = this.findDistance(
        latestSensorData.gpsLocation.latitude,
        geoFence.latitude,
        latestSensorData.gpsLocation.longitude,
        geoFence.longitude
      );
      if (distance <= geoFence.radius) {
        return ZoneStatus.Danger;
      }
      if (distance <= geoFence.radius + warningBuffer) {
        isInWarning = true;
      }
    }

    // Then check safe zones
    for (const geoFence of geoFences.filter((g) => g.zoneType === 'safe')) {
      const distance = this.findDistance(
        latestSensorData.gpsLocation.latitude,
        geoFence.latitude,
        latestSensorData.gpsLocation.longitude,
        geoFence.longitude
      );
      if (distance <= geoFence.radius - warningBuffer) {
        isInSafe = true;
      } else if (distance <= geoFence.radius) {
        isInWarning = true;
      }
    }

    if (isInWarning) return ZoneStatus.Warning;
    if (isInSafe) return ZoneStatus.Safe;

    return ZoneStatus.Danger;
  };

  // Keep the old name as an alias so existing API code that calls cattleZoneType still works
  public static cattleZoneType = CattleSensorData.getZoneStatus;

  private static NOTIFICATION_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

  private static async createAndEmitNotification(
    deviceId: number,
    message: string,
    status: string
  ) {
    // Check for any recent notification (read or unread) with the same details
    // within the cooldown window to prevent spam after marking as read
    const cooldownTime = new Date(Date.now() - this.NOTIFICATION_COOLDOWN_MS);
    const cattleI = await cattle.findOne({ deviceId });
    const cattleId = cattleI ? cattleI.cattleId : null;
    const existing = await Notification.findOne({
      cattleId,
      status,
      message,
      timestamp: { $gte: cooldownTime },
    });
    if (!existing) {

      const notification = new Notification({
        cattleId,
          message,
          status,
        timestamp: new Date(),
      });
      await notification.save();
      const io = getSocketIOInstance();
      if (io) {
        io.emit('new_notification', notification);
      }
      return true;
    }
    return false;
  }

  private static findDistance = (
    lat1: number,
    lat2: number,
    lng1: number,
    lng2: number
  ) => {
    const radiusOfEarth = 6371e3;
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return radiusOfEarth * c;
  };
}

export interface SensorDataInterface {
    deviceId: number;
    heartRate: number;
    temperature: number;
    gpsLocation?: {
      latitude: number;
      longitude: number;
    };
  }
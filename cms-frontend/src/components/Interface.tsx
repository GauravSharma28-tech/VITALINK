export interface CattleData {
  status: string;
  locationStatus: string;
  cattleId: string;
  deviceId: string | null;
  cattleName: string;
  createdAt: string;
  cattleStatus: string;
  updatedAt: string;
  sensorCreatedAt: string;
  cattleCreatedAt: string;
  heartRate: number;
  temperature: number;
  gpsLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface SensorData {
  sensorData: CattleData;
  heartRateStatus: string;
  temperatureStatus: string;
  locationStatus: string;
}

export interface SensorThreshold {
  heartRate: {
    min: number;
    max: number;
  };
  temperature: {
    min: number;
    max: number;
  };
  geoFence: {
    safeThreshold: number;
    dangerThreshold: number;
  };
}

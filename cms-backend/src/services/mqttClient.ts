import mqtt, { MqttClient, ISubscriptionGrant } from 'mqtt';
import { SensorDataInterface } from '../types/sensorDataInterface';
import { CattleSensorData } from '../services/controls';
import mongoose from 'mongoose';
import sensorData from '../model/sensorData';
import path from 'path';
import fs from 'fs';
import { getSocketIOInstance } from '../socket';
import console from 'console';

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost';

interface CattleData {
  heartRate: number;
  temperature: number;
  deviceId: number;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

class MqttHandler {
  private static instance: MqttHandler;
  private client: MqttClient;
  private isConnected = false;
  private latestupdate: Record<number, CattleData> = {};

  private constructor() {
    // console.log("mqttClient.ts initialized");

    // const certsDir = path.join(__dirname, '..', '..', 'certs');
    // console.log("mqttClient.ts initialized");
    // const options = {
    //   key: fs.readFileSync(path.join(certsDir, 'private.pem.key')),
    //   cert: fs.readFileSync(path.join(certsDir, 'certificate.pem.crt')),
    //   ca: fs.readFileSync(path.join(certsDir, 'AmazonRootCA1.pem')),
    //   clientId: 'test-client',
    //   protocol: 'mqtts' as mqtt.MqttProtocol,
    //   host: 'aoowqlrrhcw8y-ats.iot.eu-north-1.amazonaws.com',
    //   port: 8883,
    //   rejectUnauthorized: true,
    // };

    const options = {
      clientId: 'local-mqtt-client',
      protocol: 'mqtt' as mqtt.MqttProtocol,
      host: 'localhost',
      port: 1883,
    };

    // this.client = mqtt.connect(MQTT_BROKER, options);
    // Dummy initialization since other methods use this.client
    this.client = {} as MqttClient;

    /*
    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to local Mosquitto MQTT broker');
    });

    this.client.on('error', (err) => {
      console.error('MQTT error:', err);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.log('Disconnected from MQTT broker');
    });
    */

    /*
    this.client.on('message', async (receivedTopic, message) => {
      ... (entire callback commented)
    });
    */
  }

  // Function to store sensor data in MongoDB
  private async storeSensorData(
    deviceId: number,
    heartRate: number,
    temperature: number,
    gpsLocation?: { latitude: number; longitude: number }
  ) {
    try {
      const newSensorData = new sensorData({
        deviceId,
        heartRate,
        temperature,
        gpsLocation,
      });

      await newSensorData.save();
      console.log(`Sensor data stored in DB for device ${deviceId}`);
      // Note: real-time socket emit is handled in the MQTT message handler
      // via the 'sensor_data' event (which includes status). No duplicate emit needed here.
    } catch (error) {
      console.error(' Error storing sensor data:', error);
    }
  }

  public static getInstance(): MqttHandler {
    if (!MqttHandler.instance) {
      MqttHandler.instance = new MqttHandler();
    }
    return MqttHandler.instance;
  }

  public getClient(): MqttClient {
    if (!this.isConnected) {
      throw new Error('MQTT client not connected');
    }
    return this.client;
  }

  public publish(
    topic: string,
    message: string,
    options?: mqtt.IClientPublishOptions
  ): void {
    if (!this.isConnected) {
      console.warn(
        `MQTT client not connected. Retrying publishing to ${topic} in 2 seconds.`
      );
      setTimeout(() => this.publish(topic, message, options), 2000);
      return;
    }
    this.client.publish(topic, message, options, (err) => {
      if (err) {
        console.error(`Failed to publish to ${topic}:`, err);
      } else {
        console.log(`Published to ${topic}: ${message}`);
      }
    });
  }

  public subscribe(
    topic: string,
    options?: mqtt.IClientSubscribeOptions
  ): void {
    if (!this.isConnected) {
      // console.warn(
      //   //`MQTT client not connected. Retrying subscription to ${topic} in 2 seconds.`
      // );
      setTimeout(() => this.subscribe(topic, options), 2000);
      return;
    }

    this.client.subscribe(topic, options, (err, granted) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
        if (granted) {
          granted.forEach((grant) => {
            console.log(`Granted QoS: ${grant.qos} for topic: ${grant.topic}`);
          });
        }
      }
    });
  }

  public getLatestUpdate(): Record<number, CattleData> {
    return this.latestupdate;
  }
}

// Export singleton instance
export const mqttClient = MqttHandler.getInstance();

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    PropsWithChildren,
} from 'react';
import { socket } from '../services/Axios';
import GlobalContext from './GlobalContext';

// Shape of real-time sensor data received from the server
export interface LiveSensorData {
    deviceId: number;
    heartRate: number;
    temperature: number;
    gpsLocation: {
        latitude: number;
        longitude: number;
    };
    status: string;
    timestamp?: string;
}

// Callback types for components that want to react to real-time events
type SensorDataListener = (data: LiveSensorData) => void;
type CattleListListener = (payload: { action: string; cattle?: any; cattleId?: string }) => void;

interface SocketContextType {
    /** Map of deviceId → latest sensor data from socket */
    latestSensorData: Record<number, LiveSensorData>;
    /** Version counter – increments on every cattle_list_updated event.
     *  Components can depend on this to trigger re-fetches. */
    cattleListVersion: number;
    /** Subscribe to real-time sensor data. Returns an unsubscribe function. */
    subscribeToSensorData: (listener: SensorDataListener) => () => void;
    /** Subscribe to cattle list changes. Returns an unsubscribe function. */
    subscribeToCattleUpdates: (listener: CattleListListener) => () => void;
}

const SocketContext = createContext<SocketContextType>({
    latestSensorData: {},
    cattleListVersion: 0,
    subscribeToSensorData: () => () => { },
    subscribeToCattleUpdates: () => () => { },
});

export const useLiveData = () => useContext(SocketContext);

export const SocketProvider = ({ children }: PropsWithChildren<{}>) => {
    const [latestSensorData, setLatestSensorData] = useState<Record<number, LiveSensorData>>({});
    const [cattleListVersion, setCattleListVersion] = useState(0);
    const { auth } = useContext(GlobalContext);

    // Listener refs so components can subscribe without re-renders
    const sensorListenersRef = useRef<Set<SensorDataListener>>(new Set());
    const cattleListenersRef = useRef<Set<CattleListListener>>(new Set());

    const subscribeToSensorData = useCallback((listener: SensorDataListener) => {
        sensorListenersRef.current.add(listener);
        return () => {
            sensorListenersRef.current.delete(listener);
        };
    }, []);

    const subscribeToCattleUpdates = useCallback((listener: CattleListListener) => {
        cattleListenersRef.current.add(listener);
        return () => {
            cattleListenersRef.current.delete(listener);
        };
    }, []);

    useEffect(() => {
        if (!auth?.accessToken) return;

        // Handle real-time sensor data from MQTT → backend → socket
        const handleSensorData = (data: LiveSensorData) => {
            if (data) {
                setLatestSensorData((prev) => ({
                    ...prev,
                    [data.deviceId]: data,
                }));
                // Notify all subscribed components
                sensorListenersRef.current.forEach((listener) => listener(data));
            }
        };

        // Handle cattle list changes (add/delete by any user)
        const handleCattleListUpdated = (payload: { action: string; cattle?: any; cattleId?: string }) => {
            setCattleListVersion((prev) => prev + 1);
            // Notify all subscribed components
            cattleListenersRef.current.forEach((listener) => listener(payload));
        };

        socket.on('sensor_data', handleSensorData);
        socket.on('cattle_list_updated', handleCattleListUpdated);

        return () => {
            socket.off('sensor_data', handleSensorData);
            socket.off('cattle_list_updated', handleCattleListUpdated);
        };
    }, [!!auth?.accessToken]);

    return (
        <SocketContext.Provider
            value={{
                latestSensorData,
                cattleListVersion,
                subscribeToSensorData,
                subscribeToCattleUpdates,
            }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;

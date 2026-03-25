import TemperatureSettings from './TemperatureSettings';
import HeartRateSettings from './HeartRateSettings';
import GeoFenceSettings from './GeoFenceSettings';
import { useEffect, useState } from 'react';
import { axiosPrivate } from '../../services/Axios';
import { toast } from 'react-toastify';

const Settings = () => {
  // State for geofence thresholds
  const [threshold, setThreshold] = useState(0);
  const [initialSettings, setInitialSettings] = useState<any>(null);

  // State for heart rate settings
  const [heartRateMode, setHeartRateMode] = useState<'default' | 'custom'>(
    'default'
  );
  const [customHRRange, setCustomHRRange] = useState({ min: 65, max: 90 });
  const heartRateRange =
    heartRateMode === 'custom' ? customHRRange : { min: 60, max: 80 };

  // State for temperature settings
  const [tempMode, setTempMode] = useState<'cold' | 'hot' | 'custom'>('cold');
  const [customTempRange, setCustomTempRange] = useState({ min: 32, max: 34 });
  const tempRange =
    tempMode === 'custom' ? customTempRange : { min: 30, max: 33 };

  const [onCancel, setOnCancel] = useState(false);

  const getSettings = async () => {
    try {
      const response = await axiosPrivate.get('/api/threshold');
      const data = response.data;

      // Set UI state
      setThreshold(data.geofence.threshold);
      setHeartRateMode(data.heartRate.mode);
      setCustomHRRange({ min: data.heartRate.min, max: data.heartRate.max });
      setTempMode(data.temperature.mode);
      setCustomTempRange({
        min: data.temperature.min,
        max: data.temperature.max,
      });

      // Save original settings for comparison
      setInitialSettings({
        threshold: data.geofence.threshold,
        heartRateMode: data.heartRate.mode,
        heartRateRange: {
          min: data.heartRate.min,
          max: data.heartRate.max,
        },
        tempMode: data.temperature.mode,
        tempRange: {
          min: data.temperature.min,
          max: data.temperature.max,
        },
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async () => {
    try {
      const settings = {
        geofence: {
          threshold,
        },
        heartRate: {
          mode: heartRateMode,
          min: heartRateRange.min,
          max: heartRateRange.max,
        },
        temperature: {
          mode: tempMode,
          min: tempRange.min,
          max: tempRange.max,
        },
      };
      await axiosPrivate.put('/api/threshold/update', settings);
      toast.success('Sensor settings updated successfully');
      getSettings(); // Refresh initial state
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const hasChanges = () => {
    if (!initialSettings) return false;
    return (
      threshold !== initialSettings.threshold ||
      heartRateMode !== initialSettings.heartRateMode ||
      customHRRange.min !== initialSettings.heartRateRange.min ||
      customHRRange.max !== initialSettings.heartRateRange.max ||
      tempMode !== initialSettings.tempMode ||
      customTempRange.min !== initialSettings.tempRange.min ||
      customTempRange.max !== initialSettings.tempRange.max
    );
  };

  useEffect(() => {
    getSettings();
    setOnCancel(false);
  }, [onCancel]);

  return (
    <div>
      <div className="top-0 flex space-x-4 p-4 bg-gray-100">
        <TemperatureSettings
          mode={tempMode}
          setMode={setTempMode}
          customRange={customTempRange}
          setCustomRange={setCustomTempRange}
        />
        <HeartRateSettings
          mode={heartRateMode}
          setMode={setHeartRateMode}
          customRange={customHRRange}
          setCustomRange={setCustomHRRange}
        />
        <GeoFenceSettings threshold={threshold} setThreshold={setThreshold} />
      </div>
      <div className="px-4">
        <div className="bg-gray-50 p-6 shadow-2xs rounded-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-500"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Settings Information
          </h2>

          <div className="text-sm text-gray-600 mb-4">
            <p className="mb-3">
              Adjust the parameters like temperature, heart rate and geofence
              threshold. Please note that future alerts will be based on the new
              parameters.
            </p>

            <ul className="space-y-2 mb-4">
              <li className="flex items-start">
                <svg
                  className="h-4 w-4 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  <strong>Temperature Settings:</strong> Default presets for
                  cold (&lt;27°C) and hot (&gt;27°C) conditions, or set a custom
                  range
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-4 w-4 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  <strong>Heart Rate Settings:</strong> Default range with
                  option for custom adjustment
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-4 w-4 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  <strong>Geofence Settings:</strong> Adjust radius threshold.
                  Alerts are triggered when cattle enter danger or warning
                  zones.
                </span>
              </li>
            </ul>

            <p className="text-sm text-gray-500">
              Note: Changes will be applied to all neck collars in the system.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setOnCancel(true)}
              disabled={!hasChanges()}
              className={`px-4 py-2 rounded-md text-sm font-medium border ${
                hasChanges()
                  ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  : 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
              }`}>
              Cancel
            </button>
            <button
              onClick={updateSettings}
              disabled={!hasChanges()}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium border ${
                hasChanges()
                  ? 'bg-purple-600 text-white hover:bg-purple-700 border-transparent'
                  : 'bg-purple-400 text-white cursor-not-allowed border-transparent'
              }`}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

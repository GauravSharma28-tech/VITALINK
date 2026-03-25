interface GeoFenceSettingsProps {
  threshold: number;
  setThreshold: (value: number) => void;
}

const GeoFenceSettings = ({
  threshold,
  setThreshold,
}: GeoFenceSettingsProps) => {
  const MAX_THRESHOLD = 25;
  const center = 150;
  const baseDangerRadius = 70;
  const baseSafeRadius = 130;

  const dangerRadius = baseDangerRadius + threshold;
  const safeRadius = Math.max(baseSafeRadius - threshold, 5);

  const handleThresholdChange = (delta: number) => {
    const newValue = Math.min(Math.max(threshold + delta, 0), MAX_THRESHOLD);
    setThreshold(newValue);
  };

  return (
    <div className="bg-gray-50 p-6 shadow-2xs rounded-lg w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">
          GeoFence Settings
        </h2>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
          Map
        </span>
      </div>

      <div className="flex items-center justify-center">
        <svg viewBox="0 0 300 300" className="w-[350px] h-[350px]">
          {/* Danger zone (base) */}
          <circle
            cx={center}
            cy={center}
            r={baseDangerRadius}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          />
          {/* Safe zone (base) */}
          <circle
            cx={center}
            cy={center}
            r={baseSafeRadius}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          />
          {/* Dynamic danger threshold */}
          <circle
            cx={center}
            cy={center}
            r={dangerRadius}
            fill="none"
            stroke="#fca5a5"
            strokeWidth="1"
            strokeDasharray="2 1"
          />
          {/* Dynamic safe threshold */}
          <circle
            cx={center}
            cy={center}
            r={safeRadius}
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="1"
            strokeDasharray="2 1"
          />
        </svg>
      </div>

      <div className="mt-4 text-center">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          THRESHOLD
        </label>
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleThresholdChange(-1)}
            disabled={threshold <= 0}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              threshold <= 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}>
            −
          </button>
          <div
            className={`px-4 py-2 rounded-lg border text-sm font-medium ${
              threshold >= MAX_THRESHOLD
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-gray-300 bg-white text-gray-700'
            }`}>
            {threshold}m
          </div>
          <button
            onClick={() => handleThresholdChange(1)}
            disabled={threshold >= MAX_THRESHOLD}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              threshold >= MAX_THRESHOLD
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}>
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeoFenceSettings;

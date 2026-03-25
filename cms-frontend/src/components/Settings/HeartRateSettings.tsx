import { useEffect } from 'react';
import { HR_MIN, HR_MAX } from './Constants';
import { RangeDial } from './RangeDial';

const presets = {
  default: { min: 60, max: 80 },
};

interface HeartRateSettingsProps {
  mode: 'default' | 'custom';
  setMode: React.Dispatch<React.SetStateAction<'default' | 'custom'>>;
  customRange: { min: number; max: number };
  setCustomRange: React.Dispatch<
    React.SetStateAction<{ min: number; max: number }>
  >;
}

export default function HeartRateSettings({
  mode,
  setMode,
  customRange,
  setCustomRange,
}: HeartRateSettingsProps) {
  const range = mode === 'custom' ? customRange : presets.default;

  useEffect(() => {
    mode === 'custom' ? customRange : presets[mode];
  }, [mode, customRange]);

  const handlecustomChange = (type: 'min' | 'max', delta: number) => {
    if (mode !== 'custom') return;

    setCustomRange((prev) => {
      let newVal = prev[type] + delta;
      newVal = Math.min(Math.max(newVal, HR_MIN), HR_MAX);

      if (type === 'min')
        newVal = Math.min(newVal, prev.max - 5); // Ensure minimum 5 BPM gap
      else newVal = Math.max(newVal, prev.min + 5);

      const updated = { ...prev, [type]: newVal };
      return updated;
    });
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-2xs w-1/3">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-700">
          Heart Rate Settings
        </h2>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
          Cattle
        </span>
      </div>

      <div className="mb-4">
        <RangeDial
          min={HR_MIN}
          max={HR_MAX}
          range={range}
          //   onChange={handlecustomChange}
          gradientId="hrGradient"
        />
        <div className="flex justify-between px-4 mt-2">
          <span className="text-sm text-gray-500">{HR_MIN} BPM</span>
          <span className="text-sm text-gray-500">{HR_MAX} BPM</span>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(presets).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as any)}
              className={`py-1 px-2 rounded-lg border transition-colors ${
                mode === m
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setMode('custom')}
            className={`py-1 px-3 rounded-lg border transition-colors ${
              mode === 'custom'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}>
            Custom
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="grid grid-cols-2 gap-4">
          {(['min', 'max'] as const).map((type) => (
            <div key={type} className="space-y-2">
              <label className="block text-xs font-medium text-gray-500">
                {type.toUpperCase()} VALUE
              </label>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() =>
                    mode === 'custom' && handlecustomChange(type, -1)
                  }
                  disabled={mode !== 'custom'}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                    mode === 'custom'
                      ? 'bg-gray-200 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                  <span className="text-lg">−</span>
                </button>
                <div className="flex-1 text-center py-2 bg-white rounded-lg border border-gray-300 font-medium">
                  {(mode === 'custom' ? customRange : presets.default)[type]}{' '}
                  BPM
                </div>
                <button
                  onClick={() =>
                    mode === 'custom' && handlecustomChange(type, 1)
                  }
                  disabled={mode !== 'custom'}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                    mode === 'custom'
                      ? 'bg-gray-200 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

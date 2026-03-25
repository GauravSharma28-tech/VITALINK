import { useEffect } from 'react';
import { TEMP_MAX, TEMP_MIN } from './Constants';
import { RangeDial } from './RangeDial';

const presets = {
  cold: { min: 30, max: 33 },
  hot: { min: 31, max: 35 },
};

interface TemperatureSettingsProps {
  mode: 'cold' | 'hot' | 'custom';
  setMode: React.Dispatch<React.SetStateAction<'cold' | 'hot' | 'custom'>>;
  customRange: { min: number; max: number };
  setCustomRange: React.Dispatch<
    React.SetStateAction<{ min: number; max: number }>
  >;
}

export default function TemperatureSettings({
  mode,
  setMode,
  customRange,
  setCustomRange,
}: TemperatureSettingsProps) {
  const range =
    mode === 'custom' ? customRange : presets[mode as keyof typeof presets];

  useEffect(() => {
    mode === 'custom' ? customRange : presets[mode];
  }, [mode, customRange]);

  const handlecustomChange = (type: 'min' | 'max', delta: number) => {
    if (mode !== 'custom') return;

    setCustomRange((prev) => {
      let newVal = prev[type] + delta;
      newVal = Math.min(Math.max(newVal, TEMP_MIN), TEMP_MAX);

      if (type === 'min') newVal = Math.min(newVal, prev.max - 1);
      else newVal = Math.max(newVal, prev.min + 1);

      const updated = { ...prev, [type]: newVal };
      return updated;
    });
  };

  return (
    <div className="bg-gray-50 p-6 shadow-2xs rounded-lg w-1/3">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-700">
          Temperature Settings
        </h2>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
          Cattle
        </span>
      </div>

      <div className="mb-4">
        <RangeDial
          min={TEMP_MIN}
          max={TEMP_MAX}
          range={range}
          //   onChange={handlecustomChange}
          gradientId="tempGradient"
        />
        <div className="flex justify-between px-4 mt-2">
          <span className="text-sm text-gray-500">{TEMP_MIN}°C</span>
          <span className="text-sm text-gray-500">{TEMP_MAX}°C</span>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-3 gap-3">
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
                {type.toUpperCase()} TEMPERATURE
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
                <div className="flex-1 text-center py-1.5 bg-white rounded-lg border border-gray-300 font-medium">
                  {(mode === 'custom' ? customRange : presets[mode])[type]}°C
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

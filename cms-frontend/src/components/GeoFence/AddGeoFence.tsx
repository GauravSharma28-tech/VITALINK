import { useEffect, useState } from 'react';
import GeoFenceMap from './GeoFenceMap';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';
import { toast } from 'react-toastify';

const GeoFense = () => {
  const axiosPrivate = UseAxiosPrivate();
  const [newLocation, setNewLocation] = useState(true);
  const [zoneType, setZoneType] = useState<'safe' | 'danger'>('safe');
  const [zoneName, setZoneName] = useState('');
  const [radius, setRadius] = useState(100);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: Number;
    lng: Number;
  } | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  useEffect(() => {
    setRadius(100);
  }, [selectedLocation]);

  // Handle the change in the value of radius
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(1, Number(e.target.value)), 1000);
    setRadius(value);
  };

  const handleSave = async () => {
    if (!zoneName) {
      toast.warning('Please provide a name for geofence');
      return;
    }

    const locationData = {
      latitude: selectedLocation?.lat,
      longitude: selectedLocation?.lng,
      radius: radius,
      zoneType: zoneType,
      zoneName: zoneName,
    };

    console.log(locationData);
    const response = axiosPrivate.post('/geo-fence/new', locationData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    toast.success('Geo-fence added successfully');
    console.log((await response).data);

    // Reset the form
    setSelectedLocation(null);
    setRadius(100);
    setZoneType('safe');
    setZoneName('');
  };

  return (
    <div className="flex space-x-4 ">
      <div className="w-1/5 space-y-3">
        {/* Select location section */}
        <div className="bg-white h-fit border border-gray-200 rounded-lg p-4 shadow-sm">
          <h1 className="font-semibold text-lg mb-3 text-gray-800">
            1. Select Location
          </h1>
          {!selectedLocation ? (
            <p className="text-gray-600">
              Click on the map to select a location
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Selected Coordinates:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Latitude</p>
                  <p className="font-mono text-sm">
                    {selectedLocation.lat.toFixed(6)}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Longitude</p>
                  <p className="font-mono text-sm">
                    {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Radius selection section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">
            2. Set Radius
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>10m</span>
                <span>1000m</span>
              </div>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={radius}
                onChange={handleChange}
                disabled={!selectedLocation}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={1}
                max={1000}
                value={radius}
                onChange={handleChange}
                disabled={!selectedLocation}
                className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-md text-gray-600">meters</span>
            </div>
          </div>
        </div>

        {/* Zone type section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">
            3. Zone Type
          </h2>
          <div className="flex justify-center">
            <div className="relative bg-gray-100 rounded-full p-1 w-full max-w-xs">
              <div
                className={`absolute top-1 bottom-1 left-1 right-1/2 rounded-full transition-all duration-300 ${zoneType === 'safe'
                    ? 'bg-green-500 shadow-md'
                    : 'bg-red-500 shadow-md transform translate-x-full'
                  }`}
              />
              <button
                disabled={!selectedLocation}
                onClick={() => setZoneType('safe')}
                className={`relative z-10 w-1/2 py-2 text-sm font-medium rounded-full transition-colors ${zoneType === 'safe'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}>
                Safe Zone
              </button>
              <button
                disabled={!selectedLocation}
                onClick={() => setZoneType('danger')}
                className={`relative z-10 w-1/2 py-2 text-sm font-medium rounded-full transition-colors ${zoneType === 'danger'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}>
                Danger Zone
              </button>
            </div>
          </div>
        </div>

        {/* Zone name section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2 text-gray-800">
            4. Zone Name
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Example: "Safe Zone 1" or "Danger Area 1" or "Shallow"
          </p>
          <input
            type="text"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            disabled={!selectedLocation}
            placeholder="Enter zone name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Save geo fence button */}
        <button
          onClick={handleSave}
          disabled={!selectedLocation}
          className={`w-full py-2 px-4 rounded-md font-medium text-white transition-all ${!selectedLocation
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 hover:shadow-md'
            }`}>
          Save Geo-fence
        </button>
      </div>

      {/* Map */}
      <div className="h-[700px] border border-gray-200 w-4/5 rounded-2xl overflow-hidden shadow-sm">
        <GeoFenceMap
          newLocation={newLocation}
          onLocationSelect={handleLocationSelect}
          radius={radius}
        />
      </div>
    </div>
  );
};

export default GeoFense;

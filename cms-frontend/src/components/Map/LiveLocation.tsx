import { useEffect, useState } from 'react';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';
import { CattleData } from '../Interface';
import LiveLocationMap from './LiveLocationMap';

const LiveLocation = () => {
  const [allCattleData, setAllCattleData] = useState<CattleData[]>([]);
  const [highlightedCattleId, setHighlightedCattleId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const axiosPrivate = UseAxiosPrivate();

  const fetchAllCattle = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get('/map');
      const data = response.data;
      const filteredData = data.filter(
        (item: CattleData) =>
          item.gpsLocation &&
          item.gpsLocation.latitude !== 0 &&
          item.gpsLocation.longitude !== 0
      );
      // console.log('Response:', filteredData);
      setAllCattleData(filteredData);
    } catch (error) {
      console.error('Error fetching cattle data:', error);
      setAllCattleData([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAllCattle();
    const interval = setInterval(() => {
      fetchAllCattle();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center bg-gray-100 mt-60">
        <div className="text-gray-600 text-lg animate-pulse">
          Loading cattle data...
        </div>
      </div>
    );

  return (
    <div>
      <div className="h-[580px] border border-gray-400 w-full">
        <LiveLocationMap
          cattleData={allCattleData}
          highlightedCattleId={highlightedCattleId}
        />
      </div>
      <div className="flex justify-evenly space-x-3 mt-3">
        {/* Table for safe cattle */}
        <div className="relative h-[250px] w-full overflow-hidden bg-white shadow-xs rounded-sm border-5 border-green-100">
          <div className="bg-green-100 px-4 py-3">
            <h3 className="text-green-700 text-sm font-semibold flex items-center uppercase">
              Cattle in Safe Zone
              <span className="ml-auto bg-green-300 px-2 py-1 rounded-full text-xs">
                {
                  allCattleData.filter(
                    (c) => c.locationStatus === 'SAFE' && c.cattleId
                  ).length
                }
              </span>
            </h3>
          </div>
          <div className="overflow-y-auto h-full">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {allCattleData
                  .filter(
                    (cattle) =>
                      cattle.locationStatus === 'SAFE' && cattle.cattleId
                  )
                  .map((cattle) => (
                    <tr
                      key={cattle.cattleId}
                      onClick={() => setHighlightedCattleId(cattle.cattleId)}
                      className="hover:bg-green-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {cattle.cattleId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        ({cattle.gpsLocation.latitude.toFixed(4)},{' '}
                        {cattle.gpsLocation.longitude.toFixed(4)})
                      </td>
                    </tr>
                  ))}
                {allCattleData.filter(
                  (c) => c.locationStatus === 'SAFE' && c.cattleId
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-gray-500">
                      No cattle in safe zone
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table for warning cattle */}
        <div className="relative h-[250px] w-full overflow-hidden bg-white shadow-xs rounded-sm border-5 border-yellow-100">
          <div className="bg-yellow-100 px-4 py-3">
            <h3 className="text-yellow-700 text-sm font-semibold flex items-center uppercase">
              Cattle in Warning Zone
              <span className="ml-auto bg-yellow-300 px-2 py-1 rounded-full text-xs">
                {
                  allCattleData.filter(
                    (c) => c.locationStatus === 'WARNING' && c.cattleId
                  ).length
                }
              </span>
            </h3>
          </div>
          <div className="overflow-y-auto h-full">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {allCattleData
                  .filter(
                    (cattle) =>
                      cattle.locationStatus === 'WARNING' && cattle.cattleId
                  )
                  .map((cattle) => (
                    <tr
                      key={cattle.cattleId}
                      onClick={() => setHighlightedCattleId(cattle.cattleId)}
                      className="hover:bg-yellow-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          {cattle.cattleId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        ({cattle.gpsLocation.latitude.toFixed(4)},{' '}
                        {cattle.gpsLocation.longitude.toFixed(4)})
                      </td>
                    </tr>
                  ))}
                {allCattleData.filter(
                  (c) => c.locationStatus === 'WARNING' && c.cattleId
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-gray-500">
                      No cattle in warning zone
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table for danger cattle */}
        <div className="relative h-[250px] w-full overflow-hidden bg-white shadow-xs rounded-sm border-5 border-red-100">
          <div className="bg-red-100 px-4 py-3">
            <h3 className="text-red-700 text-sm font-semibold flex items-center uppercase">
              Cattle in Danger Zone
              <span className="ml-auto bg-red-300 px-2 py-1 rounded-full text-xs">
                {
                  allCattleData.filter(
                    (c) => c.locationStatus === 'DANGER' && c.cattleId
                  ).length
                }
              </span>
            </h3>
          </div>
          <div className="overflow-y-auto h-full">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {allCattleData
                  .filter(
                    (cattle) =>
                      cattle.locationStatus === 'DANGER' && cattle.cattleId
                  )
                  .map((cattle) => (
                    <tr
                      key={cattle.cattleId}
                      onClick={() => setHighlightedCattleId(cattle.cattleId)}
                      className="hover:bg-red-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {cattle.cattleId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        ({cattle.gpsLocation.latitude.toFixed(4)},{' '}
                        {cattle.gpsLocation.longitude.toFixed(4)})
                      </td>
                    </tr>
                  ))}
                {allCattleData.filter(
                  (c) => c.locationStatus === 'DANGER' && c.cattleId
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-gray-500">
                      No cattle in danger zone
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveLocation;

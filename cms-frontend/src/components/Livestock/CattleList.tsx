import { useContext, useEffect, useState } from 'react';
import { RiAddCircleLine } from 'react-icons/ri';
import GlobalContext from '../../context/GlobalContext';
import { CattleData } from '../Interface';
import dayjs from 'dayjs';
import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';
import NavSub from '../NavSub';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';
import { Outlet, useNavigate } from 'react-router-dom';
import { useLiveData } from '../../context/SocketContext';

const CattleList = () => {
  const navigate = useNavigate();
  const { cattleList_selectedOption, setCattlelist_selectedOption } =
    useContext(GlobalContext);

  const cattleStatus = ['all cattle', 'safe', 'unsafe', 'un-monitored'];

  const [filteredCattleData, setFilteredCattleData] = useState<CattleData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const axiosPrivate = UseAxiosPrivate();

  // Real-time updates from SocketContext
  const { cattleListVersion, latestSensorData } = useLiveData();

  // Fetch and filter all cattle data
  const fetchAndFilter = async () => {
    try {
      const response = await axiosPrivate.get('/api/sensor/latestWithCattle');
      const data = response.data;
      console.log('Response:', data);
      if (cattleList_selectedOption === 'all cattle') {
        setFilteredCattleData(data);
      } else {
        setFilteredCattleData(
          data.filter(
            (cattle: CattleData) =>
              cattle.status.toLowerCase() ===
              cattleList_selectedOption.toLowerCase()
          )
        );
      }
    } catch (error) {
      console.error('Error fetching cattle data:', error);
      setFilteredCattleData([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when sensor data arrives (status may change) or cattle list changes
  useEffect(() => {
    fetchAndFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestSensorData, cattleListVersion]);

  useEffect(() => {
    setFilteredCattleData([]);
    setLoading(true);
    fetchAndFilter();
  }, [cattleList_selectedOption]);

  return (
    <div className="mt-10 overflow-x-auto px-5">
      <div className="flex items-start justify-between mb">
        {/* Navigation to display the livestocks with different status */}
        <NavSub
          options={cattleStatus}
          selectedOption={cattleList_selectedOption}
          onSelect={setCattlelist_selectedOption}
        />

        {/* Add livestock button */}
        <button
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 py-2 px-4 rounded-md text-white text-sm font-medium transition-colors duration-200 shadow-sm w-full sm:w-auto"
          onClick={() => {
            navigate('/livestock/add-cattle');
          }}>
          <div className="text-lg">
            <RiAddCircleLine />
          </div>
          <div>Add Livestock</div>
        </button>
      </div>
      <hr className="text-gray-300 w-full mb-8" />

      {/* Table to display the livestock details */}
      {loading ? (
        <div className="flex items-center justify-center bg-gray-100 mt-60">
          <div className="text-gray-600 text-lg animate-pulse">
            Loading cattle data...
          </div>
        </div>
      ) : (
        <table className="w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-md">
          <thead
            className={`${cattleList_selectedOption === 'all cattle'
                ? 'text-gray-800 bg-white'
                : cattleList_selectedOption === 'safe'
                  ? 'text-green-800 bg-green-100'
                  : cattleList_selectedOption === 'unsafe'
                    ? 'text-red-800 bg-red-100'
                    : 'text-gray-800 bg-gray-200'
              }`}>
            <tr>
              {[
                'cattle id',
                'device id',
                'added on',
                'current state',
                'last update',
                'action',
              ].map((heading) => (
                <th
                  key={heading}
                  className="py-4 text-center text-sm font-medium uppercase tracking-wider">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {filteredCattleData.length > 0 ? (
              filteredCattleData
                .sort((a, b) => Number(a.cattleId) - Number(b.cattleId))
                .map((cattleData: CattleData) => (
                  <tr
                    key={
                      cattleData.cattleId ??
                      cattleData.deviceId ??
                      Math.random()
                    }
                    onClick={() =>
                      navigate(`/livestock/${cattleData.cattleId}`)
                    }
                    className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="py-3 text-center text-sm font-medium text-gray-900">
                      {cattleData.cattleId}
                    </td>

                    <td className="py-3 text-center text-sm text-gray-900">
                      {cattleData.deviceId || 'Device not assigned'}
                    </td>

                    <td className="py-3 text-center text-sm text-gray-500">
                      {dayjs(cattleData.cattleCreatedAt).format(
                        'MMM D, YYYY h:mm A'
                      )}
                    </td>

                    <td className="py-3 text-center ">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${cattleData.status === 'safe'
                            ? 'bg-green-100 text-green-800'
                            : cattleData.status === 'unsafe'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                        {cattleData.status.charAt(0).toUpperCase() +
                          cattleData.status.slice(1)}
                      </span>
                    </td>

                    <td className="py-3 text-center text-sm text-gray-500">
                      {cattleData.status === 'safe' ||
                        cattleData.status === 'unsafe'
                        ? cattleData.sensorCreatedAt
                          ? dayjs(cattleData.sensorCreatedAt).format(
                            'MMM D, YYYY h:mm A'
                          )
                          : '--'
                        : '--'}
                    </td>

                    <td className="py-3 text-sm font-medium ">
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/livestock/edit-cattle/${cattleData.cattleId}`
                            );
                          }}
                          className="text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-1">
                          <MdOutlineEdit className="text-lg" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/livestock/delete-cattle/${cattleData.cattleId}`
                            );
                          }}
                          className="text-red-600 hover:bg-red-600 hover:text-white rounded-full p-1">
                          <MdDeleteOutline className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-3 text-center text-sm text-gray-500">
                  No cattle are in {cattleList_selectedOption.toUpperCase()}{' '}
                  region
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <Outlet />
    </div>
  );
};

export default CattleList;

import { GiCow } from 'react-icons/gi';
import { IoBatteryHalf } from 'react-icons/io5';
import { AiFillSafetyCertificate } from 'react-icons/ai';
import { MdDangerous } from 'react-icons/md';
import { GoAlertFill } from 'react-icons/go';
import Map from './Map';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalContext from '../context/GlobalContext';
import UseAxiosPrivate from '../hooks/UseAxiosPrivate';
import { useLiveData } from '../context/SocketContext';

interface DashboardSummary {
  totalCattle: number;
  activeCollars: number;
  safeCount: number;
  unsafeCount: number;
  noDataCount: number;
  unMonitoredCount: number;
}

const Dashboard = () => {
  const { setCattlelist_selectedOption, setSelectedMenu } =
    useContext(GlobalContext);
  const navigate = useNavigate();
  const axiosPrivate = UseAxiosPrivate();

  // Dashboard summary from API
  const [summary, setSummary] = useState<DashboardSummary>({
    totalCattle: 0,
    activeCollars: 0,
    safeCount: 0,
    unsafeCount: 0,
    noDataCount: 0,
    unMonitoredCount: 0,
  });

  // Real-time updates from SocketContext
  const { cattleListVersion, latestSensorData } = useLiveData();

  const fetchDashboardSummary = async () => {
    try {
      const response = await axiosPrivate.get('/api/sensor/dashboard-summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    }
  };

  // Fetch on initial load
  useEffect(() => {
    fetchDashboardSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when cattle list changes (add/delete by any user)
  useEffect(() => {
    if (cattleListVersion > 0) {
      fetchDashboardSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cattleListVersion]);

  // Re-fetch when new sensor data arrives (status may change)
  useEffect(() => {
    // latestSensorData changes on every sensor_data socket event
    // We re-fetch the summary since the status computation is server-side
    const deviceIds = Object.keys(latestSensorData);
    if (deviceIds.length > 0) {
      fetchDashboardSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestSensorData]);

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-44 bg-green-600 z-0">
        <h1 className="py-7 px-6 text-white text-3xl font-stretch-110% font-bold">
          Welcome to Cattle-Net
        </h1>
      </div>
      <div className="px-6 relative z-10 flex h-4/5 justify-evenly mt-28 space-x-6">
        {/* Cattle details summary card */}
        <div className="grid grid-row-4 gap-5 w-2/9">
          <div
            onClick={() => {
              navigate('/livestock');
              setCattlelist_selectedOption('all cattle');
            }}
            className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">Total Cattle</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {summary.totalCattle}
              </h3>
            </div>
            <div className="flex-row-reverse">
              <GiCow className="p-3 w-14 h-14 text-gray-600 bg-gray-100 rounded-full" />
            </div>
          </div>
          <div className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">
                Active Collars
              </p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {summary.activeCollars}
              </h3>
            </div>
            <div className="flex-row-reverse">
              <IoBatteryHalf className="p-3 w-14 h-14 text-blue-600 bg-blue-100 rounded-full" />
            </div>
          </div>
          <div
            className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">No Data</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {summary.noDataCount}
              </h3>
            </div>
            <div className="flex-row-reverse">
              <GoAlertFill className="p-3 w-14 h-14 text-yellow-600 bg-yellow-100 rounded-full" />
            </div>
          </div>
          <div
            onClick={() => {
              navigate('/livestock');
              setCattlelist_selectedOption('safe');
            }}
            className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">Safe State</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {summary.safeCount}
              </h3>
            </div>
            <div className="flex-row-reverse">
              <AiFillSafetyCertificate className="p-3 w-14 h-14 text-green-600 bg-green-100 rounded-full" />
            </div>
          </div>

          <div
            onClick={() => {
              navigate('/livestock');
              setCattlelist_selectedOption('unsafe');
            }}
            className="flex bg-white p-5 rounded-2xl border-gray-400 shadow-md items-center justify-between hover:bg-gray-50 hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex flex-col">
              <p className="text-gray-500 text-sm font-medium">Unsafe State</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {summary.unsafeCount}
              </h3>
            </div>
            <div className="flex-row-reverse">
              <MdDangerous className="p-3 w-14 h-14 text-red-600 bg-red-100 rounded-full" />
            </div>
          </div>
        </div>
        {/* Map */}
        <div
          onClick={() => {
            navigate('/map');
            setSelectedMenu('map');
          }}
          className="h-full flex w-7/9">
          <Map />
        </div>
      </div>
    </>
  );
};

export default Dashboard;

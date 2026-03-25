import { useEffect, useState } from 'react';
import { MdDeleteOutline } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';

interface ConfigData {
  zoneName: string;
  zoneId: string;
  receiverId: string;
}

const ConfigList = () => {
  const navigate = useNavigate();
  const axiosPrivate = UseAxiosPrivate();
  const [configs, setConfigs] = useState<ConfigData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllConfigs = async () => {
    try {
      const response = await axiosPrivate.get('/api/configurations');
      const data = response.data;
      console.log(data);
      setConfigs(data);
    } catch (error) {
      console.log('Error in fetching configurations:', error);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllConfigs();
  }, []);

  return (
    <div className="mt-10 overflow-x-auto">
      {loading ? (
        <div className="flex items-center justify-center bg-gray-100 mt-60">
          <div className="text-gray-600 text-lg animate-pulse">
            Loading configurations...
          </div>
        </div>
      ) : (
        <table className="w-full divide-y divide-gray-200 rounded-sm overflow-hidden shadow-md">
          <thead className="text-green-800 bg-green-100">
            <tr>
              {['Zone Name', 'Zone ID', 'Receiver ID', 'Action'].map(
                (heading) => (
                  <th
                    key={heading}
                    className="py-4 text-sm font-semibold uppercase tracking-wider">
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {configs.length > 0 ? (
              configs.map((config, index) => (
                <tr
                  key={index}
                  className="hover:bg-green-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/configuration/${config.zoneId}`)}>
                  <td className="py-3 text-center text-sm font-medium text-gray-900">
                    {config.zoneName}
                  </td>
                  <td className="py-3 text-center text-sm text-gray-900">
                    {config.zoneId}
                  </td>
                  <td className="py-3 text-center text-sm text-gray-900">
                    {config.receiverId}
                  </td>
                  <td className="py-3 text-sm font-medium">
                    <div className="flex justify-center space-x-3">
                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/configuration/edit/${config.zoneId}`);
                        }}
                        className="text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-1">
                        <MdOutlineEdit className="text-lg" />
                      </button> */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/configuration/delete/${config.zoneId}`);
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
                  colSpan={4}
                  className="px-6 py-3 text-center text-sm text-gray-500">
                  No configurations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ConfigList;

import { useEffect } from 'react';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';
import { useNavigate } from 'react-router-dom';

const Configure = () => {
  const navigate = useNavigate();
  const axiosPrivate = UseAxiosPrivate();

  const fetchAllConfigs = async () => {
    try {
      const response = await axiosPrivate.get('/api/configurations');
      const configs = response.data;
      console.log(configs);
    } catch (error) {
      console.log('Error in fetching configurations: ', error);
    }
  };

  useEffect(() => {
    fetchAllConfigs();
  }, []);
  return (
    <div className="mt-10 px-5 overflow-x-auto">
      <button
        onClick={() => navigate('/configure-add')}
        className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 py-2 px-4 rounded-md text-white text-sm font-medium transition-colors duration-200 shadow-sm w-full sm:w-auto">
        Add-Config
      </button>
      <table className="w-full divide-y divide-gray-200 rounded-md overflow-hidden shadow-sm">
        <thead className="text-gray-800 bg-white">
          <tr>
            {['zone name', 'zone id', 'receiver id', 'action'].map(
              (heading) => (
                <th
                  key={heading}
                  className="py-4 text-center text-sm font-medium uppercase tracking-wider">
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-100"></tbody>
      </table>
    </div>
  );
};

export default Configure;

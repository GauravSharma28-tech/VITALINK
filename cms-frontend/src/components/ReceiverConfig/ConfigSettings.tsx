import { useEffect, useState } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';

interface Receiver {
  id: string;
  name: string;
}

interface Settings {
  receiverId: string;
  timeInterval: number;
  allocatedTime: number;
  totalCollars: number;
  syncMaxRetry: number;
}

const ConfigSettings = () => {
  const axiosPrivate = UseAxiosPrivate();
  const [receiverList, setReceiverList] = useState<Receiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSettings, setSelectedSettings] = useState<Settings | null>(
    null
  );
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  const selectedReceiverId = watch('receiverId');

  // Fixed receiver settings values
  const fixedReceiverSettings = {
    timeInterval: 180, // seconds
    allocatedTime: 36, // minutes
    totalCollars: 50, // count
    syncMaxRetry: 10, // retries
  };

  const fetchAllConfigs = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await axiosPrivate.get('/api/configurations');
      const data = response.data;

      const receivers = data.map((item: any) => ({
        id: item.receiverId || item.id,
        name: item.receiverName || item.name || item.receiverId,
      }));

      setReceiverList(receivers);
    } catch (error) {
      console.error('Error in fetching configurations:', error);
      setError('Failed to load receiver list. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingsForReceiver = async (receiverId: string) => {
    try {
      setIsFetchingSettings(true);
      const response = await axiosPrivate.get(`/api/settings/${receiverId}`);
      const settings = response.data;
      setSelectedSettings(settings);

      // Populate form fields with either fetched settings or fixed defaults
      setValue(
        'timeInterval',
        settings?.timeInterval || fixedReceiverSettings.timeInterval
      );
      setValue(
        'allocatedTime',
        settings?.allocatedTime || fixedReceiverSettings.allocatedTime
      );
      setValue(
        'totalCollars',
        settings?.totalCollars || fixedReceiverSettings.totalCollars
      );
      setValue(
        'syncMaxRetry',
        settings?.syncMaxRetry || fixedReceiverSettings.syncMaxRetry
      );
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use fixed values if no settings found
      setValue('timeInterval', fixedReceiverSettings.timeInterval);
      setValue('allocatedTime', fixedReceiverSettings.allocatedTime);
      setValue('totalCollars', fixedReceiverSettings.totalCollars);
      setValue('syncMaxRetry', fixedReceiverSettings.syncMaxRetry);
      setSelectedSettings(null);
    } finally {
      setIsFetchingSettings(false);
    }
  };

  useEffect(() => {
    fetchAllConfigs();
  }, []);

  useEffect(() => {
    if (selectedReceiverId) {
      fetchSettingsForReceiver(selectedReceiverId);
    }
  }, [selectedReceiverId]);

  const onSubmit = async (data: FieldValues) => {
    try {
      const payload = {
        receiverId: data.receiverId,
        ...fixedReceiverSettings, // Always use the fixed values
      };

      // Use PUT if updating existing settings, POST if creating new
      const method = selectedSettings ? 'put' : 'post';
      await axiosPrivate[method]('/api/settings', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      alert('Settings saved successfully!');
      // Refresh the settings after save
      if (selectedReceiverId) {
        fetchSettingsForReceiver(selectedReceiverId);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    }
  };

  if (loading) {
    return (
      <div className="mt-10 px-5 max-w-xl mx-auto text-center">
        <p>Loading receiver list...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 px-5 max-w-xl mx-auto text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={fetchAllConfigs}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mt-10 px-5 max-w-xl mx-auto">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        {/* Receiver ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receiver ID <span className="text-red-500">*</span>
          </label>
          <select
            {...register('receiverId', { required: true })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.receiverId ? 'border-red-500' : 'border-gray-300'
              }`}
            disabled={receiverList.length === 0}>
            <option value="">Select Receiver</option>
            {receiverList.map((receiver) => (
              <option key={receiver.id} value={receiver.id}>
                {receiver.name}
              </option>
            ))}
          </select>
          {errors.receiverId && (
            <p className="text-sm text-red-600">Receiver ID is required</p>
          )}
          {receiverList.length === 0 && !loading && (
            <p className="text-sm text-yellow-600">No receivers available</p>
          )}
        </div>

        {/* Display fixed settings information */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium mb-2">Receiver Settings (Fixed Values)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500">
                Time Interval
              </label>
              <div className="p-2 bg-white rounded border">
                {fixedReceiverSettings.timeInterval} seconds
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500">
                Allocated Time
              </label>
              <div className="p-2 bg-white rounded border">
                {fixedReceiverSettings.allocatedTime} minutes
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500">
                Total Collars
              </label>
              <div className="p-2 bg-white rounded border">
                {fixedReceiverSettings.totalCollars}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500">
                Sync Max Retry
              </label>
              <div className="p-2 bg-white rounded border">
                {fixedReceiverSettings.syncMaxRetry}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden fields to maintain form structure */}
        <input type="hidden" {...register('timeInterval')} />
        <input type="hidden" {...register('allocatedTime')} />
        <input type="hidden" {...register('totalCollars')} />
        <input type="hidden" {...register('syncMaxRetry')} />

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
            disabled={receiverList.length === 0 || isFetchingSettings}>
            {selectedSettings ? 'Update Configuration' : 'Create Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfigSettings;

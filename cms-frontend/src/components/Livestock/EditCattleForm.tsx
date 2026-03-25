import { useEffect, useState } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { IoMdCloseCircleOutline } from 'react-icons/io';
import Axios, { axiosPrivate } from '../../services/Axios';
import { CattleData } from '../Interface';

const EditCattleForm = () => {
  const { cattleId } = useParams<{ cattleId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cattleData, setCattleData] = useState<CattleData | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const fetchCattle = async () => {
    try {
      const response = await axiosPrivate.get(`/api/cattle/${cattleId}`);
      const data = response.data;
      setCattleData(data);
      setValue('cattleId', data.cattleId);
      setValue('deviceId', data.deviceId || '');
    } catch (err) {
      console.error('Error fetching cattle data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCattle();
  }, [cattleId, setValue]);

  const closeForm = () => {
    navigate('/livestock');
  };

  const onSubmit = async (data: FieldValues) => {
    try {
      const updatedData = {
        ...cattleData,
        deviceId: data.deviceId,
      };

      const response = await Axios.put('/api/cattle', updatedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Cattle updated successfully: ', response.data);
      closeForm();
    } catch (error) {
      console.error('Error updating cattle: ', error);
    }
  };

  if (loading || !cattleData) return null;

  return (
    <div className="absolute inset-0 flex justify-center items-center bg-opacity-100 backdrop-blur-lg z-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-white">Edit Cattle</h1>
            <button
              onClick={closeForm}
              type="button"
              className="text-white hover:text-gray-300 transition-colors duration-200"
              aria-label="Close form">
              <IoMdCloseCircleOutline className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="cattleId"
              className="block text-sm font-medium text-gray-700 mb-1">
              Cattle ID
            </label>
            <input
              id="cattleId"
              type="text"
              {...register('cattleId')}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="deviceId"
              className="block text-sm font-medium text-gray-700 mb-1">
              Device ID
            </label>
            <input
              id="deviceId"
              type="text"
              {...register('deviceId')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                errors.deviceId
                  ? 'border-red-500 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-green-300'
              }`}
              placeholder="Enter device ID"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={closeForm}
            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
            Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCattleForm;

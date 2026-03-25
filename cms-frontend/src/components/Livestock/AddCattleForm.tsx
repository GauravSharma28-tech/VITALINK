import { useEffect } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { IoMdCloseCircleOutline } from 'react-icons/io';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';
import { useNavigate } from 'react-router-dom';

const AddCattleForm = () => {
  const navigate = useNavigate();
  const axiosPrivate = UseAxiosPrivate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const closeAddCattleForm = () => {
    navigate('/livestock');
  };

  const onSubmit = async (data: FieldValues) => {
    try {
      const formatedData = {
        ...data,
        cattleId: data.cattleId,
        cattleName: data.cattleName,
        addedOn: new Date().toISOString(),
      };
      console.log(formatedData);
      // const response = await addCattle(formatedData);
      const response = axiosPrivate.post('/api/cattle', formatedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Cattle added successfully: ', (await response).data);
      closeAddCattleForm();
    } catch (error) {
      console.error('Error adding cattle: ', error);
    }
  };

  useEffect(() => { }, []);

  return (
    <div className="absolute inset-0 flex justify-center items-center bg-opacity-100 backdrop-blur-lg">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Form Header */}
        <div className="bg-green-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-white">Add New Cattle</h1>
            <button
              onClick={closeAddCattleForm}
              className="text-white hover:text-gray-300 transition-colors duration-200"
              aria-label="Close form">
              <IoMdCloseCircleOutline className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Cattle ID */}
          <div>
            <label
              htmlFor="cattleId"
              className="block text-sm font-medium text-gray-700 mb-1">
              Cattle ID <span className="text-red-500">*</span>
            </label>
            <input
              id="cattleId"
              type="text"
              {...register('cattleId', { required: true })}
              placeholder="Enter the cattle RFID"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.cattleId
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-green-200'
                }`}
            />
            {errors.cattleId?.type === 'required' && (
              <p className="mt-1 text-sm text-red-600">Cattle ID is required</p>
            )}
          </div>

          {/* Device ID */}
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
              placeholder="Enter the device ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-300"
            />
          </div>
        </div>

        {/* Form Footer */}
        <div className="px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={closeAddCattleForm}
            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200">
            Add Cattle
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCattleForm;

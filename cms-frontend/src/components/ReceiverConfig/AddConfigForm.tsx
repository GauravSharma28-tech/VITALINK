import { useEffect } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { IoMdCloseCircleOutline } from 'react-icons/io';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';
import { useNavigate } from 'react-router-dom';

const AddConfigForm = () => {
  const navigate = useNavigate();
  const axiosPrivate = UseAxiosPrivate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const closeAddConfiForm = () => {
    navigate('/configure');
  };

  const onSubmit = async (data: FieldValues) => {
    try {
      const formattedData = {
        zoneName: data.zoneName,
        zoneId: data.zoneId,
        receiverId: data.receiverId,
      };

      console.log('Submitting:', formattedData);

      const response = await axiosPrivate.post(
        '/api/configurations/new-config',
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Configuration added successfully: ', response.data);
      closeAddConfiForm();
    } catch (error) {
      console.error('Error adding configuration: ', error);
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
            <h1 className="text-xl font-semibold text-white">
              Add Configuration
            </h1>
            <button
              onClick={closeAddConfiForm}
              className="text-white hover:text-gray-300 transition-colors duration-200"
              aria-label="Close form">
              <IoMdCloseCircleOutline className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Zone Name */}
          <div>
            <label
              htmlFor="zoneName"
              className="block text-sm font-medium text-gray-700 mb-1">
              Zone Name <span className="text-red-500">*</span>
            </label>
            <input
              id="zoneName"
              type="text"
              {...register('zoneName', { required: true })}
              placeholder="Enter Zone Name"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.zoneName
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-green-200'
                }`}
            />
            {errors.zoneName && (
              <p className="mt-1 text-sm text-red-600">Zone Name is required</p>
            )}
          </div>

          {/* Zone ID */}
          <div>
            <label
              htmlFor="zoneId"
              className="block text-sm font-medium text-gray-700 mb-1">
              Zone ID <span className="text-red-500">*</span>
            </label>
            <input
              id="zoneId"
              type="text"
              {...register('zoneId', { required: true })}
              placeholder="Enter Zone ID"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.zoneId
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-green-200'
                }`}
            />
            {errors.zoneId && (
              <p className="mt-1 text-sm text-red-600">Zone ID is required</p>
            )}
          </div>

          {/* Receiver ID */}
          <div>
            <label
              htmlFor="receiverId"
              className="block text-sm font-medium text-gray-700 mb-1">
              Receiver ID <span className="text-red-500">*</span>
            </label>
            <input
              id="receiverId"
              type="text"
              {...register('receiverId', { required: true })}
              placeholder="Enter Receiver ID"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.receiverId
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-green-200'
                }`}
            />
            {errors.receiverId && (
              <p className="mt-1 text-sm text-red-600">
                Receiver ID is required
              </p>
            )}
          </div>
        </div>

        {/* Form Footer */}
        <div className="px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={closeAddConfiForm}
            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200">
            Add Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddConfigForm;

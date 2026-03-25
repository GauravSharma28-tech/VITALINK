import { IoMdCloseCircleOutline } from 'react-icons/io';
import { useNavigate, useParams } from 'react-router-dom';
import UseAxiosPrivate from '../../hooks/UseAxiosPrivate';
import { useState } from 'react';

const DeleteConformation = () => {
  const navigate = useNavigate();
  const axiosPrivate = UseAxiosPrivate();
  const { cattleId } = useParams<{ cattleId: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  // delete cattle data
  const deleteCattle = async () => {
    try {
      setIsDeleting(true);
      await axiosPrivate.delete(`/api/cattle/${cattleId}`);
      console.log(`Cattle with ID ${cattleId} deleted successfully`);
      navigate('/livestock');
    } catch (error) {
      console.error(`Error deleting cattle with ID ${cattleId}:`, error);
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="absolute inset-0 flex justify-center items-center bg-opacity-1000 backdrop-blur-xl">
      <div className="bg-white border border-gray-100 w-full max-w-md p-6 rounded-lg shadow-2xl relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Delete Confirmation
          </h2>
          <button
            onClick={() => navigate('/livestock')}
            className="text-gray-400 hover:text-gray-700 transition duration-200"
            aria-label="Close">
            <IoMdCloseCircleOutline className="text-2xl" />
          </button>
        </div>

        <p className="text-md text-gray-700 mb-2">
          Are you sure you want to delete this cattle record?
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Please note that deleting a cattle record will also remove all
          associated data, including sensor readings and health records and this
          cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => navigate('/livestock')}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => {
              deleteCattle();
            }}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConformation;

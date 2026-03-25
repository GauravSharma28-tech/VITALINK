import { SubmitHandler, useForm } from 'react-hook-form';
import { useContext, useState, useEffect } from 'react';
import {
  changePassword,
  getUserDetails,
  updateUserDetails,
} from '../services/AuthServices';
import GlobalContext from '../context/GlobalContext';
import axios from 'axios';
import {
  FaEdit,
  FaUserCircle,
  FaEnvelope,
  FaMapMarkerAlt,
  FaLock,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import { FiUser, FiMail, FiHome, FiKey } from 'react-icons/fi';

type ChangePasswordFields = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type UserDetailsFields = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
};

const Profile = () => {
  const { auth, setAuth, setSelectedMenu } = useContext(GlobalContext);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'password'>('details');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    setError: setPasswordError,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
    watch,
  } = useForm<ChangePasswordFields>();

  const {
    register: registerDetails,
    handleSubmit: handleDetailsSubmit,
    formState: { errors: detailsErrors, isSubmitting: isDetailsSubmitting },
    reset: resetDetails,
    setValue,
  } = useForm<UserDetailsFields>();

  useEffect(() => setSelectedMenu('Profile'), [setSelectedMenu]);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await getUserDetails(auth.accessToken);
        const userData = response.data;
        setAuth({
          ...auth,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          address: userData.address,
        });
      } catch (error) {
        console.log('Error in fetching');
        // setMessage({ type: 'error', text: 'Failed to fetch user details' });
      }
    };
    if (auth.accessToken) fetchUserDetails();
  }, [auth.accessToken]);

  useEffect(() => {
    if (auth) {
      setValue('email', auth.email);
      setValue('firstName', auth.firstName);
      setValue('lastName', auth.lastName);
      setValue('address', auth.address);
    }
  }, [auth, setValue]);

  // Auto dismiss message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const onPasswordSubmit: SubmitHandler<ChangePasswordFields> = async (
    data
  ) => {
    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('confirmPassword', {
        message: 'Passwords do not match',
      });
      return;
    }
    try {
      await changePassword(
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        auth.accessToken
      );
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      resetPassword();
      setIsEditing(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to change password',
        });
      }
    }
  };

  const onDetailsSubmit: SubmitHandler<UserDetailsFields> = async (data) => {
    try {
      await updateUserDetails(data, auth.accessToken);
      setAuth({ ...auth, ...data });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to update profile',
        });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {message && (
        <div
          className={`flex items-center p-4 mb-6 rounded-lg ${
            message.type === 'success'
              ? 'bg-purple-50 text-purple-800'
              : 'bg-red-50 text-red-800'
          }`}>
          {message.type === 'success' ? (
            <FaCheckCircle className="mr-3 text-purple-500" />
          ) : (
            <FaTimesCircle className="mr-3 text-red-500" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative">
          <FaUserCircle className="text-purple-500 text-7xl" />
          {isEditing && (
            <button className="absolute -bottom-2 -right-2 bg-purple-500 text-white p-2 rounded-full shadow-md hover:bg-purple-600 transition">
              <FaEdit className="text-sm" />
            </button>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {auth.firstName} {auth.lastName}
          </h1>
          <p className="text-gray-500 flex items-center mt-1">
            <FaEnvelope className="mr-2 text-gray-400" />
            {auth.email}
          </p>
          {auth.address && (
            <p className="text-gray-500 flex items-center mt-1">
              <FaMapMarkerAlt className="mr-2 text-gray-400" />
              {auth.address}
            </p>
          )}
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm ${
            isEditing
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          } transition-colors`}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mt-8">
        <button
          onClick={() => setActiveTab('details')}
          className={`py-3 px-6 font-medium text-sm flex items-center ${
            activeTab === 'details'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}>
          <FiUser className="mr-2" />
          Personal Details
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`py-3 px-6 font-medium text-sm flex items-center ${
            activeTab === 'password'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}>
          <FiKey className="mr-2" />
          Change Password
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-4">
        {activeTab === 'details' ? (
          <form onSubmit={handleDetailsSubmit(onDetailsSubmit)}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        {...registerDetails('firstName', {
                          required: 'First name is required',
                        })}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          detailsErrors.firstName
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                        } focus:ring-1 focus:outline-none`}
                      />
                      {detailsErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsErrors.firstName.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="px-4 py-2.5 text-gray-900 bg-gray-50 rounded-lg">
                      {auth.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        {...registerDetails('lastName', {
                          required: 'Last name is required',
                        })}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          detailsErrors.lastName
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                        } focus:ring-1 focus:outline-none`}
                      />
                      {detailsErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsErrors.lastName.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="px-4 py-2.5 text-gray-900 bg-gray-50 rounded-lg">
                      {auth.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiMail className="mr-2 text-gray-400" />
                  Email
                </label>
                {isEditing ? (
                  <div>
                    <input
                      {...registerDetails('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        detailsErrors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                      } focus:ring-1 focus:outline-none`}
                    />
                    {detailsErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {detailsErrors.email.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="px-4 py-2.5 text-gray-900 bg-gray-50 rounded-lg">
                    {auth.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiHome className="mr-2 text-gray-400" />
                  Address
                </label>
                {isEditing ? (
                  <div>
                    <input
                      {...registerDetails('address')}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-purple-500 focus:border-purple-500 focus:ring-1 focus:outline-none"
                    />
                  </div>
                ) : (
                  <p className="px-4 py-2.5 text-gray-900 bg-gray-50 rounded-lg">
                    {auth.address || 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isDetailsSubmitting}
                  className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-70 disabled:cursor-not-allowed">
                  {isDetailsSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaLock className="mr-2 text-gray-400" />
                  Current Password
                </label>
                <div>
                  <input
                    type="password"
                    {...registerPassword('currentPassword', {
                      required: 'Current password is required',
                    })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      passwordErrors.currentPassword
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                    } focus:ring-1 focus:outline-none`}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaLock className="mr-2 text-gray-400" />
                  New Password
                </label>
                <div>
                  <input
                    type="password"
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      passwordErrors.newPassword
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                    } focus:ring-1 focus:outline-none`}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaLock className="mr-2 text-gray-400" />
                  Confirm Password
                </label>
                <div>
                  <input
                    type="password"
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === watch('newPassword') ||
                        'Passwords do not match',
                    })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      passwordErrors.confirmPassword
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                    } focus:ring-1 focus:outline-none`}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isPasswordSubmitting}
                  className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-70 disabled:cursor-not-allowed">
                  {isPasswordSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing...
                    </span>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;

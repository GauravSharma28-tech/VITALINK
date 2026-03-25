import Axios from './Axios';

type SignUpFormFields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
};

type LoginFormFields = {
  email: string;
  password: string;
};

type ChangePasswordFields = {
  currentPassword: string;
  newPassword: string;
};

type UserDetailsFields = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
};

// End points
const SIGN_UP = '/api/auth/signup';
const LOGIN = '/api/auth/login';
const CHANGE_PASSWORD = '/api/auth/change-password';
const GET_USER_DETAILS = '/api/auth/user-details';
const UPDATE_USER_DETAILS = '/api/auth/update-details';

export const signup = (data: SignUpFormFields) =>
  Axios.post(SIGN_UP, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const login = (data: LoginFormFields) =>
  Axios.post(LOGIN, data, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

export const changePassword = (data: ChangePasswordFields, token: string) =>
  Axios.post(CHANGE_PASSWORD, data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

export const getUserDetails = (token: string) =>
  Axios.get(GET_USER_DETAILS, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

export const updateUserDetails = (data: UserDetailsFields, token: string) =>
  Axios.put(UPDATE_USER_DETAILS, data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

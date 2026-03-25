import axios from 'axios';
import { io } from 'socket.io-client';

// Base URL for the API
export const BASE_URL = 'http://localhost:5010';

export default axios.create({
  baseURL: BASE_URL,
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const socket = io(`${BASE_URL}`);

import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const setSocketIOInstance = (io: Server) => {
  ioInstance = io;
};

export const getSocketIOInstance = () => {
  return ioInstance;
};

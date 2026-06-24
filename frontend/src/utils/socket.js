import { io } from 'socket.io-client';

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${defaultHost}:5001`;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const joinKapsterRoom = (kapsterId) => {
  getSocket().emit('join:kapster', kapsterId);
};

export const joinAdminRoom = () => {
  getSocket().emit('join:admin');
};

export const joinQueueRoom = (queueNumber) => {
  getSocket().emit('join:queue', queueNumber);
};

export const leaveQueueRoom = (queueNumber) => {
  getSocket().emit('leave:queue', queueNumber);
};

export const joinPublicQueue = () => {
  getSocket().emit('join:queue', 'public');
};

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;
let initPromise = null;
const listeners = new Set(); // components waiting for socket

const notifyListeners = () => {
  listeners.forEach(fn => fn(socketInstance));
};

const initSocket = async () => {
  if (socketInstance?.connected) return socketInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let token = localStorage.getItem('accessToken');
    if (!token || token === 'undefined' || token === 'null') return null;

    // Check expiry and refresh if needed
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        const rt = localStorage.getItem('refreshToken');
        if (!rt || rt === 'undefined') return null;
        const { default: axios } = await import('axios');
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          { token: rt }
        );
        token = res.data.accessToken;
        if (!token) return null;
        localStorage.setItem('accessToken', token);
      }
    } catch { return null; }

    return new Promise((resolve) => {
      const socket = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        socketInstance = socket;
        window.__socket = socket;
        initPromise = null;
        notifyListeners(); // tell all components socket is ready
        resolve(socket);
      });

      socket.on('disconnect', (r) => {
        console.log('🔌 Disconnected:', r);
        if (r === 'io server disconnect') {
          socketInstance = null;
          initPromise = null;
        }
      });

      socket.on('connect_error', (e) => {
        console.error('❌ Socket error:', e.message);
        initPromise = null;
        if (e.message?.includes('Authentication') || e.message?.includes('Invalid')) {
          socket.disconnect();
          socketInstance = null;
        }
        resolve(null);
      });
    });
  })();

  return initPromise;
};

const useSocket = () => {
  const [socket, setSocket] = useState(() => socketInstance?.connected ? socketInstance : null);

  useEffect(() => {
    let active = true;

    // Register as listener — called when socket connects
    const onReady = (s) => {
      if (active && s) setSocket(s);
    };
    listeners.add(onReady);

    // Try to get socket immediately
    if (socketInstance?.connected) {
      setSocket(socketInstance);
    } else {
      initSocket().then(s => {
        if (active && s) setSocket(s);
      });
    }

    return () => {
      active = false;
      listeners.delete(onReady);
    };
  }, []);

  return socket;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    initPromise = null;
  }
};

export default useSocket;
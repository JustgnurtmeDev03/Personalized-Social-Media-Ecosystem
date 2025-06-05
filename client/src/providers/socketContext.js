import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    if (auth.accessToken) {
      const newSocket = io("http://localhost:5000", {
        auth: { token: auth.accessToken },
      });

      newSocket.on("connect", () => {
        newSocket.emit("join", auth.userId);
      });

      setSocket(newSocket);

      return () => newSocket.disconnect();
    }
  }, [auth.accessToken]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

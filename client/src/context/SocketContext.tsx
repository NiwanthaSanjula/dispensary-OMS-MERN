import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Socket Context
 * Creates a SINGLE Socket.io connection for the entire app
 * All components share this one instance - no duplicate connections
 * 
 * Connected to the same Railway URL as the API
*/
interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Init socket connection
        const socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],    //  Fallback to polling if websocket fails
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Connection event handlers
        socketInstance.on("connect", () => {
            console.log("🔌 Socket connected:", socketInstance.id);
            setIsConnected(true)
        });

        socketInstance.on("disconnect", (reason) => {
            console.log("🔌 Socket disconnected", reason);
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
            console.error("🔌 Socket connection error: ", error);
            setIsConnected(false);
        });

        setSocket(socketInstance);

        //  Cleanup - disconnect when app unmounts
        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

/**
 * useSocket hook - access socket instance anywhere in the app
*/
export const useSocket = () => useContext(SocketContext);

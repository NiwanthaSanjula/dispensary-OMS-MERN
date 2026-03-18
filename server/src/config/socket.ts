import { Server as HttpServer } from "http";
import { Server as SocketServer } from 'socket.io'
import { ENV } from "./env";

/**
 * Socket.io Server init
 * Attached to the same HTTP server as express
 * Configured with CORS to allow frontend connections
 */
export const initSocket = (httpServer: HttpServer): SocketServer => {
    const io = new SocketServer(httpServer, {
        cors: {
            origin: ENV.CLIENT_URL,
            methods: ["GET", "POST"],
            credentials: true,
        },
        // Use websocket first, fall back to polling
        transports: ["websocket", "polling"],
    });

    io.on("connection", (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        socket.on("disconnect", (reason) => {
            console.log(`🔌 Client disconnected: ${socket.id} - ${reason}`);
        });
    });

    return io;
};
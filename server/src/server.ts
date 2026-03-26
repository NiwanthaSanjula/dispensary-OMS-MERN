import "dotenv/config"; // Load .env variables FIRST before any other imports
import http from "http";
import createApp from "./app";
import { connectDB } from "./config/db";
import { ENV } from "./config/env";
import { initSocket } from "./config/socket";

/**
 * Server Entry Point
 * Order matters:
 * 1. Load .env vars
 * 2. Connect to MongoDB
 * 3. Create Express app
 * 4. Create HTTP server
 * 5. Attach Socket.io to HTTP server
 * 6. Store io instance on app (accessible in controllers via req.app.get('io'))
 * 7. Start listening
 * 
 * Socket.io will be attached here in phase 4
*/

const startServer = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Create Express app with all middleware
        const app = createApp();

        // Create HTTP server
        const server = http.createServer(app);

        // Init Socket.io and attach to HTTP server
        const io = initSocket(server);

        // Make io accessible in all controllers via req.app.get('io')
        app.set("io", io)

        // Start listening
        const PORT = parseInt(ENV.PORT, 10);
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} in ${ENV.NODE_ENV} mode`);
            console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🔌 Socket.io ready`);

        });

        // Greateful shutdown - close DB connection on process exits
        process.on("SIGTERM", () => {
            console.log("SIGTERM received.Shutting down...");
            server.close(() => {
                console.log("Server Closed.");
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("❌ Failed to start server: ", error);
        process.exit(1)
    }
};

startServer();


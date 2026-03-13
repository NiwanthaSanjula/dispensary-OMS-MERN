import "dotenv/config"; // Load .env variables FIRST before any other imports
import http from "http";
import createApp from "./app";
import { connectDB } from "./config/db";
import { ENV } from "./config/env";

/**
 * Server Entry Point
 * Order matters:
 * 1. Load .env vars
 * 2. Connect to MongoDB
 * 3. Create Express app
 * 4. Create HTTP server
 * 5. Start listening
 * 
 * Socket.io will be attached here in phase 4
*/

const startServer = async (): Promise<void> => {
    try {
        //  step 1: Connect to MongoDB
        await connectDB();

        // step 2: Create Express app with all middleware
        const app = createApp();

        // step 3: Create HTTP server
        const server = http.createServer(app);

        // step 4: Start listening
        const PORT = parseInt(ENV.PORT, 10);
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} in ${ENV.NODE_ENV} mode`);
            console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
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


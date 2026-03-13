import mongoose from "mongoose";
import { ENV } from "./env";

/**
 * MongoDB Atlas connection
 * Uses mongoose.connect with retry logic on failure
 * Called once on server startup - if it fails, the app exits
*/

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(ENV.MONGODB_URI, {
            //  These options ensure stable connection behavior
            serverSelectionTimeoutMS: 5000, // Timeout after 5s if no server found
            socketTimeoutMS: 45000, //  Close socket after 45s of inactivity
            family: 4
        });

        console.log(`✅ MongoDB connected: ${conn.connection.host}`);

        //  Handle connection events for better observability
        mongoose.connection.on("error", (err) => {
            console.error(`❌ MongoDB connection error: ${err}`);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB disconnected");
        });

    } catch (error) {
        console.log("❌ MongoDB connection error: ", error);
        process.exit(1); // Exit process - no point running without DB
    }
};
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors"
import { ENV } from "./config/env";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import queueRoutes from "./routes/queue.routes";
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import consultationRoutes from "./routes/consultation.routes";
import prescriptionRoutes from "./routes/prescription.routes"
import medicineRoutes from "./routes/medicine.routes"



/**
 * Express Application Factory
 * Sets up all middleware in the correct order:
 * Security -> Parsing -> Logging -> Routes -> Error Handle
*/


const createApp = (): Application => {
    const app = express();

    // Security Middleware----------------------------------------------------------------------
    // helmet sets secure HTTP headers (XSS protection, HSTS, etc...)
    app.use(helmet());

    // CORS - only allow requests from our frontend URL
    app.use(cors({
        origin: ENV.CLIENT_URL,
        credentials: true,  //  Required for httpOnly cookie (refresh token)
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));

    // Parsing Middleware----------------------------------------------------------------------
    app.use(express.json({ limit: "10kb" }));         // Parse JSON, limit body size
    app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded data
    app.use(cookieParser());                          // Parse cookies (for refresh tokens)

    // Loggin Middleware-----------------------------------------------------------------------
    // 'dev' format: colorized output, method, path, status, response time
    if (ENV.NODE_ENV === "development") {
        app.use(morgan("dev"))
    }

    // Health Check----------------------------------------------------------------------------
    // Railway and vercel ping this to confirm the service is alive
    app.get("/api/health", (_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            message: "Dispensary API is running",
            environment: ENV.NODE_ENV,
            timeStamp: new Date().toISOString()
        });
    });

    //  API Routes-----------------------------------------------------------------------------
    app.use("/api/auth/", authRoutes);
    app.use("/api/queue/", queueRoutes);
    app.use("/api/patients", patientRoutes);
    app.use("/api/appointments", appointmentRoutes);
    app.use("/api/consultations", consultationRoutes);
    app.use("/api/prescriptions", prescriptionRoutes);
    app.use("/api/medicines", medicineRoutes);




    /*app.get("/api/seed-settings", async (_req, res) => {
        const { Settings } = await import("./models/Setting.model");
        const existing = await Settings.findOne();
        if (!existing) {
            await Settings.create({
                dispensaryName: "Demo Dispensary",
                doctorName: "Dr.Unknown",
                openningTime: "09:00",
                closingTime: "17:00",
                avgConsultationMinutes: 20,
                maxDailyLimit: 40,
                advanceBookingDays: 7,
            });
        }
        res.json({ message: "Settings seeded" })
    })*/



    //  404 Handler----------------------------------------------------------------------------
    app.use((_req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            message: "Route not found!"
        })
    });

    //  Global Error Handler-------------------------------------------------------------------
    app.use(errorHandler);

    return app;
}

export default createApp;
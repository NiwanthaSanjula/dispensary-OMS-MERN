import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { ENV } from "../config/env";

/**
 * Global Error Handler Middleware
 * Must be mounted LAST in app.ts (after all routes)
 * Catches all errors thrown anywhere in the app via next(error) or throw
 * 
 * Return consistent JSON error shape:
 * { success: false, message: "...", stack: "..."(dev only)}
*/

export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    _next: NextFunction     // Must have 4 params for express to recognoze as error handler
): void => {

    //  Default to 500 if statusCode not set
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const message = err.message || "Internal Server Error"

    //  Only expose stack traces in development - never in production
    const response: Record<string, unknown> = {
        success: false,
        message
    };

    if (ENV.NODE_ENV === "development") {
        response.stack = err.stack
    }

    console.error(`❌ [${req.method}] ${req.path} - ${statusCode}: ${message}`);

    res.status(statusCode).json(response);
}
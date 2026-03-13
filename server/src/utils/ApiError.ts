/**
 * Custom API Error class
 * Extends the native Error to include HTTP status code
 * Used throughout the app to throw consistent, catchable errors
*/

export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Mark this as a known, expected error

        //  Maintains proper stack trace in V8 engines (node js)
        Error.captureStackTrace(this, this.constructor);
    }
}

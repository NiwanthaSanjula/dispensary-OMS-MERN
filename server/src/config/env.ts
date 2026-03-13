/**
 * Environment variables configuration
 * All env vars are validated on startup - the app crashes immediately
 * if any required variable is missing, rather than failling silently later
*/

const getEnvVar = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

export const ENV = {
    PORT: process.env.PORT || "5000",
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGODB_URI: getEnvVar("MONGODB_URI"),
    JWT_ACCESS_SECRET: getEnvVar("JWT_ACCESS_SECRET"),
    JWT_REFRESH_SECRET: getEnvVar("JWT_REFRESH_SECRET"),
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    GEMINI_API_KEY: getEnvVar("GEMINI_API_KEY"),
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || "",
    REPORT_API_KEY: process.env.REPORT_API_KEY || ""

}

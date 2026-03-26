import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ENV } from "../config/env";
import { User } from "../models/User.model";

/**
 * Extend Express Request to include authenticated user
 * After verifyJWT runs, req.user is always available in the controller
*/
declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: string;
                role: "doctor" | "assistant" | "patient";
                name: string,
                email: string
            };
        }
    }
}

/**
 * verifyJWT Middleware
 * Checks Authorization header for bearer token
 * Decode and verify the JWT
 * Attaches the user payload to req.user for downstream controllers
 * 
 * Usage: router.get('/protected', verifyJWT, controller)
*/

export const verifyJWT = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
        //  Extract token from authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Access token is missing or invalid");
        }

        const token = authHeader.split(" ")[1];

        // Catch JWT errors explicitly and convert to 401 __________________________________________
        // Without this, jwt.verify() throws TokenExpiredError which
        // gets caught by asyncHandler and becomes a 500 error.
        // The frontend interceptor only retries on 401 — so it never fires.
        let decoded: {
            _id: string;
            role: "doctor" | "assistant" | "patient";
            name: string;
            email: string;
        };

        try {
            decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as typeof decoded;
        } catch (jwtError) {
            //  Convert all jwt errors to 401 so the frontend interceptor can catch them
            if (jwtError instanceof jwt.TokenExpiredError) {
                throw new ApiError(401, "Access token has expired");
            }
            if (jwtError instanceof jwt.JsonWebTokenError) {
                throw new ApiError(401, "Invalid access token");
            }
            // Unknown jwt error
            throw new ApiError(401, "Authentication failed");
        }

        //  Confirm user still exists and is active
        const user = await User.findById(decoded._id).select("-password");
        if (!user || !user.isActive) {
            throw new ApiError(401, "User no longer exists or has been deactivated");
        }

        //  Attach user to the request - available in all downstram middleware + controllers
        req.user = {
            _id: decoded._id,
            role: decoded.role,
            name: decoded.name,
            email: decoded.email
        };

        next();
    }
);

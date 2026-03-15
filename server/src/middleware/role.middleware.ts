/**
 * authorizeRoles - Role-Based Access Control (RBAC) middleware factory
 * Returns a middleware function that checks if req.user.role is allowed
 * 
 * Usage:
 *      router.post('/consultation', verifyJWT, authorizeRoles('docto'r), create)
 *      router.post('/patients', verifyJWT, authorizeRoles('doctor', 'assistant'), list)
 *
 *  
 * Always use AFTER verifyJWT - req.user must exist before role checks
*/

import { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/ApiError"

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        //  req.user is guranteed to exist here 
        if (!req.user || !roles.includes(req.user.role)) {
            throw new ApiError(403, `Access denied. Required role: ${roles.join(" or ")}`);
        }
        next();
    };
};
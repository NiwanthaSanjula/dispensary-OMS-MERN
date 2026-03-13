import { Request, Response, NextFunction } from "express";

/**
 * asyncHandler - eliminates try/catch boilerplate in every controller
 * Wraps any async route handler and forward errors to Express error middleware
 * 
 * Usage:
 *      router.get('/route', asyncHandler(async (req, res) => {
 *      const data = await someAsyncOperation();
 *      res.json(data);
 * }));
 */

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next)
    };
};
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Settings } from "../models/Setting.model";
import { User } from "../models/User.model";
import bcrypt from "bcryptjs";

/**
 * Settings Controller
 * Doctor manages dispensary configuration
 */

// GET /api/settings
export const getSettings = asyncHandler(
    async (_req: Request, res: Response) => {
        const settings = await Settings.findOne();
        if (!settings) throw new ApiError(404, "Settings not configured");
        res.status(200).json(new ApiResponse("Settings fetched", settings));
    }
);

// PUT /api/settings
export const updateSettings = asyncHandler(
    async (req: Request, res: Response) => {
        const {
            dispensaryName,
            doctorName,
            openingTime,
            closingTime,
            avgConsultationMinutes,
            maxDailyLimit,
            advanceBookingDays,
        } = req.body;

        const settings = await Settings.findOneAndUpdate(
            {},
            {
                dispensaryName,
                doctorName,
                openingTime,
                closingTime,
                avgConsultationMinutes,
                maxDailyLimit,
                advanceBookingDays,
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json(
            new ApiResponse("Settings updated successfully", settings)
        );
    }
);

// PUT /api/settings/password
export const changePassword = asyncHandler(
    async (req: Request, res: Response) => {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw new ApiError(400, "Current and new password are required");
        }

        if (newPassword.length < 8) {
            throw new ApiError(
                400, "New password must be at least 8 characters"
            );
        }

        // Get user with password
        const user = await User.findById(req.user!._id).select("+password");
        if (!user) throw new ApiError(404, "User not found");

        // Verify current password
        const isCorrect = await user.comparePassword(currentPassword);
        if (!isCorrect) {
            throw new ApiError(401, "Current password is incorrect");
        }

        // Update password — pre-save hook hashes it
        user.password = newPassword;
        await user.save();

        res.status(200).json(
            new ApiResponse("Password changed successfully", {})
        );
    }
);
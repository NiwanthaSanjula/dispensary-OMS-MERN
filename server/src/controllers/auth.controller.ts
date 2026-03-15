import { Request, Response } from "express";
import jwt from "jsonwebtoken"
import { ENV } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/User.model";
import { ApiError } from "../utils/ApiError";
import { Patient } from "../models/Patient.model";
import { ApiResponse } from "../utils/ApiResponse";


/**
 * Generate JWT access token (15 min lived)
 * Contain minimal payload - just what controllers need
*/
const generateAccessToken = (user: {
    _id: string;
    role: string;
    name: string;
    email: string;
}): string => {
    return jwt.sign(
        { _id: user._id, role: user.role, name: user.name, email: user.email },
        ENV.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );
};


/**
 * Generate JWT refresh token (7 days lived)
 * Contain only _id - used solely to issue new access tokens
*/
const generateRefreshToken = (userId: string): string => {
    return jwt.sign(
        { _id: userId },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
};


/**
 * Set refresh token as httpOnly cookie
 * httpOnly = Javascript cannot access it (XSS Protection)
 * secure = only sent over HTTPS in production
 * sameSite = CSRF protection
*/
const setRefreshTokenCookie = (res: Response, token: string): void => {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000     // 7 days in milliseconds
    });
};

/**_____________________________________________________________________________________________________________

 * REGISTER NEW PATIENT
 * @route POST /api/auth/register
 * _____________________________________________________________________________________________________________
*/
export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, phone, dateOfBirth, gender } = req.body;

    //  Validate required fields
    if (!name || !email || !password || !phone) {
        throw new ApiError(400, "Name, email, password, and phone are required")
    }

    //  Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "An account with this email already exist");
    }

    // Check if phone already has a patient record
    const existingPatient = await Patient.findOne({ phone });

    //  Create User record ( role is always "patient" for self-register)
    const user = await User.create({
        name,
        email,
        password, // Will be hashed by pre-save hook in User model
        role: "patient",
        phone,
    });

    if (existingPatient) {
        // Link existing patient record to the new user account
        // This handles the case: patient booked as guest before, now creating account
        existingPatient.userId = user._id as unknown as typeof existingPatient.userId;
        await existingPatient.save();

    } else {
        // Create new patient record for this new user
        await Patient.create({
            userId: user._id,
            name,
            phone,
            email,
            dateOfBirth,
            gender,
        });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
        _id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email
    });
    const refreshToken = generateRefreshToken(user._id.toString());

    // Set refresh token in httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json(
        new ApiResponse("Registration successful", {
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            },
        })
    );
});


/**_____________________________________________________________________________________________________________

 * LOGIN
 * @route POST /api/auth/login
 * _____________________________________________________________________________________________________________
*/
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required")
    }

    //  Find user - expilicity select password (Tt's excluded by default)
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.isActive) {
        //  Use generic message = don't reveal whether email exists (for security)
        throw new ApiError(401, "Invalid email or password");
    }

    //  Compare password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid email or password")
    }

    //  Generate tokens
    const accessToken = generateAccessToken({
        _id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email
    });
    const refreshToken = generateRefreshToken(user._id.toString());

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json(
        new ApiResponse("Login successful", {
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        })
    )
})


/**_____________________________________________________________________________________________________________

 * REFRESH
 * @route POST /api/auth/refresh
 * @desc Issue new access token using refresh token
 * _____________________________________________________________________________________________________________
*/
export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        throw new ApiError(401, "Refresh token not found");
    }

    //  Verify refresh token
    const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as { _id: string }

    const user = await User.findById(decoded._id);
    if (!user || !user.isActive) {
        throw new ApiError(401, "user not found or deactivated");
    }

    //  Issue new access token
    const accessToken = generateAccessToken({
        _id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email
    });

    res.status(200).json(
        new ApiResponse("Token refreshed successfully", { accessToken })
    )
})


/**_____________________________________________________________________________________________________________

 * LOGOUT
 * @route POST /api/auth/logout
 * @desc  Clear refresh token cookie
 * _____________________________________________________________________________________________________________
*/
export const logout = asyncHandler(async (req: Request, res: Response) => {
    //  Clear the httpOnly cookie
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: "strict"
    });

    res.status(200).json(new ApiResponse("Logged out successfully", {}))
});
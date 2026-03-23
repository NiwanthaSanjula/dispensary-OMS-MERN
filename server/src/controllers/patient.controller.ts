import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import patientService from "../services/patient.service";
import { ApiResponse } from "../utils/ApiResponse";


/**
 * Patient controller
 * Just handles HTTP request/response
 */


export const getPatients = asyncHandler(async (req: Request, res: Response) => {
    const { search, phone } = req.query;

    const patients = await patientService.getAll(
        search as string || undefined,
        phone as string || undefined
    );
    res.status(200).json(new ApiResponse("Patients fetched successfully", patients));
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
    const patient = await patientService.getMyProfile(req.user!._id);
    res.status(200).json(new ApiResponse("Profile fetched", patient));
});

export const createPatient = asyncHandler(async (req: Request, res: Response) => {
    const patient = await patientService.create(req.body);
    res.status(200).json(new ApiResponse("Patient fetched successfully", patient));
});

export const getPatientById = asyncHandler(async (req: Request, res: Response) => {
    const patient = await patientService.getbyId(req.params.id as string);
    res.status(200).json(new ApiResponse("Patient fetched successfully", patient))
});

export const updatePatient = asyncHandler(async (req: Request, res: Response) => {
    const patient = await patientService.update(req.params.id as string, req.body);
    res.status(200).json(new ApiResponse("Patient updated successfully", patient))
});

export const getPatientHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await patientService.getHistory(req.params.id as string);
    res.status(200).json(new ApiResponse("Patient history fetched successfully", history))
});
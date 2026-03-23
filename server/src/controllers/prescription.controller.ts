import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import prescriptionService from "../services/prescription.service";
import { ApiResponse } from "../utils/ApiResponse";

export const createPrescription = asyncHandler(
    async (req: Request, res: Response) => {
        const prescription = await prescriptionService.create(
            req.body,
            req.user!._id // doctor's userId for StockLog.performedBy
        );
        res.status(201).json(
            new ApiResponse("Prescription issued successfully", prescription)
        );
    }
);

export const getPrescriptionById = asyncHandler(
    async (req: Request, res: Response) => {
        const prescription = await prescriptionService.getById(req.params.id as string);
        res.status(200).json(
            new ApiResponse("Prescription fetched", prescription)
        );
    }
);

export const getPrescriptionsByPatient = asyncHandler(
    async (req: Request, res: Response) => {
        const prescriptions = await prescriptionService.getByPatient(
            req.params.patientId as string
        );
        res.status(200).json(
            new ApiResponse("Prescriptions fetched", prescriptions)
        );
    }
);
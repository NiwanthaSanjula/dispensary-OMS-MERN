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

export const getMePatientPrescriptions = asyncHandler(
    async (req: Request, res: Response) => {
        const { Patient } = await import("../models/Patient.model");
        const patient = await Patient.findOne({ userId: req.user!._id });
        if (!patient) {
            res.status(200).json(
                new ApiResponse("No prescriptions found", [])
            );
            return;
        }
        const prescriptions = await prescriptionService.getByPatient(
            patient._id.toString()
        );
        res.status(200).json(
            new ApiResponse("Prescriptions fetched", prescriptions)
        );
    }
);

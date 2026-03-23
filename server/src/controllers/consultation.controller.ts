import { Request, Response } from 'express';
import { asyncHandler } from "../utils/asyncHandler";
import consultationService from '../services/consultation.service';
import { ApiResponse } from '../utils/ApiResponse';

export const createConsultation = asyncHandler(
    async (req: Request, res: Response) => {
        const consultation = await consultationService.create(req.body);
        res.status(201).json(
            new ApiResponse("Consultation created", consultation)
        );
    }
);

export const getConsultationById = asyncHandler(
    async (req: Request, res: Response) => {
        const consultation = await consultationService.getById(req.params.id as string);
        res.status(200).json(
            new ApiResponse("Consultation fetched", consultation)
        );
    }
);

export const updateConsultation = asyncHandler(
    async (req: Request, res: Response) => {
        const consultation = await consultationService.update(
            req.params.id as string,
            req.body
        );
        res.status(200).json(
            new ApiResponse("Consultation updated", consultation)
        );
    }
);

export const getConsultationsByPatient = asyncHandler(
    async (req: Request, res: Response) => {
        const consultations = await consultationService.getByPatient(
            req.params.patientId as string
        );
        res.status(200).json(
            new ApiResponse("Consultations fetched", consultations)
        );
    }
);

export const getConsultationByAppointment = asyncHandler(
    async (req: Request, res: Response) => {
        const consultation = await consultationService.getByAppointment(
            req.params.appointmentId as string
        );
        res.status(200).json(
            new ApiResponse("Consultation fetched", consultation)
        );
    }
);

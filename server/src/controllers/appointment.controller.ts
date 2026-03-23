import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import appointmentService from "../services/appointment.service";
import { ApiResponse } from "../utils/ApiResponse";

export const getAppointments = asyncHandler(async (req: Request, res: Response) => {
    const { date, status, patientId } = req.query;
    const appointments = await appointmentService.getAll({
        date: date as string | undefined,
        status: status as string | undefined,
        patientId: patientId as string | undefined,
    },
        req.user!._id,
        req.user!.role

    );
    res.status(200).json(new ApiResponse("Appointments fateched", appointments));
});

export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentService.getById(req.params.id as string);
    res.status(200).json(new ApiResponse("Appointment fetched", appointment));
});

export const updateAppointmentStatus = asyncHandler(async (req: Request, res: Response) => {
    const appointment = await appointmentService.updateStatus(
        req.params.id as string,
        req.body.status
    );
    res.status(200).json(new ApiResponse("Appointment status updated", appointment));
})
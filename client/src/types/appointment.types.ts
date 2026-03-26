export type AppointmentType = "online" | "manual";
export type AppointmentStatus = "waiting" | "serving" | "completed" | "noshow" | "cancelled";

export interface IAppointment {
    _id: string;
    patientId: string | { _id: string; name: string; phone: string };
    tokenNumber: number;
    tokenCode: string;
    type: AppointmentType;
    status: AppointmentStatus;
    date: string;
    estimatedTime: string;
    notes?: string;
    bookedBy: string;
    createdAt: string;
}
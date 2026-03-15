export interface IConsultation {
    _id: string;
    appointmentId: string;
    patientId: string;
    symptoms?: string;
    diagnosis?: string;
    notes?: string;
    followUpDate?: string;
    aiSummaryUsed: boolean
    createdAt: string
}
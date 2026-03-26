import type { IConsultation } from "../../types/consultation.types";
import api from "../axios";

export interface CreateConsultationPayload {
    appointmentId: string;
    patientId: string;
    symptoms?: string;
    diagnosis?: string;
    notes?: string;
    followUpDate?: string;
}

/**
 * Consultation Service
 * All consultation API calls — used by doctor consultation screen
 */

const consultationService = {

    /**
   * Create a new consultation
   * Linked to a specific appointment (must be status: serving)
   */
    create: async (
        payload: CreateConsultationPayload
    ): Promise<IConsultation> => {
        const { data } = await api.post<{ data: IConsultation }>(
            "/consultations",
            payload
        );
        return data.data;
    },

    /**
     * Get single consultation by ID
     */
    getById: async (id: string): Promise<IConsultation> => {
        const { data } = await api.get<{ data: IConsultation }>(
            `/consultations/${id}`
        );
        return data.data;
    },

    /**
     * Update consultation fields
     * Doctor edits symptoms, diagnosis, notes
     */
    update: async (
        id: string,
        payload: Partial<CreateConsultationPayload> & { aiSummaryUsed?: boolean }
    ): Promise<IConsultation> => {
        const { data } = await api.put<{ data: IConsultation }>(
            `/consultations/${id}`,
            payload
        );
        return data.data;
    },

    /**
   * Get all consultations for a patient
   * Used in visit history panel (right panel of consultation screen)
   */
    getByPatient: async (patientId: string): Promise<IConsultation[]> => {
        const { data } = await api.get<{ data: IConsultation[] }>(
            `/consultations/patient/${patientId}`
        );
        return data.data;
    },

    /**
   * Get consultation by appointment ID
   * Used when doctor opens the consultation screen
   * Returns null if no consultation started yet
   */
    getByAppointment: async (
        appointmentId: string
    ): Promise<IConsultation | null> => {
        const { data } = await api.get<{ data: IConsultation | null }>(
            `/consultations/appointment/${appointmentId}`
        );
        return data.data;
    },
}

export default consultationService;
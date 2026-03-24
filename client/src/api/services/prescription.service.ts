import type { IPrescription, IPrescriptionMedicine } from "../../types/prescription.types";
import api from "../axios";

export interface CreatePrescriptionPayload {
    consultationId: string;
    patientId: string;
    medicines: IPrescriptionMedicine[];
    instructions?: string;
    aiSuggestUsed?: boolean;
}


/**
 * Prescription Service
 * All prescription API calls
 */

const prescriptionService = {

    /**
    * Issue a prescription
    * Automatically deducts stock on backend
     */
    create: async (
        payload: CreatePrescriptionPayload
    ): Promise<IPrescription> => {
        const { data } = await api.post<{ data: IPrescription }>(
            "/prescriptions",
            payload
        );
        return data.data;
    },

    /**
   * Get single prescription
   */
    getById: async (id: string): Promise<IPrescription> => {
        const { data } = await api.get<{ data: IPrescription }>(
            `/prescriptions/${id}`
        );
        return data.data;
    },

    /**
   * Get all prescriptions for a patient
   * Used in patient portal + doctor patient profile
   */
    getByPatient: async (patientId: string): Promise<IPrescription[]> => {
        const { data } = await api.get<{ data: IPrescription[] }>(
            `/prescriptions/patient/${patientId}`
        );
        return data.data;
    },
}

export default prescriptionService
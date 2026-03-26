import type { IPatient } from "../../types/patient.types";
import api from "../axios";

export interface CreatePatientPayload {
    name: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
    allergies?: string[];
    bloodGroup?: string;
    address?: string;
}

/**
 * Patient Service
 * All patient-related API calls
 */
const patientService = {

    /**
     * Get all patients with optional search 
     */
    getAll: async (search?: string): Promise<IPatient[]> => {
        const params = search ? { search } : {};
        const { data } = await api.get<{ data: IPatient[] }>(
            "/patients", { params }
        )
        return data.data;
    },

    /**
     * Look up patient by exact phone number
     * Used in booking flow - check if patient exists before creating
     */
    getByPhone: async (phone: string): Promise<IPatient | null> => {
        const { data } = await api.get<{ data: IPatient[] }>(
            "/patients", { params: { phone } }
        );
        return data.data[0] || null
    },

    /**
     * Get the logged-in patient's own profile
     * Uses /api/patients/me — patient role only
     */
    getMyProfile: async (): Promise<IPatient> => {
        const { data } = await api.get<{ data: IPatient }>("/patients/me");
        return data.data;
    },

    /**
     * Get Single patient full profile
     */
    getById: async (id: string): Promise<IPatient> => {
        const { data } = await api.get<{ data: IPatient }>(
            `/patients/${id}`
        );
        return data.data;
    },


    /**
     * Register new patient - used by assistant for walk-in/manual bookings
     */
    createNewPatient: async (payload: CreatePatientPayload): Promise<IPatient> => {
        const { data } = await api.post<{ data: IPatient }>(
            "/patients/new-patient", payload
        );
        return data.data
    },

    /**
     * Update patient info
     */
    update: async (
        id: string,
        payload: Partial<CreatePatientPayload>
    ): Promise<IPatient> => {
        const { data } = await api.put<{ data: IPatient }>(
            `/patients/${id}`, payload
        );
        return data.data;
    },

    /**
     * Get full patient history - consultation + prescription
     * use by patient profile in doctor portal
     */
    getHistory: async (id: string) => {
        const { data } = await api.get(`/patients/${id}/history`)
        return data.data;
    }
};

export default patientService;
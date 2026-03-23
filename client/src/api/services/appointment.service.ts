import type { AppointmentStatus, IAppointment } from "../../types/appointment.types";
import api from "../axios";

export interface AppointmentFilters {
    date?: string;
    status?: AppointmentStatus;
    patientId?: string
}

const appointmentService = {

    /**
     * Get appointments with optional filter
     */
    getAll: async (filters?: AppointmentFilters): Promise<IAppointment[]> => {
        const { data } = await api.get<{ data: IAppointment[] }>(
            "/appointments", { params: filters }
        );
        return data.data;
    },

    /**
     * Get single appointment with patient details
     */
    getById: async (id: string): Promise<IAppointment> => {
        const { data } = await api.get<{ data: IAppointment }>(
            `/appointments/${id}`
        );
        return data.data;
    },

    /**
     * Update appointment status
     * used for: nowshow, cancelled, completed
     */
    updateStatus: async (
        id: string,
        status: AppointmentStatus
    ): Promise<IAppointment> => {
        const { data } = await api.put<{ data: IAppointment }>(
            `/appointments/${id}/status`, { status }
        );
        return data.data
    },
};

export default appointmentService;
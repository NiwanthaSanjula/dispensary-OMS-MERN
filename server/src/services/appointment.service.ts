import { Appointment } from "../models/Appointment.model";
import { Patient } from "../models/Patient.model";
import { ApiError } from "../utils/ApiError";

export interface AppointmentFilters {
    date?: string;
    status?: string;
    patientId?: string;
}
const appointmentService = {

    /**
     * Get appointments with optional filters
     * date -> filter by specific date
     * status -> filter by status
     * patientId -> filter by patient (used for patient portal)
     */

    getAll: async (filters: AppointmentFilters, userId?: string, userRole?: string) => {
        const filter: Record<string, unknown> = {};

        if (filters.patientId) filter.patientId = filters.patientId;
        if (filters.status) filter.status = filters.status;

        if (filters.date) {
            const startOfDay = new Date(filters.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.date);
            endOfDay.setHours(23, 59, 59, 999);
            filter.date = { $gte: startOfDay, $lte: endOfDay };
        }

        /**
         * If caller is a patient - automatically scope to their own appointments
         * Patient's userId -> find their Patient record -> filter by patientId
         */
        if (userRole === "patient" && userId) {
            const patient = await Patient.findOne({ userId });
            if (!patient) return [];
            filter.patientId = patient._id;
        }

        return await Appointment.find(filter).populate("patientId", "name phone email").sort({ date: -1, tokenNumber: 1 });

    },

    /**
     * Get single appointment with full patient details
     */
    getById: async (id: string) => {
        const appointment = await Appointment.findById(id).populate(
            "patientId",
            "name phone email allergies bloodGroup dateOfbirth gender"
        );
        if (!appointment) throw new ApiError(404, "Appointment not found")
        return appointment;
    },


    /**
     * Update appointment status
     * Valid transitions enforced here
     */
    updateStatus: async (id: string, status: string) => {
        const validStatuses = ["waiting", "serving", "completed", "noshow", "canelled"]

        if (!validStatuses.includes(status)) {
            throw new ApiError(400, `Status must be one of: ${validStatuses.join(",")}`)
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate("patientId", "name phone");

        if (!appointment) throw new ApiError(404, "Appointment not found");

        return appointment;
    },
};

export default appointmentService;
import { Appointment } from "../models/Appointment.model";
import { Consultation } from "../models/Consultation.model";
import { ApiError } from "../utils/ApiError";

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
 * All consultation business logic
 */
const consultationService = {
    /**
   * Create a new consultation
   * Validates appointment exists and belongs to the patient
   * One consultation per appointment — enforced by unique index on model
   */
    create: async (
        payload: CreateConsultationPayload
    ) => {
        const { appointmentId, patientId } = payload;

        // Verify appointment exists
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new ApiError(404, "Appointment not found");
        }

        // Only allow consultation for serving appointments
        if (appointment.status !== "serving") {
            throw new ApiError(
                400,
                "Please start the consultation first"
            );
        }

        // Check no consultation already exists for this appointment
        const existing = await Consultation.findOne({ appointmentId });
        if (existing) {
            throw new ApiError(
                409,
                "A consultation already exists for this appointment"
            );
        }

        return await Consultation.create({
            ...payload,
            followUpDate: payload.followUpDate
                ? new Date(payload.followUpDate)
                : undefined,
        });
    },


    /**
     * Get single consultation with prescription populated
     */
    getById: async (id: string) => {
        const consultation = await Consultation.findById(id)
            .populate("appointmentId", "tokenCode date estimatedTime")
            .populate("patientId", "name phone allergies bloodGroup");

        if (!consultation) throw new ApiError(404, "Consultation not found");
        return consultation;
    },


    /**
     * Update consultation fields
     * Doctor can update symptoms, diagnosis, notes, followUpDate
     */
    update: async (
        id: string,
        payload: Partial<CreateConsultationPayload> & { aiSummaryUsed?: boolean }
    ) => {
        const consultation = await Consultation.findByIdAndUpdate(
            id,
            {
                ...payload,
                followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : undefined
            },
            { new: true, runValidators: true }
        );
        if (!consultation) throw new ApiError(404, "Consultation not found");
        return consultation;
    },

    /**
   * Get all consultations for a patient — newest first
   * Used in visit history panel + AI summary
   */
    getByPatient: async (patientId: string) => {
        return await Consultation.find({ patientId })
            .populate("appointmentId", "tokenCode date estimatedTime type")
            .sort({ createdAt: -1 });
    },

    /**
   * Get consultation by appointment ID
   * Used when doctor opens consultation screen
   */
    getByAppointment: async (appointmentId: string) => {
        return await Consultation.findOne({ appointmentId })
            .populate("patientId", "name phone allergies bloodGroup dateOfBirth gender");
    },
};

export default consultationService;
import { Appointment } from "../models/Appointment.model";
import { Consultation } from "../models/Consultation.model";
import { Patient } from "../models/Patient.model";
import { Prescription } from "../models/Prescription.model";
import { ApiError } from "../utils/ApiError";

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
 * Patient service
 * All patient business logic lives here
 */

const patientService = {

    /**
     * Get all patients with optional search/phone filter 
     */
    getAll: async (search?: string, phone?: string) => {
        const filter: Record<string, unknown> = {};

        if (phone) {
            //  Extract phone lookup - used in guest booking + walk-in lookup
            filter.phone = phone;

        } else if (search) {
            // Partial match on name or phone
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }

        return await Patient.find(filter).sort({ createdAt: -1 }).limit(100);
    },


    /**
     * Get single patient by Id
     */
    getbyId: async (id: string) => {
        const patient = await Patient.findById(id);
        if (!patient) throw new ApiError(404, "Patient not found");
        return patient;
    },


    /**
     * Register a new walk-in / manual patient
     * No userId - they dont't have a account
     */
    create: async (payload: CreatePatientPayload) => {
        const { name, phone } = payload;

        if (!name || !phone) {
            throw new ApiError(400, "Name and phone are required");
        }

        const existing = await Patient.findOne({ phone });
        if (existing) {
            throw new ApiError(409, "A patient with this phone number already exists");
        }

        return await Patient.create({
            userId: null,
            ...payload,
            allergies: payload.allergies || [],
        });
    },


    /**
     * Update patient info 
     */
    update: async (id: string, payload: Partial<CreatePatientPayload>) => {
        const patient = await Patient.findByIdAndUpdate(
            id,
            payload,
            { new: true, runValidators: true }
        );
        if (!patient) throw new ApiError(404, "Patient not found");
        return patient;
    },


    /**
     * Get full patient history
     * Returns patient + all appointments, consultations, prescriptions
     * used in doctor's patient profile screen + AI summary
     */
    getHistory: async (id: string) => {
        const patient = await Patient.findById(id);
        if (!patient) throw new ApiError(404, "Patient not found");

        const [appointments, consultations, prescriptions] = await Promise.all([
            Appointment.find({ patientId: id }).sort({ date: -1 }),
            Consultation.find({ patientId: id }).sort({ created: -1 }).populate("appointment", "date tokenCode"),
            Prescription.find({ patientId: id }).sort({ issuedAt: -1 }),
        ]);

        return { patient, appointments, consultations, prescriptions }
    },
};

export default patientService;
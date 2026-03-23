import { Consultation } from "../models/Consultation.model";
import { IPrescriptionMedicine, Prescription } from "../models/Prescription.model";
import { ApiError } from "../utils/ApiError";
import stockService from "./stock.service";

export interface CreatePrescriptionPayload {
    consultationId: string;
    patientId: string;
    medicines: IPrescriptionMedicine[];
    instructions?: string;
    aiSuggestUsed?: boolean;
}

/**
 * Prescription Service
 * Issues prescriptions and automatically deducts stock
 */

const prescriptionService = {
    /**
     * Issue a prescription
     * For each medicine:
     *   1. Deduct stock
     *   2. Create StockLog
     * Then create the Prescription document
     *
     * If any stock deduction fails, the whole operation should stop
     * (MongoDB session/transaction would be ideal here but Atlas free tier
     *  doesn't support multi-document transactions — we handle errors manually)
     */
    create: async (
        payload: CreatePrescriptionPayload,
        performedBy: string
    ) => {
        const { consultationId, patientId, medicines, instructions, aiSuggestUsed } = payload;

        // Verify consultation exists
        const consultation = await Consultation.findById(consultationId);
        if (!consultation) {
            throw new ApiError(404, "Consultation not found");
        }

        // Check no prescription already exists for this consultation
        const existing = await Prescription.findOne({ consultationId });
        if (existing) {
            throw new ApiError(
                409,
                "A prescription already exists for this consultation"
            );
        }

        // Validate all medicines have sufficient stock BEFORE deducting
        // This prevents partial deductions if one medicine runs out mid-way
        const { Medicine } = await import("../models/Medicine.model");
        for (const med of medicines) {
            const medicine = await Medicine.findById(med.medicineId);
            if (!medicine || !medicine.isActive) {
                throw new ApiError(400, `Medicine not found or inactive: ${med.medicineName}`);
            }

            if (medicine.stockQty < med.quantity) {
                throw new ApiError(
                    400,
                    `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQty}, Required: ${med.quantity}`
                );
            }
        }

        // Create prescription first — Required its ID for StockLog referenceId
        const prescription = await Prescription.create({
            consultationId,
            patientId,
            medicines,
            instructions,
            aiSuggestUsed: aiSuggestUsed || false,
        });

        // Deduct stock for each medicine + create StockLog
        for (const med of medicines) {
            await stockService.deduct({
                medicineId: med.medicineId.toString(),
                quantity: med.quantity,
                prescriptionId: prescription._id.toString(),
                performedBy,
            });
        };

        // Mark consultation as having a prescription (update aiSuggestUsed if used)
        if (aiSuggestUsed) {
            await Consultation.findByIdAndUpdate(consultationId, {
                aiSuggestUsed: true,
            });
        }
        return prescription;
    },

    /**
   * Get single prescription by ID
   */
    getById: async (id: string) => {
        const prescription = await Prescription.findById(id)
            .populate("consultationId", "diagnosis symptoms notes")
            .populate("patientId", "name phone");
        if (!prescription) throw new ApiError(404, "Prescription not found");
        return prescription;
    },

    /**
   * Get all prescriptions for a patient — newest first
   * Used in patient portal + doctor patient profile
   */
    getByPatient: async (patientId: string) => {
        return await Prescription.find({ patientId })
            .populate("consultationId", "diagnosis symptoms createdAt")
            .sort({ issuedAt: -1 });
    },

};

export default prescriptionService;
/**
 * Stock Service
 * Handles all inventory movements
 * Called automatically when a prescription is issued
 * Called manually when assistant adds stock
 */

import mongoose from "mongoose";
import { Medicine } from "../models/Medicine.model";
import { StockLog } from "../models/Stocklog.model";
import { ApiError } from "../utils/ApiError";

export interface DeductStockPayload {
    medicineId: string;
    quantity: number;
    prescriptionId: string;
    performedBy: string;
}

export interface AddStockPayload {
    medicineId: string;
    quantity: number;
    performedBy: string;
    reason?: "manual_add" | "adjustment";
}

const stockService = {
    /**
     * Deduct stock when prescription is issued
     * Runs for each medicine in the prescription
     * Creates a StockLog entry for every deduction
     * Throws if stock is insufficient - prescription should not be issued
     */

    deduct: async (payload: DeductStockPayload): Promise<void> => {
        const { medicineId, quantity, prescriptionId, performedBy } = payload;

        // Find medicine and check stock in one operation
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            throw new ApiError(404, `Medicine not found: ${medicineId}`);
        }
        if (!medicine.isActive) {
            throw new ApiError(400, `Medicine is inactive: ${medicine.name}`);
        }
        if (medicine.stockQty < quantity) {
            throw new ApiError(
                400,
                `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQty}, Required: ${quantity}`
            );
        }

        // Deduct stock
        medicine.stockQty -= quantity;
        await medicine.save();

        // Create immutable audit log
        await StockLog.create({
            medicineId,
            type: "out",
            quantity,
            reason: "prescription",
            referenceId: new mongoose.Types.ObjectId(prescriptionId),
            performedBy,
        });
    },

    /**
     * Add stock manually — assistant receiving new inventory
     * Creates StockLog entry (type: in)
     */
    addStock: async (payload: AddStockPayload): Promise<void> => {
        const { medicineId, quantity, performedBy, reason = "manual_add" } = payload;

        const medicine = await Medicine.findById(medicineId);
        if (!medicine) throw new ApiError(404, "Medicine not found");
        if (!medicine.isActive) throw new ApiError(400, "Medicine is inactive");

        medicine.stockQty += quantity;
        await medicine.save();

        await StockLog.create({
            medicineId,
            type: "in",
            quantity,
            reason,
            performedBy,
        });
    },
};

export default stockService;
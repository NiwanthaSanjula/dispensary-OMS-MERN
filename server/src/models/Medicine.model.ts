import mongoose, { Document, model, Schema } from "mongoose";

/**
 * Medicine Interface
 * The dispensary's medicine inventoty catalog
 * 
 * stockQty decrement automatically when a prescription is issued
 * When stockQty <= alertThreshold -> medicine appers in low stock alerts
 * isActove = false means soft-delete - never hard delete medicine
 * because historycal prescriptions reference them
*/


export interface IMedicine extends Document {
    name: string;
    category: string;
    unit: string;
    stockQty: number;
    alertThreshold: number,
    supplierName?: string,
    supplierPhone?: string,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date;
};

const MedicineShema = new Schema<IMedicine>(
    {
        name: {
            type: String,
            required: [true, "Medicine name is required"],
            trim: true,
            unique: true,
            maxLength: [200, "Medicine name cannot exceed 200 characters"]
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
            // e.g. "Antibiotics", "Painkiller", Antifungal, Antacid
        },
        unit: {
            type: String,
            required: [true, "Unit is required"],
            trim: true
            //  e.g. "tablets", "capsules", "ml",...
        },
        stockQty: {
            type: Number,
            default: 0,
            min: [0, "Stock quantity cannot be negative"]
        },
        alertThreshold: {
            type: Number,
            required: [true, "Alert threshold is required"],
            min: [0, "Alert threshold cannot be negative"]
        },
        supplierName: {
            type: String,
            trim: true
        },
        supplierPhone: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        },

    }, { timestamps: true }
);

//  Text index for medicine name search
MedicineShema.index({ name: "text", category: "text" });

//  Fast filter for low stock dashboard query
MedicineShema.index({ stockQty: 1, alertThreshold: 1 });

export const Medicine = mongoose.model<IMedicine>("Medicine", MedicineShema);
import mongoose, { Document, Schema, SchemaType } from "mongoose";

/**
 * Stocklog Interface
 * Immutable audit trail of every single stock movement
 * auto-created in two-scenarios:
 *      1.prescription issued  -> type: "out", reason: "prescription"
 *      2.Assistant adds stock -> type: "in", reason: "manual_add"
*/


export interface IStocklog extends Document {
    medicineId: mongoose.Types.ObjectId;
    type: "in" | "out";
    quantity: number;
    reason: "prescription" | "manual_add" | "adjustment";
    referenceId?: mongoose.Types.ObjectId;
    performedBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const StockLogSchema = new Schema<IStocklog>(
    {
        medicineId: {
            type: Schema.Types.ObjectId,
            ref: "Medicine",
            required: [true, "Medicine reference is required"],
        },
        type: {
            type: String,
            enum: {
                values: ["in", "out"],
                message: "Stock log type must be in or out"
            },
            required: [true, "Stock log type is required"]
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0, "Quantity must be at leadt 1"]
        },
        reason: {
            type: String,
            enum: {
                values: ["prescription", "manual_add", "adjustment"],
                message: "Reason must be prescription, manual_add, or adjustment",
            },
            required: [true, "Reason is required"],
        },
        referenceId: {
            type: Schema.Types.ObjectId,
            ref: "Prescription"
            //  Only populated when reason = "prescription"
            //  Links back to the prescription that caused this stock deduction
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Performed by is required"],
        },

    }, { timestamps: true }
    // No need updatedAt, Once created they are never modified
);

//  Fast lookup for stock history for a specific medicine
StockLogSchema.index({ medicineId: 1, createdAt: -1 });

export const StockLog = mongoose.model<IStocklog>("StockLog", StockLogSchema)



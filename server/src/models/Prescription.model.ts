import mongoose, { Document, Schema } from "mongoose";

/**
 * Prescribed Medicine sub-document interface
 * Stores both medicineId (for inventory tracking) And MedicineName snapshot (so old prescriptions never break if names change)
*/
export interface IPrescriptionMedicine {
    medicineId: mongoose.Types.ObjectId;
    medicineName: string;      //  Snapshot at time of prescription
    dosage: string             //  e.g. "1 tablet 3 times daily"
    duration: string           //  "5 days"
    quantity: number           //  Total units - deducted from stock
}

const PrescriptionMedicineSchema = new Schema<IPrescriptionMedicine>(
    {
        medicineId: {
            type: Schema.Types.ObjectId,
            ref: "Medicine",
            required: [true, "Medicine ID is required"],
        },
        medicineName: {
            type: String,
            required: [true, "Medicine name snapshot is required"],
            trim: true
        },
        dosage: {
            type: String,
            required: [true, "Dosage is required"],
            trim: true
        },
        duration: {
            type: String,
            required: [true, "Duration is required"],
            trim: true
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"]
        },

    }, { _id: false } // Sub-documents dont't need their own _id
)




/**
 * prescription interface
 * Created when doctor completes a consultation
 * Automatically triggers stock deduction for each medicine
 * 
 * aiSuggestUsed tracks AI prescription suggestion engagement
*/
export interface IPrescription extends Document {
    consultationId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    medicines: IPrescriptionMedicine[];
    instructions?: string;
    aiSuggestUsed: boolean;
    issuedAt: Date
}

const PrescriptionSchema = new Schema<IPrescription>(
    {
        consultationId: {
            type: Schema.Types.ObjectId,
            ref: "Consultation",
            required: [true, "Consultation reference is required"],
        },
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: [true, "Patient reference is required"],
            //  Denormalized for fast "all prescriptions for patient" queries
        },
        medicines: {
            type: [PrescriptionMedicineSchema],
            required: true,
            validate: {
                validator: (v: IPrescriptionMedicine[]) => v.length > 0,
                message: "Prescription must contain at least one medicine"
            },
        },
        instructions: {
            type: String,
            trim: true
            //  General instructions e.g. "take after food, drink plenty of water"
        },
        aiSuggestUsed: {
            type: Boolean,
            default: false,
            //  Set to true when doctor used AI prescription suggestions
        },
        issuedAt: {
            type: Date,
            default: Date.now
        },

    }, { timestamps: true }
);


// Fast lookup of all prescription for a patient
PrescriptionSchema.index({ patientId: 1, issuedAt: -1 });

export const Prescription = mongoose.model<IPrescription>("Prescription", PrescriptionSchema);
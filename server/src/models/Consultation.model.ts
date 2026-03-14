import mongoose, { Document, Schema } from "mongoose";

/**
 * Consultation Model
 * Created by the doctor when they start seeing a patient
 * One consultation per appointment - one visit, one record
 * 
 * aiSummaryUsed tracks whether the AI patient briefing was triggered
*/


export interface IConsultation extends Document {
    appointmentId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    symptoms?: string;
    diagnosis?: string;
    notes?: string;
    followUpdate?: Date;
    aiSummaryUsed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ConsultationSchema = new Schema<IConsultation>(
    {
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
            required: [true, "Appointment reference is required"],
            unique: true
        },
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: [true, "Patient reference is required"],
            //  Denormalized for fast patient history queries
            //  without needing to join through Appointment every time
        },
        symptoms: {
            type: String,
            trim: true
        },
        diagnosis: {
            type: String,
            trim: true
        },
        notes: {
            type: String,
            trim: true
        },
        followUpdate: {
            type: Date,
            //  Optional - set if doctor wants patient to return on a specific date
        },
        aiSummaryUsed: {
            type: Boolean,
            default: false,
            //  Set to true if doctor used the AI patient briefing feature
        },
    }, { timestamps: true }
);

// Fast lookup of all consultations for a patient (used in history panel)
ConsultationSchema.index({ patientId: 1, createdAt: -1 });

export const Consultation = mongoose.model<IConsultation>("Consultation", ConsultationSchema);

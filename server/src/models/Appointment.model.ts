import mongoose, { Document, Schema } from "mongoose";

/**
 * Appointment interface
 * Every booking - online ( patient self-booked) or manual (assistant booked)
 * Each appointment has a unique token for its date
 * 
 * type "online" -> patient booked via portal
 * type "manual" -> assistant booked on behalf (walked in or phone call)
 * 
 * estimatedTime is calculated at booking time:
 *   openningTime + (tokenNumber - 1) * avgConsulationMinutes
*/


export interface IAppointment extends Document {
    patientId: mongoose.Types.ObjectId;
    tokenNumber: number;
    tokenCode: string;
    type: "online" | "manual";
    status: "waiting" | "serving" | "completed" | "notshow" | "cancelled";
    date: Date;
    estimatedTime: string;
    notes?: string;
    bookedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: [true, "Patient reference is required"],
        },
        tokenNumber: {
            type: Number,
            required: [true, "Tokn Number is required"],
        },
        tokenCode: {
            type: String,
            required: [true, "Token Code is required"],
            //e.g: "T-001" - formatted from token number at creation
        },
        type: {
            type: String,
            enum: {
                values: ["online", "manual"],
                message: "Appointment type must be online or manual"
            },
            required: [true, "Appointment type required"]
        },
        status: {
            type: String,
            enum: {
                values: ["waiting", "serving", "completed", "notshow", "cancelled"],
                message: "Invalid appointment status"
            },
            default: "waiting"
        },
        date: {
            type: Date,
            required: [true, "Appointment date s required"]
        },
        estimatedTime: {
            type: String,
            required: [true, "Estimated time is required"],
            //  Stored as string e.g. "10.30 AM" - calculated at booking time
        },
        notes: {
            type: String,
            trim: true,
            maxLength: [500, "Notes cannot exceed 500 characters"],
        },
        bookedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Booking by reference is required"]
            //  Who created this booking: the patient themselves or and assistant
        },

    }, { timestamps: true }
);

// Compound index - fast lookup of appointment by date (used every day)
AppointmentSchema.index({ date: 1, status: 1 });
AppointmentSchema.index({ patientId: 1, date: -1 });

//  Ensure token numbers are unique per date (no duplicate token on same day)
AppointmentSchema.index({ date: 1, tokenNumber: 1 }, { unique: true });

export const Appointment = mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export type AppointmentStatus =
    | "waiting"
    | "serving"
    | "completed"
    | "noshow"
    | "cancelled";
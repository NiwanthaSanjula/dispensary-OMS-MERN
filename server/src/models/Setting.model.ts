import mongoose, { Document, Schema } from "mongoose";

/**
 * Setting Interface
 * Single document - one settings record for the whole dispensary
 * Created once via seed script, updated by doctor via /doctor/settings
 * 
 * Queue reads these values when initializing each day's queue:
 * maxDailyLimit          -> max appointments per day
 * openningTime           -> used to calculate estimatedTime per token
 * avgConsultationMinutes -> used to calculate estimatedTime per token
 * advanceBookingDays     -> how many days ahead patient can book online
 */


export interface ISettings extends Document {
    dispensaryName: string;
    doctorName: string;
    openningTime: string;
    closingTime: string;
    avgConsultationMinutes: number;
    maxDailyLimit: number;
    advanceBookingDays: number;
    isOpen: boolean;
    createdAt: Date;
    updatedAt: Date
}

const SettingsSchema = new Schema<ISettings>(
    {
        dispensaryName: {
            type: String,
            require: [true, "Dispensary name is required"],
            trim: true,
            default: "My Dispensary"
        },
        doctorName: {
            type: String,
            required: [true, "Doctor name is required"],
            trim: true,
            default: "Dr.Unkown"
        },
        openningTime: {
            type: String,
            required: [true, "Openning time is required"],
            default: "09.00"
            //  Stored as "HH:MM" 24h format
        },
        closingTime: {
            type: String,
            required: [true, "Closing time is required"],
            default: "18:00"
        },
        avgConsultationMinutes: {
            type: Number,
            required: true,
            default: 20,
            min: [1, "Average consultation must be at least 1 minute"],
            //  Used in formula: estimatedTime = openningTime + (tokenNumber-1) * avgMins
        },
        maxDailyLimit: {
            type: Number,
            required: true,
            default: 40,
            min: [1, "Max daily limit must be at least 1"]
        },
        advanceBookingDays: {
            type: Number,
            required: true,
            default: 40,
            min: [1, "Advance booking days must be at least 1"],
            //  Patient can book up to this many days in the future
        },
        isOpen: {
            type: Boolean,
            default: true
            //  Quice toogle - if false, no booking accepted at all
        },

    }, { timestamps: true }
);

export const Settings = mongoose.model<ISettings>("Setting", SettingsSchema);
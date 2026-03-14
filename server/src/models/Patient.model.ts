import mongoose, { Document, Schema } from "mongoose";

/**
 * Patient Interface
 * Every person who has ever visited- with or without account
 * This is the single source of truth for all medical history
 * 
 * Key desicions:
 *    userId = null -> walk in/ phone booking (no account)
 *    userId = ref  -> patient has a registered account
*/


export interface IPatient extends Document {
    userId: mongoose.Types.ObjectId | null;
    name: string;
    phone: string;
    email?: string;
    dateOfBirth?: Date;
    gender: "male" | "female";
    allergies: string[];
    bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
    address?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null, // Null = no account (manual/phone booking)
        },
        name: {
            type: String,
            required: [true, "Patient name is required"],
            trim: true,
            maxLength: [100, "Name cannot exceed 100 characters"]
        },
        phone: {
            type: String,
            require: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            sparse: true // Allows multiple patients with no email
        },
        dateOfBirth: {
            type: Date,
            required: [true, "Date of birth is required"]
        },
        gender: {
            type: String,
            enum: {
                values: ["male", "female"],
                message: "Gender must be male or female"
            },
        },
        allergies: {
            type: [String],
            default: [],    //  Critical field - used by allergy guard + AI prompts
        },
        bloodGroup: {
            type: String,
            enum: {
                values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
                message: "Invalid blood group"
            },
            required: [true, "Blood group required"],
            trim: true
        },
        address: {
            type: String,
            trim: true
        },

    }, { timestamps: true }
);

//  Index for fast phone lookup(used in guest booking + assistant search)
PatientSchema.index({ phone: 1 });
PatientSchema.index({ name: "text" }); // Text index for search by name

export const Patient = mongoose.model<IPatient>("Patient", PatientSchema);

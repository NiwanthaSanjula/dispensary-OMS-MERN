import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs"

/** 
 * User Interface
 * Represents anyone who can LOG IN to the system
 * Doctor and Assistant accounts are created manually 
 * Patients accounts are created on registration
*/


export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "doctor" | "assistant" | "patient";
    phone: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;

    //  Instance mothod - compares plain password with hashed password
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxLength: [100, "Name cannor exceed 100 characters"]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minLength: [8, "Password must be at least 8 characters long"],
            select: false,  //  Never return password in queries by default
        },

        role: {
            type: String,
            enum: {
                values: ["doctor", "assistant", "patient"],
                message: "Role must be doctor, assistant, or patient",
            },
            required: [true, "Role is required"]
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true   // Soft disable - never hard delete users
        },
    }, { timestamps: true }
);



/**
 * Pre saved hook - hash password before saving
 * Only runs when password filed is modified 
 * bcrypt salt rounds : 12
*/
UserSchema.pre("save", async function (this: IUser) {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

/**
 * Instance method - compare candidate password with stored hash
 * Used in login flow
*/
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);




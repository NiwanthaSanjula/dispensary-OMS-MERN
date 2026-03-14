import mongoose, { Document, Schema } from "mongoose";

/**
 * Queue Interface
 * One Document per day -  tracks the live state of the queue
 * Created fresh each morning by the assistant
 * Stores settings snapshot so changing settings mid-day doesn't break the queue
*/


export interface IQueue extends Document {
    date: Date;
    maxLimit: number;
    openningTime: string;
    avgConsultationMinutes: number;
    currentToken: number;
    lastToken: number;
    status: "open" | "closed" | "paused"
    createdAt: Date;
    updatedAt: Date;
}

const QueueSchema = new Schema<IQueue>(
    {
        date: {
            type: Date,
            required: [true, "Queue data is required"],
            unique: true,   //  One queue per day - enforced at DB level
        },
        maxLimit: {
            type: Number,
            required: [true, "Max daily limit is required"],
            min: [1, "Max limit must be at least 1"],
        },
        openningTime: {
            type: String,
            required: [true, "Openning time is required"],
            //  Stored as "09:00" - copied from settings when queue is created
        },
        avgConsultationMinutes: {
            type: Number,
            required: [true, "Average consultation duration is required"],
            min: [1, "Average consultation must be at least 1 minute"]
        },
        currentToken: {
            type: Number,
            default: 0, //  0 = no one being served yet
        },
        lastToken: {
            type: Number,
            default: 0, // Last token number issued today
        },
        status: {
            type: String,
            enum: {
                values: ["open", "closed", "paused"],
                message: "Queue status must be open, closed, or paused",
            },
            default: "open"
        },
    }, { timestamps: true }
);

export const Queue = mongoose.model<IQueue>("Queue", QueueSchema);
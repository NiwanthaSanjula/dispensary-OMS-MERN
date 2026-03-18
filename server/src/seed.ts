/**
 * Seed script 
 * creates demo account + settings for developemnt
 * 
 * Run with: npx ts-node src/seed.ts
 * 
 * Safe to run multiple times - checks before creating ( no duplicates )
 * 
 * Demo accounts created:
 *      doctor@demo.com / Demo@1234
 *      assistant@demo.com / Demo@1234
 */
import "dotenv/config"
import mongoose from "mongoose"
import { ENV } from "./config/env"
import { User } from "./models/User.model";
import { log } from "console";

const seed = async () => {
    try {
        // Connect to db
        await mongoose.connect(ENV.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Doctor 
        const existingDoctor = await User.findOne({ email: "doctor@demo.com" });
        if (!existingDoctor) {
            await User.create({
                name: "Dr.Unknown",
                email: "doctor@demo.com",
                password: "Demo@1234",
                role: "doctor",
                phone: "0799999999",
                isActive: true
            });
            console.log("✅ Doctor created - doctor@demo.com / Demo@1234");
        } else {
            console.log("⏭️  Doctor already exists — skipping");
        }

        // ── Assistant ─────────────────────────────────────────────────
        const existingAssistant = await User.findOne({ email: "assistant@demo.com" });
        if (!existingAssistant) {
            await User.create({
                name: "Assistant Demo",
                email: "assistant@demo.com",
                password: "Demo@1234",
                role: "assistant",
                phone: "0700000002",
                isActive: true,
            });
            console.log("✅ Assistant account created — assistant@demo.com / Demo@1234");
        } else {
            console.log("⏭️  Assistant already exists — skipping");
        }

        // ── Summary ───────────────────────────────────────────────────
        console.log("\n🎉 Seed complete. Demo credentials:");
        console.log("   doctor@demo.com    / Demo@1234");
        console.log("   assistant@demo.com / Demo@1234");


    } catch (error) {
        console.log("❌ Seed failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n MongoDB Disconnected");
        process.exit(0);

    }
};

seed();
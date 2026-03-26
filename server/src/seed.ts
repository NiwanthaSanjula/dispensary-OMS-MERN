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
import { Medicine } from "./models/Medicine.model";

const seed = async () => {
    try {
        // Connect to db
        await mongoose.connect(ENV.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const medicineCount = await Medicine.countDocuments();
        if (medicineCount === 0) {
            await Medicine.insertMany([
                {
                    name: "Paracetamol 500mg",
                    category: "Painkiller",
                    unit: "tablets",
                    stockQty: 500,
                    alertThreshold: 50,
                    supplierName: "MedSupply Co.",
                    supplierPhone: "0112345678",
                    isActive: true,
                },
                {
                    name: "Amoxicillin 250mg",
                    category: "Antibiotic",
                    unit: "capsules",
                    stockQty: 200,
                    alertThreshold: 30,
                    isActive: true,
                },
                {
                    name: "Cetirizine 10mg",
                    category: "Antihistamine",
                    unit: "tablets",
                    stockQty: 150,
                    alertThreshold: 20,
                    isActive: true,
                },
                {
                    name: "Omeprazole 20mg",
                    category: "Antacid",
                    unit: "capsules",
                    stockQty: 100,
                    alertThreshold: 20,
                    isActive: true,
                },
                {
                    name: "Ibuprofen 400mg",
                    category: "Painkiller",
                    unit: "tablets",
                    stockQty: 300,
                    alertThreshold: 40,
                    isActive: true,
                },
                {
                    name: "Metformin 500mg",
                    category: "Antidiabetic",
                    unit: "tablets",
                    stockQty: 8,          // intentionally low for demo
                    alertThreshold: 20,
                    isActive: true,
                },
                {
                    name: "Salbutamol Inhaler",
                    category: "Bronchodilator",
                    unit: "inhalers",
                    stockQty: 25,
                    alertThreshold: 5,
                    isActive: true,
                },
            ]);
            console.log("✅ Medicines seeded — 7 medicines added");
        } else {
            console.log("⏭️  Medicines already exist — skipping");
        }


    } catch (error) {
        console.log("❌ Seed failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n MongoDB Disconnected");
        process.exit(0);

    }
};

seed();
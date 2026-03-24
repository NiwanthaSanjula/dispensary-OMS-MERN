import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { Patient } from "../models/Patient.model";
import { Consultation } from "../models/Consultation.model";
import { Prescription } from "../models/Prescription.model";
/**
 * AI Service - Google Gemini Integration
 * 
 * Model: gemini 2.5-flash-lite
 */


// Initialize Gemini client once - refused for all calls
const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/**
 * callGemini
 * core functions - sends a prompt to Gemini and returns the text response
 * All three AI features call this function
 */
const callGemini = async (prompt: string): Promise<string> => {
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();

    } catch (error: unknown) {
        const e = error as { message?: string };
        throw new ApiError(500, `Gemini API error: ${e.message || "Unknown error"}`);
    }
};

// AI Patient Briefing___________________________________________________________________________
export const getPatientSummary = async (patientId: string): Promise<string> => {
    // Fetch patient record
    const patient = await Patient.findById(patientId);
    if (!patient) throw new ApiError(404, "Patient not found");

    // Fetch last 5 consultations newest first
    const consultations = await Consultation.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(5);

    // Fetch last 5 prescriptions
    const prescriptions = await Prescription.find({ patientId })
        .sort({ issuedAt: -1 })
        .limit(5);

    // Calculate age from dateOfBirth
    const age = patient.dateOfBirth
        ? new Date().getFullYear() -
        new Date(patient.dateOfBirth).getFullYear()
        : "Unknown";

    // Build the prompt
    // Gemini structured data + clear instructions
    const prompt = `
    You are a clinical assistant summarising patient history for a doctor.
    Be factual, concise, and clinically relevant.
    Highlight: recurring conditions, known allergies, recent diagnoses, and medications prescribed.
    Maximum 100 words. No bullet points. Write as a single paragraph.

    Patient: ${patient.name}
    Age: ${age}
    Gender: ${patient.gender || "Not specified"}
    Blood Group: ${patient.bloodGroup || "Not recorded"}
    Known Allergies: ${patient.allergies.length > 0
            ? patient.allergies.join(", ")
            : "None recorded"
        }

    Visit History (most recent first):
    ${consultations.length > 0
            ? consultations
                .map(
                    (c) =>
                        `- ${new Date(c.createdAt).toLocaleDateString()}: ${c.diagnosis || "No diagnosis recorded"
                        }. Symptoms: ${c.symptoms || "None noted"}`
                )
                .join("\n")
            : "No previous visits on record"
        }

    Recent Prescriptions:
    ${prescriptions.length > 0
            ? prescriptions
                .map((p) =>
                    p.medicines.map((m) => m.medicineName).join(", ")
                )
                .join(" | ")
            : "No previous prescriptions"
        }
    `.trim();

    return await callGemini(prompt);
}

// AI Prescription Suggestions___________________________________________________________________________
export interface AISuggestion {
    name: string;
    dosage: string;
    duration: string;
    quantity: number;
    warning: string | null; // null = no allergy conflict, string = conflict description
}

/**
 * getPrescriptionSuggestions
 * Doctor types a diagnosis → Gemini suggests appropriate medicines
 *
 * Key safety rules in the prompt:
 *   - Only suggest from our actual inventory (not random medicines)
 *   - Always flag allergy conflicts
 *   - Return JSON only
 *
 * Send to Gemini:
 *   - Doctor's diagnosis text
 *   - Patient's known allergies
 *   - List of available medicines (name + unit, stockQty > 0)
 *
 * What Gemini returns:
 *   - JSON array of suggestions with dosage, duration, quantity
 */
export const getPrescriptionSuggestions = async (
    diagnosis: string,
    patientAllergies: string[],
    availableMedicines: { name: string; unit: string }[]
): Promise<AISuggestion[]> => {

    if (!diagnosis.trim()) {
        throw new ApiError(400, "Diagnosis is required for AI suggestions");
    }

    if (availableMedicines.length === 0) {
        throw new ApiError(400, "No medicines available in inventory");
    }

    const prompt = `
    You are a clinical assistant helping a doctor select appropriate medicines.
    Only suggest medicines from the provided inventory list — no others.
    Flag any allergy conflicts clearly with a warning.
    Return ONLY a valid JSON array. No markdown, no explanation, no text outside the array.

    Format exactly like this:
    [
    {
        "name": "Medicine Name",
        "dosage": "1 tablet 3 times daily",
        "duration": "5 days",
        "quantity": 15,
        "warning": null
    }
    ]

    If there is an allergy conflict, set warning to a string describing it.
    If no conflict, set warning to null.
    Suggest 2-4 medicines maximum.

    Diagnosis: ${diagnosis}

    Patient allergies: ${patientAllergies.length > 0
            ? patientAllergies.join(", ")
            : "None"
        }

    Available medicines in inventory:
    ${availableMedicines
            .map((m) => `- ${m.name} (${m.unit})`)
            .join("\n")}
    `.trim();

    const rawResponse = await callGemini(prompt);

    // Parse JSON response from Gemini
    // Gemini sometimes wraps JSON in markdown code blocks
    try {
        const cleaned = rawResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        const suggestions: AISuggestion[] = JSON.parse(cleaned);
        return suggestions;
    } catch {
        throw new ApiError(
            500,
            "AI returned an unexpected format. Please try again."
        );
    }
};

// AI Symptom Checker______________________________________________________________________________________
/**
 * checkSymptoms
 * Patient describes symptoms → Gemini gives general guidance
 *
 * Important: this is NOT a diagnosis tool
 * The prompt enforces a disclaimer in every response
 *
 * What we send to Gemini:
 *   - Patient's symptom description
 *
 * What Gemini returns:
 *   - Plain english guidance, ends with "visit us" reminder
 */
export const checkSymptoms = async (symptoms: string): Promise<string> => {
    if (!symptoms.trim()) {
        throw new ApiError(400, "Please describe your symptoms");
    }

    const prompt = `
    You are a helpful medical information assistant for a private dispensary.
    Your role is to provide general health guidance — never diagnose.
    Always recommend the patient see the doctor for proper assessment.
    Keep your response under 120 words. Be compassionate and clear.
    End every response with exactly this sentence: "Please visit us so the doctor can assess you properly."

    Patient is experiencing: ${symptoms}

    Provide general guidance on what this might be and what to expect.
    `.trim();

    return await callGemini(prompt);
};

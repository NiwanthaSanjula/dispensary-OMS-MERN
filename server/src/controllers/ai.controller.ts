import { Request, Response } from 'express'
import { checkSymptoms, getPatientSummary, getPrescriptionSuggestions } from "../services/ai.service";
import { asyncHandler } from "../utils/asyncHandler";
import { Consultation } from '../models/Consultation.model';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Medicine } from '../models/Medicine.model';

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/ai/summary/:patientId
// @desc    Get AI patient briefing for doctor
// ─────────────────────────────────────────────────────────────────
export const getAISummary = asyncHandler(
    async (req: Request, res: Response) => {
        const summary = await getPatientSummary(req.params.patientId as string);

        // Mark consultation as having used AI summary if consultationId passed
        if (req.query.consultationId) {
            await Consultation.findByIdAndUpdate(req.query.consultationId, {
                aiSummaryUsed: true,
            });
        }

        res.status(200).json(
            new ApiResponse("AI summary generated", { summary })
        );
    }
);


/**_____________________________________________________________________________________________________________
* @route   POST /api/ai/suggest
* @desc    Get AI prescription suggestions for doctor
* _____________________________________________________________________________________________________________
*/

export const getAISuggestions = asyncHandler(
    async (req: Request, res: Response) => {
        const { diagnosis, patientAllergies, consultationId } = req.body;

        if (!diagnosis) {
            throw new ApiError(400, "Diagnosis is required");
        }

        // Get available medicines from inventory (stockQty > 0)
        const medicines = await Medicine.find({
            isActive: true,
            stockQty: { $gt: 0 },
        }).select("name unit");

        const availableMedicines = medicines.map((m) => ({
            name: m.name,
            unit: m.unit,
        }));

        const suggestions = await getPrescriptionSuggestions(
            diagnosis,
            patientAllergies || [],
            availableMedicines
        );

        res.status(200).json(
            new ApiResponse("AI suggestions generated", { suggestions })
        );
    }
);

/**_____________________________________________________________________________________________________________
* @route   POST /api/ai/symptom-check
* @desc    AI symptom checker for patients
* _____________________________________________________________________________________________________________
*/
export const symptomCheck = asyncHandler(
    async (req: Request, res: Response) => {
        const { symptoms } = req.body;
        const guidance = await checkSymptoms(symptoms);
        res.status(200).json(
            new ApiResponse("Symptom guidance generated", { guidance })
        );
    }
);
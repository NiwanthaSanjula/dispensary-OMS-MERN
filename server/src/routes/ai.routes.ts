import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { getAISuggestions, getAISummary, symptomCheck } from "../controllers/ai.controller";

/**
 * AI Routes
 * Base path: /api/ai
 */
const router = Router();

// Patient summary — doctor only
router.get("/summary/:patientId", verifyJWT, authorizeRoles("doctor"), getAISummary);

// Prescription suggestions — doctor only
router.post("/suggest", verifyJWT, authorizeRoles("doctor"), getAISuggestions);

// Symptom checker — patient + public (no auth required)
router.post("/symptom-check", symptomCheck);

export default router;
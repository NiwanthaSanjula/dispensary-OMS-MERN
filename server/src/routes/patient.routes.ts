import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { createPatient, getMyProfile, getPatientById, getPatientHistory, getPatients, updatePatient } from "../controllers/patient.controller";

/**
 * Patient Routes
 * Base path: /api/patients
 */


const router = Router();

// All patient routes required authentication
router.use(verifyJWT);

router.get("/", authorizeRoles("doctor", "assistant"), getPatients);
router.get("/me", authorizeRoles("patient"), getMyProfile);
router.post("/new-patient", authorizeRoles("assistant"), createPatient);
router.get("/:id", authorizeRoles("doctor", "assistant"), getPatientById);
router.put("/:id", authorizeRoles("assistant"), updatePatient);
router.get("/:id/history", authorizeRoles("doctor", "assistant"), getPatientHistory);

export default router;



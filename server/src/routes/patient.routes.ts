import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { createPatient, getPatientById, getPatientHistory, getPatients, updatePatient } from "../controllers/patient.controller";

/**
 * Patient Routes
 * Base path: /api/patients
 */


const router = Router();

// All patient routes required authentication
router.use(verifyJWT);

router.get("/", authorizeRoles("doctor", "assistant"), getPatients);
router.post("/new-patient", authorizeRoles("assistant"), createPatient);
router.get("/:id", authorizeRoles("doctor", "assistant"), getPatientById);
router.put("/:id", authorizeRoles("assistant"), updatePatient);
router.get("/:id/history", authorizeRoles("assistant"), getPatientHistory);

export default router;



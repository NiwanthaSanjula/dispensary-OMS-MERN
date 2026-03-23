import { Router } from "express";
import {
    createPrescription,
    getPrescriptionById,
    getPrescriptionsByPatient,
} from "../controllers/prescription.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

/**
 * Prescription Routes
 * Base path: /api/prescriptions
 */
const router = Router();

router.use(verifyJWT);

router.post("/", authorizeRoles("doctor"), createPrescription);
router.get("/patient/:patientId", authorizeRoles("doctor", "patient"), getPrescriptionsByPatient);
router.get("/:id", authorizeRoles("doctor", "patient"), getPrescriptionById);

export default router;
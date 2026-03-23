import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { createConsultation, getConsultationByAppointment, getConsultationById, getConsultationsByPatient, updateConsultation } from "../controllers/consultation.controller";

/**
 * Consultation Routes
 * Base path: /api/consultations
 */

const router = Router();

router.use(verifyJWT);

router.post("/", authorizeRoles("doctor"), createConsultation);
router.get("/appointment/:appointmentId", authorizeRoles("doctor"), getConsultationByAppointment);
router.get("/patient/:patientId", authorizeRoles("doctor"), getConsultationsByPatient);
router.get("/:id", authorizeRoles("doctor"), getConsultationById);
router.put("/:id", authorizeRoles("doctor"), updateConsultation);


export default router

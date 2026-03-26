import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { getAppointmentById, getAppointments, updateAppointmentStatus } from "../controllers/appointment.controller";

/**
 * Appointment Routes
 * base pathL /api/appointments
 */
const router = Router();

router.use(verifyJWT);

router.get("/", authorizeRoles("doctor", "assistant", "patient"), getAppointments);
router.get("/:id", authorizeRoles("doctor", "assistant"), getAppointmentById);
router.put("/:id/status", authorizeRoles("doctor", "assistant", "patient"), updateAppointmentStatus);

export default router;

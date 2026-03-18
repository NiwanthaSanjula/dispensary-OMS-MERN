import { Router } from "express";
import { advanceQueue, closeQueue, getAvailableBookingDates, getLiveQueue, getTodayQueueData, initQueue, issueQueueToken, pauseQueue, resumeQueue } from "../controllers/queue.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

/**
 * Queue Routes
 * Base path: /api/queue
 */
const router = Router();

// Public - no auth required
router.get("/live", getLiveQueue);
router.get("/available-dates", getAvailableBookingDates);

// All authenticated roles
router.get("/today", verifyJWT, authorizeRoles("doctor", "assistant"), getTodayQueueData);

// Token issuance - assistant (manual) + patient (online)
router.post("/token", verifyJWT, authorizeRoles("doctor", "assistant", "patient"), issueQueueToken);

// Queue init
router.post("/init", verifyJWT, authorizeRoles("assistant"), initQueue);

// Queue management
router.put("/next", verifyJWT, authorizeRoles("doctor"), advanceQueue);
router.put("/pause", verifyJWT, authorizeRoles("doctor"), pauseQueue);
router.put("/resume", verifyJWT, authorizeRoles("doctor"), resumeQueue);

// Close
router.put("/close", verifyJWT, authorizeRoles("doctor", "assistant"), closeQueue);

export default router;

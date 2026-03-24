import { Router } from "express";
import { getMedicines, getLowStockMedicines, getStockLogs, createMedicine, getMedicineById, updateMedicine, deactivateMedicine, addStock } from "../controllers/medicine.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

/**
 * Medicine Routes
 * Base path: /api/medicines
 */
const router = Router();

router.use(verifyJWT);

// Specific routes first (before /:id)
router.get("/low-stock", authorizeRoles("doctor", "assistant"), getLowStockMedicines);
router.get("/stocklogs", authorizeRoles("doctor", "assistant"), getStockLogs);
router.post("/", authorizeRoles("assistant"), createMedicine);
router.get("/", authorizeRoles("doctor", "assistant"), getMedicines);

// Dynamic route
router.get("/:id", authorizeRoles("doctor", "assistant"), getMedicineById);
router.put("/:id", authorizeRoles("assistant"), updateMedicine);
router.delete("/:id", authorizeRoles("assistant"), deactivateMedicine);
router.post("/:id/stock", authorizeRoles("assistant"), addStock);

export default router;
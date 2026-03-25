import { Router } from "express";
import {
    getSettings,
    updateSettings,
    changePassword,
} from "../controllers/settings.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.use(verifyJWT);

router.get("/", authorizeRoles("doctor", "assistant"), getSettings);
router.put("/", authorizeRoles("doctor"), updateSettings);
router.put("/password", authorizeRoles("doctor"), changePassword);

export default router;
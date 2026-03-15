import { Router } from "express"
import { login, logout, refresh, register } from "../controllers/auth.controller";
import { verifyJWT } from "../middleware/auth.middleware";

/**
 * Auth Routes
 * Base path: /api/auth
*/

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);               //  Requires refresh token cookie
router.post("/logout", verifyJWT, logout);      //  Requires valid access token

export default router


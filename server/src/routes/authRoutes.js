import { Router } from "express";
import { login, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login); //       POST /api/auth/login  (ai cũng gọi được)
router.get("/me", protect, getMe); //  GET  /api/auth/me     (phải có token)

export default router;
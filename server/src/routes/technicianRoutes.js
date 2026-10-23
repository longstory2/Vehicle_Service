import { Router } from "express";
import { approveTechnician, getPendingTechnicians } from "../controllers/technicianController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/pending", protect, authorize("admin"), getPendingTechnicians);
router.put("/:id/approve", protect, authorize("admin"), approveTechnician);

export default router;

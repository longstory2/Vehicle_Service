import { Router } from "express";
import {
    approveTechnician,
    getMyAvailability,
    getPendingTechnicians,
    updateMyAvailability,
} from "../controllers/technicianController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/pending", protect, authorize("admin"), getPendingTechnicians);
router.put("/:id/approve", protect, authorize("admin"), approveTechnician);
router.get("/availability", protect, authorize("technician"), getMyAvailability);
router.put("/availability", protect, authorize("technician"), updateMyAvailability);

export default router;
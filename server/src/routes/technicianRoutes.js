import { Router } from "express";
import {
    getTechnicians,
    createTechnician,
    updateTechnician,
    getPendingTechnicians,
    approveTechnician,
    getMyAvailability,
    updateMyAvailability,
} from "../controllers/technicianController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

// LƯU Ý THỨ TỰ: các đường dẫn cố định ("/pending", "/availability") phải khai báo TRƯỚC "/:id",
// nếu không Express sẽ hiểu "availability" là một :id
// ----- Kỹ thuật viên tự dùng trên app mobile -----
router.get("/availability", protect, authorize("technician"), getMyAvailability);
router.put("/availability", protect, authorize("technician"), updateMyAvailability);

// ----- Admin Web -----
router.get("/pending", protect, authorize("admin"), getPendingTechnicians); //   GET  /api/technicians/pending (hồ sơ chờ duyệt)
router.get("/", protect, authorize("admin"), getTechnicians); //                 GET  /api/technicians (đã duyệt)
router.post("/", protect, authorize("admin"), createTechnician); //              POST /api/technicians (admin tạo trực tiếp)
router.put("/:id/approve", protect, authorize("admin"), approveTechnician); //   PUT  /api/technicians/:id/approve
router.put("/:id", protect, authorize("admin"), updateTechnician); //            PUT  /api/technicians/:id


export default router;
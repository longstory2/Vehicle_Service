import { Router } from "express";
import { getTechnicians, createTechnician, updateTechnician } from "../controllers/technicianController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// router.use: áp dụng cho MỌI route bên dưới → tất cả đều phải là admin
router.use(protect, authorize("admin"));

router.get("/", getTechnicians); //      GET  /api/technicians
router.post("/", createTechnician); //   POST /api/technicians
router.put("/:id", updateTechnician); // PUT  /api/technicians/:id

export default router;
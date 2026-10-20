import { Router } from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Xem danh sách/chi tiết: ai cũng xem được (app khách hàng cần hiển thị dịch vụ)
router.get("/", getServices);
router.get("/:id", getServiceById);

// Thêm/sửa/xóa: phải đăng nhập (protect) VÀ là admin (authorize)
// Middleware chạy lần lượt từ trái sang phải; không qua được thì dừng, không tới controller
router.post("/", protect, authorize("admin"), createService);
router.put("/:id", protect, authorize("admin"), updateService);
router.delete("/:id", protect, authorize("admin"), deleteService);

export default router;
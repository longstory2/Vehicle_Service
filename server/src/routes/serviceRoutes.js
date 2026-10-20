import { Router } from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";

const router = Router();

// Đường dẫn gốc là /api/services (khai báo trong app.js)
router.get("/", getServices); //        GET    /api/services
router.get("/:id", getServiceById); //   GET    /api/services/:id
router.post("/", createService); //      POST   /api/services
router.put("/:id", updateService); //    PUT    /api/services/:id
router.delete("/:id", deleteService); // DELETE /api/services/:id

// Lưu ý: Giai đoạn 4 sẽ thêm middleware đăng nhập để chỉ admin được thêm/sửa/xóa

export default router;
import { Router } from "express";
import { register, login, getMe, updateMe, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register); //                  POST /api/auth/register (khách hàng tự đăng ký trên app)
router.post("/login", login); //                        POST /api/auth/login    (ai cũng gọi được)
router.get("/me", protect, getMe); //                   GET  /api/auth/me       (phải có token)
router.put("/me", protect, updateMe); //                PUT  /api/auth/me       (sửa họ tên, số điện thoại)
router.put("/change-password", protect, changePassword); // PUT /api/auth/change-password (đổi mật khẩu)

// Dòng export luôn để CUỐI file, sau tất cả các route
export default router;
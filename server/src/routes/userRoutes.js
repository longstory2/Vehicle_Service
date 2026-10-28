import { Router } from "express";
import { getCustomers, setLockStatus } from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Tất cả route quản lý người dùng chỉ dành cho admin
router.use(protect, authorize("admin"));

router.get("/customers", getCustomers); //   GET   /api/users/customers
router.patch("/:id/lock", setLockStatus); // PATCH /api/users/:id/lock

export default router;
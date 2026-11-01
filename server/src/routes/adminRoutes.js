import { Router } from "express";
import { getOrders, getOrderById, cancelOrder, getStats } from "../controllers/adminOrderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Toàn bộ /api/admin/... chỉ dành cho admin
router.use(protect, authorize("admin"));

router.get("/stats", getStats); //                  GET /api/admin/stats?days=7
router.get("/orders", getOrders); //                GET /api/admin/orders?status=&search=&page=&limit=
router.get("/orders/:id", getOrderById); //         GET /api/admin/orders/:id
router.put("/orders/:id/cancel", cancelOrder); //   PUT /api/admin/orders/:id/cancel

export default router;
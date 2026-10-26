import { Router } from "express";
import {
    acceptOrder,
    createOrder,
    getAvailableOrders,
    getMyOrders,
} from "../controllers/orderController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", protect, authorize("customer"), createOrder);
router.get("/available", protect, authorize("technician"), getAvailableOrders);
router.get("/mine", protect, authorize("technician"), getMyOrders);
router.put("/:id/accept", protect, authorize("technician"), acceptOrder);

export default router;
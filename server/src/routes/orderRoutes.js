import { Router } from "express";
import {
    acceptOrder,
    createOrder,
    getAvailableOrders,
    getOrderById,
    getMyOrders,
    markOrderArrived,
    completeOrder,
    cancelOrder,
    inspectOrder,
    proposeParts,
    respondToPartsProposal,
    startRepair,
    rateTechnician,
    rateCustomer,
    getCustomerOrders,
    rejectOrder,
    updateTechnicianLocation,
} from "../controllers/orderController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", protect, authorize("customer"), createOrder);
router.get("/available", protect, authorize("technician"), getAvailableOrders);
router.get("/mine", protect, authorize("technician"), getMyOrders);
router.get("/customer/mine", protect, authorize("customer"), getCustomerOrders);
router.get("/:id", protect, authorize("customer", "technician"), getOrderById);
router.put("/:id/accept", protect, authorize("technician"), acceptOrder);
router.put("/:id/reject", protect, authorize("technician"), rejectOrder);
router.put("/:id/arrived", protect, authorize("technician"), markOrderArrived);
router.put("/:id/cancel", protect, authorize("customer"), cancelOrder);
router.put("/:id/inspect", protect, authorize("technician"), inspectOrder);
router.put("/:id/parts/propose", protect, authorize("technician"), proposeParts);
router.put("/:id/parts/respond", protect, authorize("customer"), respondToPartsProposal);
router.put("/:id/repair", protect, authorize("technician"), startRepair);
router.put("/:id/complete", protect, authorize("technician"), completeOrder);
router.put("/:id/customer-rating", protect, authorize("customer"), rateTechnician);
router.put("/:id/technician-rating", protect, authorize("technician"), rateCustomer);
router.put("/:id/location", protect, authorize("technician"), updateTechnicianLocation);
export default router;
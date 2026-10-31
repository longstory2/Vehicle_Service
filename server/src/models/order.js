import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Chỉ được gán khi một kỹ thuật viên nhận đơn.
        technicianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        serviceDetails: {
            category: { type: String, default: "" },
            serviceName: { type: String, default: "" },
            sparePart: { type: String, default: "" },
            vehicleType: { type: String, default: "" },
            vehicleMake: { type: String, default: "" },
            plate: { type: String, default: "" },
            mileage: { type: String, default: "" },
            description: { type: String, default: "" },
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
        technicianLocation: {
            latitude: { type: Number },
            longitude: { type: Number },
            updatedAt: { type: Date },
        },
        estimatedPrice: {
            type: Number,
            min: 0,
            default: 0,
        },
        additionalParts: [
            {
                _id: false,
                name: { type: String, required: true, trim: true },
                quantity: { type: Number, min: 1, required: true },
                unitPrice: { type: Number, min: 0, required: true },
            },
        ],
        partsProposal: {
            name: { type: String, trim: true, default: "" },
            quantity: { type: Number, min: 1, default: 1 },
            unitPrice: { type: Number, min: 0, default: 0 },
            response: {
                type: String,
                enum: ["PENDING", "ACCEPTED", "REJECTED"],
                default: null,
            },
        },
        totalPrice: {
            type: Number,
            min: 0,
            default: 0,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        customerRating: {
            score: { type: Number, min: 1, max: 5, default: null },
            comment: { type: String, default: "" },
        },
        technicianRating: {
            score: { type: Number, min: 1, max: 5, default: null },
            comment: { type: String, default: "" },
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "momo", "vnpay"],
            default: "cash",
        },
        status: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "ARRIVED",
                "INSPECTING",
                "AWAITING_PARTS_APPROVAL",
                "REPAIRING",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "PENDING",
        },
        offers: [
            {
                _id: false,
                technicianId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                offeredAt: {
                    type: Date,
                    required: true,
                },
                response: {
                    type: String,
                    enum: ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"],
                    default: "PENDING",
                },
            },
        ],
        acceptedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
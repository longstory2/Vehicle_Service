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
        estimatedPrice: {
            type: Number,
            min: 0,
            default: 0,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "offer"],
            default: "cash",
        },
        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "COMPLETED", "CANCELLED"],
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
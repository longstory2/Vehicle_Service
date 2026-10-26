import mongoose from "mongoose";
import Order from "../models/order.js";

const readText = (value) =>
    typeof value === "string" ? value.trim() : "";

export const createOrder = async (req, res) => {
    const { serviceDetails, address, location, estimatedPrice, paymentMethod } =
        req.body;

    const cleanAddress = readText(address);
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    const price = Number(estimatedPrice ?? 0);

    if (!cleanAddress) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng cung cấp địa chỉ điểm đón",
        });
    }

    if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        return res.status(400).json({
            success: false,
            message: "Tọa độ điểm đón không hợp lệ",
        });
    }

    if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
            success: false,
            message: "Giá ước tính không hợp lệ",
        });
    }

    if (paymentMethod !== undefined && !["cash", "offer"].includes(paymentMethod)) {
        return res.status(400).json({
            success: false,
            message: "Phương thức thanh toán không hợp lệ",
        });
    }

    const details = serviceDetails && typeof serviceDetails === "object"
        ? serviceDetails
        : {};

    const order = await Order.create({
        // Lấy khách hàng từ token đăng nhập, không tin customerId do app gửi lên.
        customerId: req.user._id,
        serviceDetails: {
            category: readText(details.category),
            serviceName: readText(details.serviceName),
            sparePart: readText(details.sparePart),
            vehicleType: readText(details.vehicleType),
            vehicleMake: readText(details.vehicleMake),
            plate: readText(details.plate),
            mileage: readText(details.mileage),
            description: readText(details.description),
        },
        address: cleanAddress,
        location: { latitude, longitude },
        estimatedPrice: price,
        paymentMethod: paymentMethod ?? "cash",
        status: "PENDING",
    });

    res.status(201).json({
        success: true,
        message: "Đã gửi đơn, đang chờ kỹ thuật viên xác nhận",
        data: order,
    });
};

export const getAvailableOrders = async (req, res) => {
    const orders = await Order.find({
        status: "PENDING",
        technicianId: null,
    })
        .populate("customerId", "fullName phone")
        .sort({ createdAt: -1 })
        .lean();

    res.json({ success: true, data: orders });
};

export const getMyOrders = async (req, res) => {
    const orders = await Order.find({ technicianId: req.user._id })
        .populate("customerId", "fullName phone")
        .sort({ createdAt: -1 })
        .lean();

    res.json({ success: true, data: orders });
};

export const acceptOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    // Cập nhật có điều kiện để chỉ kỹ thuật viên đầu tiên nhận được đơn.
    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            status: "PENDING",
            technicianId: null,
        },
        {
            $set: {
                status: "ACCEPTED",
                technicianId: req.user._id,
                acceptedAt: new Date(),
            },
        },
        { returnDocument: "after" }
    ).populate("customerId", "fullName phone");

    if (!order) {
        const exists = await Order.exists({ _id: id });

        return res.status(exists ? 409 : 404).json({
            success: false,
            message: exists
                ? "Đơn đã được kỹ thuật viên khác nhận hoặc không còn chờ xác nhận"
                : "Không tìm thấy đơn hàng",
        });
    }

    res.json({
        success: true,
        message: "Bạn đã nhận đơn hàng",
        data: order,
    });
};
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

const OFFER_DURATION_MS = 30_000;

export const getAvailableOrders = async (req, res) => {
    if (req.user.isAcceptingOrders === false) {
        return res.json({ success: true, data: [] });
    }

    const cutoff = new Date(Date.now() - OFFER_DURATION_MS);

    // Đánh dấu offer đã hết hạn với riêng kỹ thuật viên đang hỏi danh sách.
    await Order.updateMany(
        {
            status: "PENDING",
            offers: {
                $elemMatch: {
                    technicianId: req.user._id,
                    response: "PENDING",
                    offeredAt: { $lte: cutoff },
                },
            },
        },
        { $set: { "offers.$[offer].response": "EXPIRED" } },
        {
            arrayFilters: [
                {
                    "offer.technicianId": req.user._id,
                    "offer.response": "PENDING",
                    "offer.offeredAt": { $lte: cutoff },
                },
            ],
        }
    );

    // Ghi offer lần đầu khi đơn được hiển thị cho kỹ thuật viên.
    const newOrders = await Order.find({
        status: "PENDING",
        technicianId: null,
        offers: {
            $not: {
                $elemMatch: { technicianId: req.user._id },
            },
        },
    }).select("_id");

    for (const order of newOrders) {
        await Order.updateOne(
            {
                _id: order._id,
                status: "PENDING",
                technicianId: null,
                offers: {
                    $not: {
                        $elemMatch: { technicianId: req.user._id },
                    },
                },
            },
            {
                $push: {
                    offers: {
                        technicianId: req.user._id,
                        offeredAt: new Date(),
                        response: "PENDING",
                    },
                },
            }
        );
    }

    const activeCutoff = new Date(Date.now() - OFFER_DURATION_MS);

    const orders = await Order.find({
        status: "PENDING",
        technicianId: null,
        offers: {
            $elemMatch: {
                technicianId: req.user._id,
                response: "PENDING",
                offeredAt: { $gt: activeCutoff },
            },
        },
    })
        .populate("customerId", "fullName phone")
        .sort({ createdAt: -1 })
        .lean();

    const data = orders.map((order) => {
        const offer = order.offers.find(
            (item) =>
                item.technicianId.toString() === req.user._id.toString() &&
                item.response === "PENDING"
        );

        return {
            ...order,
            offerExpiresAt: new Date(
                new Date(offer.offeredAt).getTime() + OFFER_DURATION_MS
            ).toISOString(),
        };
    });

    res.json({ success: true, data });
};

export const getMyOrders = async (req, res) => {
    const orders = await Order.find({ technicianId: req.user._id })
        .populate("customerId", "fullName phone")
        .sort({ createdAt: -1 })
        .lean();

    res.json({ success: true, data: orders });
};

export const acceptOrder = async (req, res) => {
    if (req.user.isAcceptingOrders === false) {
        return res.status(403).json({
            success: false,
            message: "Bạn đang tắt trạng thái nhận đơn",
        });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    const cutoff = new Date(Date.now() - OFFER_DURATION_MS);

    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            status: "PENDING",
            technicianId: null,
            offers: {
                $elemMatch: {
                    technicianId: req.user._id,
                    response: "PENDING",
                    offeredAt: { $gt: cutoff },
                },
            },
        },
        {
            $set: {
                status: "ACCEPTED",
                technicianId: req.user._id,
                acceptedAt: new Date(),
                "offers.$.response": "ACCEPTED",
            },
        },
        { returnDocument: "after" }
    ).populate("customerId", "fullName phone");

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Offer đã hết hạn hoặc đơn đã được kỹ thuật viên khác nhận",
        });
    }

    res.json({
        success: true,
        message: "Bạn đã nhận đơn hàng",
        data: order,
    });
};

// Hàm từ chối
export const rejectOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    const cutoff = new Date(Date.now() - OFFER_DURATION_MS);

    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            status: "PENDING",
            technicianId: null,
            offers: {
                $elemMatch: {
                    technicianId: req.user._id,
                    response: "PENDING",
                    offeredAt: { $gt: cutoff },
                },
            },
        },
        { $set: { "offers.$.response": "REJECTED" } },
        { returnDocument: "after" }
    );

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Offer đã hết hạn hoặc không còn khả dụng",
        });
    }

    res.json({
        success: true,
        message: "Đã từ chối đơn này",
        data: order,
    });
};
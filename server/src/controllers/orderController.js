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

    if (paymentMethod !== undefined && !["cash", "momo", "vnpay"].includes(paymentMethod)) {
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
        totalPrice: price,
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

export const getCustomerOrders = async (req, res) => {
    const orders = await Order.find({ customerId: req.user._id })
        .populate("technicianId", "fullName phone")
        .sort({ createdAt: -1 })
        .lean();

    res.json({ success: true, data: orders });
};

export const getOrderById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    const order = await Order.findById(id)
        .populate("technicianId", "fullName phone")
        .lean();

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn hàng",
        });
    }

    const isCustomer = order.customerId.toString() === req.user._id.toString();
    const isAssignedTechnician =
        order.technicianId?._id.toString() === req.user._id.toString();

    if (!isCustomer && !isAssignedTechnician) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn hàng",
        });
    }

    res.json({ success: true, data: order });
};

export const updateTechnicianLocation = async (req, res) => {
    const { id } = req.params;
    const latitude = req.body?.latitude;
    const longitude = req.body?.longitude;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    if (
        typeof latitude !== "number" ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        typeof longitude !== "number" ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        return res.status(400).json({
            success: false,
            message: "Tọa độ kỹ thuật viên không hợp lệ",
        });
    }

    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            technicianId: req.user._id,
            status: { $in: ["ACCEPTED", "ARRIVED", "INSPECTING", "AWAITING_PARTS_APPROVAL", "REPAIRING"] },
        },
        {
            $set: {
                technicianLocation: { latitude, longitude, updatedAt: new Date() },
            },
        },
        { returnDocument: "after" }
    );

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Đơn không còn được giao cho bạn hoặc đã kết thúc",
        });
    }

    res.json({ success: true, data: order.technicianLocation });
};

export const markOrderArrived = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    const order = await Order.findOneAndUpdate(
        { _id: id, technicianId: req.user._id, status: "ACCEPTED" },
        { $set: { status: "ARRIVED" } },
        { returnDocument: "after" }
    )
        .populate("technicianId", "fullName phone")
        .populate("customerId", "fullName phone");

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Đơn không còn ở trạng thái đang được xác nhận",
        });
    }

    res.json({ success: true, data: order });
};

export const cancelOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            customerId: req.user._id,
            status: { $in: ["PENDING", "ACCEPTED"] },
        },
        { $set: { status: "CANCELLED" } },
        { returnDocument: "after" }
    ).populate("technicianId", "fullName phone");

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Đơn đã bắt đầu kiểm tra hoặc không thuộc về bạn",
        });
    }

    res.json({ success: true, data: order });
};

export const inspectOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    const order = await Order.findOneAndUpdate(
        { _id: id, technicianId: req.user._id, status: "ACCEPTED" },
        { $set: { status: "INSPECTING" } },
        { returnDocument: "after" }
    )
        .populate("technicianId", "fullName phone")
        .populate("customerId", "fullName phone");

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Đơn không còn ở trạng thái chờ kiểm tra",
        });
    }

    res.json({ success: true, data: order });
};

export const proposeParts = async (req, res) => {
    const { id } = req.params;
    const name = readText(req.body?.name);
    const quantity = Number(req.body?.quantity);
    const unitPrice = Number(req.body?.unitPrice);

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }
    if (!name || !Number.isInteger(quantity) || quantity < 1 ||
        !Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({
            success: false,
            message: "Tên, số lượng và đơn giá phụ tùng không hợp lệ",
        });
    }

    const order = await Order.findOneAndUpdate(
        { _id: id, technicianId: req.user._id, status: "INSPECTING" },
        {
            $set: {
                status: "AWAITING_PARTS_APPROVAL",
                partsProposal: { name, quantity, unitPrice, response: "PENDING" },
            },
        },
        { returnDocument: "after" }
    )
        .populate("technicianId", "fullName phone")
        .populate("customerId", "fullName phone");

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Đơn không còn ở trạng thái kiểm tra",
        });
    }

    res.json({ success: true, data: order });
};

export const respondToPartsProposal = async (req, res) => {
    const { id } = req.params;
    const accepted = req.body?.accepted;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }
    if (typeof accepted !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "Phản hồi phụ tùng không hợp lệ",
        });
    }

    const currentOrder = await Order.findOne({
        _id: id,
        customerId: req.user._id,
        status: "AWAITING_PARTS_APPROVAL",
        "partsProposal.response": "PENDING",
    });

    if (!currentOrder) {
        return res.status(409).json({
            success: false,
            message: "Không còn phụ tùng nào đang chờ bạn xác nhận",
        });
    }

    const proposal = currentOrder.partsProposal;
    const nextParts = accepted
        ? [...currentOrder.additionalParts, {
            name: proposal.name,
            quantity: proposal.quantity,
            unitPrice: proposal.unitPrice,
        }]
        : currentOrder.additionalParts;
    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            customerId: req.user._id,
            status: "AWAITING_PARTS_APPROVAL",
            "partsProposal.response": "PENDING",
        },
        {
            $set: {
                "partsProposal.response": accepted ? "ACCEPTED" : "REJECTED",
                status: accepted ? "REPAIRING" : "INSPECTING",
                totalPrice: currentOrder.estimatedPrice + nextParts.reduce(
                    (total, part) => total + part.quantity * part.unitPrice,
                    0
                ),
            },
            ...(accepted
                ? {
                    $push: {
                        additionalParts: {
                            name: proposal.name,
                            quantity: proposal.quantity,
                            unitPrice: proposal.unitPrice,
                        },
                    },
                }
                : {}),
        },
        { returnDocument: "after" }
    ).populate("technicianId", "fullName phone");

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Đề xuất phụ tùng đã được xử lý",
        });
    }

    res.json({ success: true, data: order });
};

export const startRepair = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    const order = await Order.findOneAndUpdate(
        { _id: id, technicianId: req.user._id, status: "INSPECTING" },
        { $set: { status: "REPAIRING" } },
        { returnDocument: "after" }
    )
        .populate("technicianId", "fullName phone")
        .populate("customerId", "fullName phone");

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Đơn không còn ở trạng thái kiểm tra",
        });
    }

    res.json({ success: true, data: order });
};

export const completeOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hàng không hợp lệ",
        });
    }

    const order = await Order.findOne({
        _id: id,
        technicianId: req.user._id,
        status: { $in: ["REPAIRING", "ARRIVED"] },
    });

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Chỉ có thể hoàn thành đơn sau khi đã bắt đầu sửa chữa",
        });
    }

    order.status = "COMPLETED";
    order.completedAt = new Date();
    order.totalPrice = order.estimatedPrice + order.additionalParts.reduce(
        (total, part) => total + part.quantity * part.unitPrice,
        0
    );
    await order.save();

    res.json({ success: true, data: order });
};

const saveRating = async ({ id, userId, field, score, comment }) => {
    if (!mongoose.isValidObjectId(id)) {
        return { error: { status: 400, message: "Mã đơn hàng không hợp lệ" } };
    }
    if (!Number.isInteger(score) || score < 1 || score > 5 || typeof comment !== "string") {
        return { error: { status: 400, message: "Điểm đánh giá phải từ 1 đến 5" } };
    }

    const update = {
        [`${field}.score`]: score,
        [`${field}.comment`]: comment.trim().slice(0, 1000),
    };
    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            status: "COMPLETED",
            [field === "customerRating" ? "customerId" : "technicianId"]: userId,
            [`${field}.score`]: null,
        },
        { $set: update },
        { returnDocument: "after" }
    );

    if (!order) {
        return { error: { status: 409, message: "Đơn chưa hoàn thành hoặc đã được đánh giá" } };
    }

    return { order };
};

export const rateTechnician = async (req, res) => {
    const result = await saveRating({
        id: req.params.id,
        userId: req.user._id,
        field: "customerRating",
        score: Number(req.body?.score),
        comment: req.body?.comment ?? "",
    });
    if (result.error) {
        return res.status(result.error.status).json({
            success: false,
            message: result.error.message,
        });
    }
    res.json({ success: true, data: result.order });
};

export const rateCustomer = async (req, res) => {
    const result = await saveRating({
        id: req.params.id,
        userId: req.user._id,
        field: "technicianRating",
        score: Number(req.body?.score),
        comment: req.body?.comment ?? "",
    });
    if (result.error) {
        return res.status(result.error.status).json({
            success: false,
            message: result.error.message,
        });
    }
    res.json({ success: true, data: result.order });
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
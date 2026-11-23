import mongoose from "mongoose";
import Order from "../models/order.js";
import { getTechniciansHoldingOffer, rankTechnicians } from "../services/matching.js";

const readText = (value) =>
    typeof value === "string" ? value.trim() : "";

const parseOrderRequest = (body) => {
    const { serviceDetails, address, location, estimatedPrice, paymentMethod } = body;
    const cleanAddress = readText(address);
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    const price = Number(estimatedPrice ?? 0);

    if (!cleanAddress) return { error: "Vui lòng cung cấp địa chỉ điểm đón" };
    if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        return { error: "Tọa độ điểm đón không hợp lệ" };
    }
    if (!Number.isFinite(price) || price < 0) {
        return { error: "Giá ước tính không hợp lệ" };
    }
    if (paymentMethod !== undefined && !["cash", "momo", "vnpay"].includes(paymentMethod)) {
        return { error: "Phương thức thanh toán không hợp lệ" };
    }

    const details = serviceDetails && typeof serviceDetails === "object" ? serviceDetails : {};
    return {
        data: {
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
        },
    };
};

const getRankedCandidates = async (order) => {
    const excludeIds = await getTechniciansHoldingOffer();
    const { candidates } = await rankTechnicians(order, { excludeIds });
    return candidates.slice(0, 5);
};

const toPublicCandidate = (candidate) => ({
    technicianId: String(candidate.technicianId),
    fullName: candidate.fullName,
    distanceKm: candidate.distanceKm,
    ratingAvg: candidate.ratingAvg,
    ratingCount: candidate.ratingCount,
    score: candidate.score,
});

export const getOrderTechnicianCandidates = async (req, res) => {
    const parsed = parseOrderRequest(req.body);
    if (parsed.error) {
        return res.status(400).json({ success: false, message: parsed.error });
    }

    const candidates = await getRankedCandidates(parsed.data);
    res.json({
        success: true,
        data: candidates.map(toPublicCandidate),
    });
};

export const createOrder = async (req, res) => {
    const parsed = parseOrderRequest(req.body);
    if (parsed.error) {
        return res.status(400).json({ success: false, message: parsed.error });
    }

    const selectedTechnicianId = req.body.technicianId;
    if (!mongoose.isValidObjectId(selectedTechnicianId)) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng chọn một kỹ thuật viên trong danh sách",
        });
    }

    const candidates = await getRankedCandidates(parsed.data);
    const selectedTechnician = candidates.find(
        (candidate) => String(candidate.technicianId) === String(selectedTechnicianId),
    );
    if (!selectedTechnician) {
        return res.status(409).json({
            success: false,
            message: "Kỹ thuật viên đã không còn phù hợp. Vui lòng tải lại danh sách.",
        });
    }

    const order = await Order.create({
        ...parsed.data,
        customerId: req.user._id,
        totalPrice: parsed.data.estimatedPrice,
        status: "PENDING",
        customerSelectedTechnician: true,
        candidateTechnicians: candidates.map(toPublicCandidate),
        offers: [{
            technicianId: selectedTechnician.technicianId,
            offeredAt: new Date(),
            response: "PENDING",
        }],
    });
    await order.populate("offers.technicianId", "fullName");

    res.status(201).json({
        success: true,
        message: "Đã gửi đơn cho kỹ thuật viên, đang chờ xác nhận",
        data: order,
    });
};

export const selectNextOrderTechnician = async (req, res) => {
    const { id } = req.params;
    const selectedTechnicianId = req.body?.technicianId;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(selectedTechnicianId)) {
        return res.status(400).json({
            success: false,
            message: "Mã đơn hoặc kỹ thuật viên không hợp lệ",
        });
    }

    const order = await Order.findOne({
        _id: id,
        customerId: req.user._id,
        status: "PENDING",
        customerSelectedTechnician: true,
    });
    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn đang chờ kỹ thuật viên",
        });
    }

    const lastOffer = order.offers.at(-1);
    if (!lastOffer || lastOffer.response !== "REJECTED") {
        return res.status(409).json({
            success: false,
            message: "Chỉ có thể chọn kỹ thuật viên khác sau khi người trước từ chối",
        });
    }

    const selectedCandidate = order.candidateTechnicians.find(
        (candidate) => String(candidate.technicianId) === String(selectedTechnicianId),
    );
    if (!selectedCandidate || order.offers.some(
        (offer) => String(offer.technicianId) === String(selectedTechnicianId),
    )) {
        return res.status(400).json({
            success: false,
            message: "Kỹ thuật viên này không còn trong danh sách lựa chọn",
        });
    }

    const excludeIds = [
        ...order.offers.map((offer) => offer.technicianId),
        ...(await getTechniciansHoldingOffer()),
    ];
    const { candidates } = await rankTechnicians(order, { excludeIds });
    if (!candidates.some(
        (candidate) => String(candidate.technicianId) === String(selectedTechnicianId),
    )) {
        return res.status(409).json({
            success: false,
            message: "Kỹ thuật viên này hiện không còn khả dụng. Vui lòng chọn người khác.",
        });
    }

    const updatedOrder = await Order.findOneAndUpdate(
        {
            _id: id,
            customerId: req.user._id,
            status: "PENDING",
            customerSelectedTechnician: true,
            offers: { $not: { $elemMatch: { response: "PENDING" } } },
            "offers.technicianId": { $ne: selectedTechnicianId },
        },
        {
            $push: {
                offers: {
                    technicianId: selectedTechnicianId,
                    offeredAt: new Date(),
                    response: "PENDING",
                },
            },
        },
        { returnDocument: "after" },
    ).populate("offers.technicianId", "fullName");

    if (!updatedOrder) {
        return res.status(409).json({
            success: false,
            message: "Đơn vừa được cập nhật. Vui lòng tải lại trạng thái đơn.",
        });
    }

    res.json({
        success: true,
        message: "Đã gửi lại đơn cho kỹ thuật viên",
        data: updatedOrder,
    });
};

export const getAvailableOrders = async (req, res) => {
    if (req.user.isAcceptingOrders === false) {
        return res.json({ success: true, data: [] });
    }

    const orders = await Order.find({
        status: "PENDING",
        technicianId: null,
        offers: {
            $elemMatch: {
                technicianId: req.user._id,
                response: "PENDING",
            },
        },
    })
        .select("-candidateTechnicians")
        .populate("customerId", "fullName phone")
        .sort({ createdAt: -1 })
        .lean();

    res.json({ success: true, data: orders });
};

export const getMyOrders = async (req, res) => {
    const orders = await Order.find({ technicianId: req.user._id })
        .select("-candidateTechnicians")
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
        .populate("offers.technicianId", "fullName")
        .populate("customerId", "fullName phone")
        .lean();

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn hàng",
        });
    }

    const customerId = order.customerId?._id ?? order.customerId;
    const technicianId = order.technicianId?._id ?? order.technicianId;
    const requesterId = req.user._id.toString();
    const isCustomer = customerId?.toString() === requesterId;
    const isAssignedTechnician = technicianId?.toString() === requesterId;

    if (!isCustomer && !isAssignedTechnician) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn hàng",
        });
    }

    if (!isCustomer) delete order.candidateTechnicians;

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

    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            status: "PENDING",
            technicianId: null,
            offers: {
                $elemMatch: {
                    technicianId: req.user._id,
                    response: "PENDING",
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
            message: "Đơn đã được kỹ thuật viên khác nhận hoặc không còn khả dụng",
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

    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            status: "PENDING",
            technicianId: null,
            offers: {
                $elemMatch: {
                    technicianId: req.user._id,
                    response: "PENDING",
                },
            },
        },
        { $set: { "offers.$.response": "REJECTED" } },
        { returnDocument: "after" }
    );

    if (!order) {
        return res.status(409).json({
            success: false,
            message: "Đơn không còn khả dụng",
        });
    }

    res.json({
        success: true,
        message: "Đã từ chối đơn này",
        data: order,
    });
};
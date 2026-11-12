import Order from "../models/order.js";
import User from "../models/User.js";
import { rankTechnicians, MATCHING_CONFIG } from "../services/matching.js";
// Các trạng thái "đang xử lý": đã có kỹ thuật viên nhận nhưng chưa hoàn thành
const ACTIVE_STATUSES = ["ACCEPTED", "ARRIVED", "INSPECTING", "AWAITING_PARTS_APPROVAL", "REPAIRING"];

// Múi giờ Việt Nam: dùng khi gom đơn theo ngày (tránh đơn lúc 0h-7h bị tính sang ngày hôm trước)
const TZ = "Asia/Ho_Chi_Minh";

// Lấy ngày dạng "YYYY-MM-DD" theo giờ Việt Nam
const toDateKey = (date) => date.toLocaleDateString("en-CA", { timeZone: TZ });

// GET /api/admin/orders?status=&search=&page=1&limit=10
// - status: một trạng thái (PENDING, COMPLETED...) hoặc "ACTIVE" (đang xử lý); bỏ trống = tất cả
// - search: tìm theo địa chỉ, tên dịch vụ, biển số, tên/SĐT khách hoặc kỹ thuật viên
export const getOrders = async (req, res) => {
  const { status, search } = req.query;

  // Phân trang: page bắt đầu từ 1, limit tối đa 100 dòng mỗi trang
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

  const filter = {};
  if (status === "ACTIVE") filter.status = { $in: ACTIVE_STATUSES };
  else if (status) filter.status = status;

  if (search) {
    const regex = { $regex: search, $options: "i" };
    // Tên và SĐT nằm ở users → tìm users trước, rồi lọc đơn có customerId/technicianId thuộc danh sách
    const users = await User.find({ $or: [{ fullName: regex }, { phone: regex }] }).select("_id");
    const userIds = users.map((u) => u._id);

    filter.$or = [
      { address: regex },
      { "serviceDetails.serviceName": regex },
      { "serviceDetails.plate": regex },
      { customerId: { $in: userIds } },
      { technicianId: { $in: userIds } },
    ];
  }

  // Chạy song song: lấy 1 trang dữ liệu + đếm tổng số đơn khớp bộ lọc (để vẽ phân trang)
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 }) // đơn mới nhất lên đầu
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("customerId", "fullName phone")
      .populate("technicianId", "fullName phone"),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: { items, total, page, limit } });
};

// GET /api/admin/orders/:id - Chi tiết 1 đơn (kèm lịch sử gửi đơn cho kỹ thuật viên)
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customerId", "fullName phone email")
    .populate("technicianId", "fullName phone email")
    .populate("offers.technicianId", "fullName phone");

  if (!order) {
    return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
  }
  res.json({ success: true, data: order });
};

// PUT /api/admin/orders/:id/cancel - Admin hủy đơn (ví dụ đơn bị treo, khách báo nhầm)
// Không hủy được đơn đã hoàn thành hoặc đã hủy
export const cancelOrder = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: { $nin: ["COMPLETED", "CANCELLED"] } },
    { $set: { status: "CANCELLED" } },
    { returnDocument: "after" }
  )
    .populate("customerId", "fullName phone email")
    .populate("technicianId", "fullName phone email");

  if (!order) {
    return res.status(400).json({
      success: false,
      message: "Không thể hủy: đơn không tồn tại, đã hoàn thành hoặc đã bị hủy",
    });
  }
  res.json({ success: true, data: order, message: "Đã hủy đơn hàng" });
};

// GET /api/admin/stats?days=7 - Số liệu cho Dashboard
export const getStats = async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);

  // 0h hôm nay theo giờ Việt Nam, và 0h của ngày đầu tiên trong khoảng thống kê
  const startOfToday = new Date(`${toDateKey(new Date())}T00:00:00+07:00`);
  const fromDate = new Date(startOfToday.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  // Approved = đã duyệt (kể cả tài khoản cũ chưa có trường technicianApprovalStatus)
  const approvedTech = { role: "technician", technicianApprovalStatus: { $ne: "pending" } };

  // Chạy song song các truy vấn độc lập để trả lời nhanh hơn
  const [
    statusCounts,
    revenueResult,
    ratingResult,
    todayOrders,
    customers,
    technicians,
    pendingTechnicians,
    onlineTechnicians,
    dailyResult,
    topServicesResult,
  ] = await Promise.all([
    // Số đơn theo từng trạng thái, ví dụ [{ _id: "COMPLETED", count: 12 }, ...]
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

    // Doanh thu = tổng totalPrice của các đơn đã hoàn thành
    Order.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" } } },
    ]),

    // Điểm trung bình khách chấm kỹ thuật viên (customerRating.score)
    Order.aggregate([
      { $match: { "customerRating.score": { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$customerRating.score" }, count: { $sum: 1 } } },
    ]),

    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ role: "customer" }),
    User.countDocuments(approvedTech),
    User.countDocuments({ role: "technician", technicianApprovalStatus: "pending" }),
    // Đang trực: đã duyệt, không bị khóa, đang bật nhận đơn
    User.countDocuments({ ...approvedTech, isLocked: false, isAcceptingOrders: { $ne: false } }),

    // Số đơn và doanh thu theo từng ngày (gom theo ngày tạo đơn, giờ Việt Nam)
    Order.aggregate([
      { $match: { createdAt: { $gte: fromDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$totalPrice", 0] } },
        },
      },
    ]),

    // 5 dịch vụ được đặt nhiều nhất (không tính đơn đã hủy)
    Order.aggregate([
      { $match: { status: { $ne: "CANCELLED" } } },
      { $group: { _id: "$serviceDetails.serviceName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  // Đổi mảng [{ _id, count }] thành object { PENDING: 3, COMPLETED: 12, ... }
  const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
  const totalOrders = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const activeOrders = ACTIVE_STATUSES.reduce((sum, s) => sum + (byStatus[s] || 0), 0);

  // Điền đủ từng ngày trong khoảng (ngày không có đơn → 0) để biểu đồ không bị "khuyết"
  const dailyMap = new Map(dailyResult.map((d) => [d._id, d]));
  const daily = [];
  for (let i = 0; i < days; i++) {
    const key = toDateKey(new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000));
    const found = dailyMap.get(key);
    daily.push({ date: key, orders: found?.orders || 0, revenue: found?.revenue || 0 });
  }

  res.json({
    success: true,
    data: {
      totals: {
        orders: totalOrders,
        todayOrders,
        activeOrders,
        pendingOrders: byStatus.PENDING || 0,
        completedOrders: byStatus.COMPLETED || 0,
        cancelledOrders: byStatus.CANCELLED || 0,
        revenue: revenueResult[0]?.revenue || 0,
        avgRating: ratingResult[0] ? Number(ratingResult[0].avg.toFixed(1)) : null,
        ratingCount: ratingResult[0]?.count || 0,
        customers,
        technicians,
        pendingTechnicians,
        onlineTechnicians,
      },
      byStatus,
      daily,
      topServices: topServicesResult.map((s) => ({ name: s._id || "Không rõ", count: s.count })),
    },
  });
};
// GET /api/admin/orders/:id/candidates?all=true
// Bảng xếp hạng kỹ thuật viên cho một đơn (dùng để kiểm tra thuật toán và minh họa trong báo cáo)
// - mặc định: chỉ người đang trực, bỏ những người đã được gửi đơn này
// - all=true: xem tất cả (kể cả đang offline), không loại ai
export const getOrderCandidates = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
  }

  const showAll = req.query.all === "true";
  const result = await rankTechnicians(order, {
    excludeIds: showAll ? [] : order.offers.map((offer) => offer.technicianId),
    onlyOnline: !showAll,
  });

  res.json({ success: true, data: { ...result, weights: MATCHING_CONFIG.weights } });
};
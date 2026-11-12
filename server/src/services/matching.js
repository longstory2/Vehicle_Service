import Technician from "../models/Technician.js";
import Service from "../models/Service.js";
import Order from "../models/order.js";

// ===== Tham số thuật toán (theo mục thiết kế ghép cặp trong đề cương) =====
export const MATCHING_CONFIG = {
  // Trọng số SAW: khoảng cách, đánh giá, kỹ năng, khối lượng công việc (tổng = 1)
  weights: { distance: 0.4, rating: 0.3, skill: 0.2, load: 0.1 },
  initialRadiusKm: 5, // bán kính tìm ban đầu
  radiusStepKm: 2.5, // mỗi vòng không có ai thì mở rộng thêm
  maxRadiusKm: 10, // bán kính tối đa
  maxOrdersPerShift: 8, // số đơn tối đa một kỹ thuật viên nhận trong ngày
  onlineWindowMs: 2 * 60 * 1000, // coi là "đang trực" nếu hỏi đơn trong 2 phút gần nhất
};

// Đơn đang được xử lý → kỹ thuật viên của đơn đó đang bận
const ACTIVE_STATUSES = ["ACCEPTED", "ARRIVED", "INSPECTING", "AWAITING_PARTS_APPROVAL", "REPAIRING"];

// App gửi loại xe dạng chữ ("Xe máy", "Ô tô") → đổi về mã dùng trong services/technicians
export const normalizeVehicleType = (text) => {
  const value = String(text || "").toLowerCase();
  return value.includes("ô tô") || value.includes("oto") || value.includes("car") ? "car" : "motorbike";
};

// 0h hôm nay theo giờ Việt Nam (để đếm số đơn đã nhận trong ngày)
const startOfTodayVN = () => {
  const key = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); // "YYYY-MM-DD"
  return new Date(`${key}T00:00:00+07:00`);
};

// Làm tròn để kết quả dễ đọc
const round = (value, digits = 3) => Number(value.toFixed(digits));

// Tìm hồ sơ kỹ thuật viên trong bán kính radiusKm quanh vị trí đơn, kèm khoảng cách
// $geoNear dùng chỉ mục 2dsphere trên currentLocation (đã tạo ở Technician.js)
const findNearby = (order, radiusKm) =>
  Technician.aggregate([
    {
      $geoNear: {
        // GeoJSON: [kinh độ, vĩ độ]
        near: { type: "Point", coordinates: [order.location.longitude, order.location.latitude] },
        distanceField: "distanceMeters", // MongoDB tự tính khoảng cách (mét) vào trường này
        maxDistance: radiusKm * 1000,
        spherical: true,
        key: "currentLocation",
      },
    },
    // Ghép thông tin tài khoản (trạng thái duyệt, khóa, bật nhận đơn) từ collection users
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
  ]);

// Xếp hạng kỹ thuật viên cho một đơn
// options.excludeIds: những người đã được gửi đơn này (đã từ chối / hết giờ) → bỏ qua
// options.onlyOnline: false = xem cả người đang offline (dùng cho admin xem thử)
export const rankTechnicians = async (order, { excludeIds = [], onlyOnline = true } = {}) => {
  const cfg = MATCHING_CONFIG;
  const vehicleType = normalizeVehicleType(order.serviceDetails?.vehicleType);

  // Dịch vụ trong đơn (lưu dạng tên) → tìm bản ghi services để so với kỹ năng
  const service = await Service.findOne({ name: order.serviceDetails?.serviceName, vehicleType });

  const excluded = new Set(excludeIds.map(String));
  // Những kỹ thuật viên đang làm đơn khác
  const busyIds = new Set(
    (await Order.distinct("technicianId", { status: { $in: ACTIVE_STATUSES } })).map(String)
  );
  const onlineSince = new Date(Date.now() - cfg.onlineWindowMs);

  // Mở rộng bán kính dần: 5 → 7,5 → 10 km cho đến khi có ứng viên
  for (let radiusKm = cfg.initialRadiusKm; radiusKm <= cfg.maxRadiusKm; radiusKm += cfg.radiusStepKm) {
    const nearby = await findNearby(order, radiusKm);

    // ----- Bước 1: lọc ứng viên hợp lệ -----
    const eligible = nearby.filter((tech) => {
      const user = tech.user;
      const distanceKm = tech.distanceMeters / 1000;
      return (
        user.role === "technician" &&
        user.technicianApprovalStatus !== "pending" && // đã được duyệt
        !user.isLocked &&
        user.isAcceptingOrders !== false && // đang bật nhận đơn
        (tech.specialty === "both" || tech.specialty === vehicleType) && // đúng chuyên môn
        distanceKm <= tech.radiusKm && // trong bán kính nhận việc của chính họ
        !busyIds.has(String(user._id)) &&
        !excluded.has(String(user._id)) &&
        (!onlyOnline || (tech.lastSeenAt && tech.lastSeenAt >= onlineSince))
      );
    });
    if (eligible.length === 0) continue; // không có ai → mở rộng bán kính

    const userIds = eligible.map((tech) => tech.user._id);

    // Sao trung bình khách chấm cho từng kỹ thuật viên (từ lịch sử đơn)
    const ratings = await Order.aggregate([
      { $match: { technicianId: { $in: userIds }, "customerRating.score": { $ne: null } } },
      { $group: { _id: "$technicianId", avg: { $avg: "$customerRating.score" }, count: { $sum: 1 } } },
    ]);
    // Số đơn đã nhận hôm nay (không tính đơn bị hủy)
    const loads = await Order.aggregate([
      { $match: { technicianId: { $in: userIds }, acceptedAt: { $gte: startOfTodayVN() }, status: { $ne: "CANCELLED" } } },
      { $group: { _id: "$technicianId", count: { $sum: 1 } } },
    ]);
    const ratingMap = new Map(ratings.map((r) => [String(r._id), r]));
    const loadMap = new Map(loads.map((l) => [String(l._id), l.count]));

    // ----- Bước 2: chấm điểm SAW -----
    const w = cfg.weights;
    const ranked = eligible
      .map((tech) => {
        const id = String(tech.user._id);
        const distanceKm = tech.distanceMeters / 1000;
        const rating = ratingMap.get(id);
        const ordersToday = loadMap.get(id) || 0;

        const sDistance = 1 - distanceKm / radiusKm; // càng gần càng cao
        const sRating = rating ? (rating.avg - 1) / 4 : 0.5; // 1 sao → 0, 5 sao → 1; chưa có → 0,5
        // Dịch vụ "Kiểm tra, chẩn đoán" mặc định: ai cũng làm được
        const sSkill =
          !service || service.isDefaultInspection || tech.skills.some((s) => String(s) === String(service._id))
            ? 1
            : 0;
        const sLoad = Math.max(0, 1 - ordersToday / cfg.maxOrdersPerShift); // càng ít đơn càng cao

        const score = w.distance * sDistance + w.rating * sRating + w.skill * sSkill + w.load * sLoad;

        return {
          technicianId: tech.user._id,
          fullName: tech.user.fullName,
          phone: tech.user.phone,
          distanceKm: round(distanceKm, 2),
          ratingAvg: rating ? round(rating.avg, 2) : null,
          ratingCount: rating ? rating.count : 0,
          ordersToday,
          scores: { distance: round(sDistance), rating: round(sRating), skill: sSkill, load: round(sLoad) },
          score: round(score),
        };
      })
      .filter((c) => c.ordersToday < cfg.maxOrdersPerShift) // đã đủ đơn trong ngày → bỏ
      // ----- Bước 3: xếp hạng; bằng điểm thì ai gần hơn đứng trước -----
      .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);

    if (ranked.length > 0) {
      return { radiusKm, vehicleType, serviceId: service?._id ?? null, candidates: ranked };
    }
  }

  // Đã mở rộng tới 10 km mà không có ai
  return { radiusKm: cfg.maxRadiusKm, vehicleType, serviceId: service?._id ?? null, candidates: [] };
};
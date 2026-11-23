import Order from "../models/order.js";
import Technician from "../models/Technician.js";
import { getTechniciansHoldingOffer, rankTechnicians } from "./matching.js";

// Chu kỳ quét của bộ ghép cặp
const SWEEP_INTERVAL_MS = 10_000;

// Đọc tọa độ từ chuỗi; không hợp lệ → null
const parseCoordinate = (value, limit) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
};

// Ghi nhận kỹ thuật viên đang mở app (lastSeenAt) và vị trí hiện tại (nếu app gửi lên)
// Trả về false nếu kỹ thuật viên chưa có hồ sơ nghề nghiệp
export const markTechnicianSeen = async (userId, lat, lng) => {
  const latitude = parseCoordinate(lat, 90);
  const longitude = parseCoordinate(lng, 180);
  const update = { lastSeenAt: new Date() };
  if (latitude !== null && longitude !== null) {
    update.currentLocation = { type: "Point", coordinates: [longitude, latitude] }; // GeoJSON: [kinh độ, vĩ độ]
  }
  const result = await Technician.updateOne({ userId }, { $set: update });
  return result.matchedCount > 0;
};

// Gửi đơn cho kỹ thuật viên có điểm SAW cao nhất, nếu đơn đang không có ai giữ
// Trả về ứng viên được chọn, hoặc null nếu chưa gửi được
export const dispatchOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order || order.status !== "PENDING" || order.technicianId || order.customerSelectedTechnician) return null;

  // Đang có người giữ offer chưa phản hồi → chờ người đó trả lời
  const hasActiveOffer = order.offers.some((offer) => offer.response === "PENDING");
  if (hasActiveOffer) return null;

  // Bỏ qua: người đã từ chối đơn này và người đang giữ đơn khác
  const { candidates } = await rankTechnicians(order, {
    excludeIds: [
      ...order.offers.map((offer) => offer.technicianId),
      ...(await getTechniciansHoldingOffer()),
    ],
  });
  if (candidates.length === 0) return null; // chưa có ai phù hợp → lần quét sau thử lại

  const best = candidates[0];

  // Ghi offer CÓ ĐIỀU KIỆN: nếu 2 lần quét chạy cùng lúc thì chỉ một lần ghi được
  const result = await Order.updateOne(
    {
      _id: order._id,
      status: "PENDING",
      technicianId: null,
      offers: { $not: { $elemMatch: { response: "PENDING" } } },
      "offers.technicianId": { $ne: best.technicianId }, // chưa từng gửi cho người này
    },
    { $push: { offers: { technicianId: best.technicianId, offeredAt: new Date(), response: "PENDING" } } }
  );
  if (result.modifiedCount === 0) return null;

  console.log(`[Ghép cặp] Đơn ${order._id} → ${best.fullName} (score ${best.score})`);
  return best;
};

// Một lần quét: thử ghép cho mọi đơn đang chờ (đơn cũ trước)
let sweeping = false;
const sweep = async () => {
  if (sweeping) return; // lần quét trước chưa xong → bỏ lượt này
  sweeping = true;
  try {
    const pendingOrders = await Order.find({ status: "PENDING", technicianId: null })
      .sort({ createdAt: 1 })
      .select("_id");
    for (const { _id } of pendingOrders) {
      await dispatchOrder(_id);
    }
  } catch (error) {
    console.error("[Ghép cặp] Lỗi khi quét:", error.message);
  } finally {
    sweeping = false;
  }
};

// Gọi một lần khi server khởi động (server.js)
export const startDispatcher = () => {
  setInterval(sweep, SWEEP_INTERVAL_MS);
  console.log(`Bộ ghép cặp đã chạy (quét mỗi ${SWEEP_INTERVAL_MS / 1000} giây)`);
};
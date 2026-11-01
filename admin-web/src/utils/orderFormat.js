// Nhãn tiếng Việt và màu (theo bảng màu của MUI Chip) cho từng trạng thái đơn
// Khớp enum status trong server/src/models/order.js
export const ORDER_STATUS = {
  PENDING: { label: "Chờ nhận", color: "warning" },
  ACCEPTED: { label: "Đã nhận", color: "info" },
  ARRIVED: { label: "Đã đến nơi", color: "info" },
  INSPECTING: { label: "Đang kiểm tra", color: "info" },
  AWAITING_PARTS_APPROVAL: { label: "Chờ duyệt phụ tùng", color: "secondary" },
  REPAIRING: { label: "Đang sửa", color: "primary" },
  COMPLETED: { label: "Hoàn thành", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "default" },
};

export const PAYMENT_LABELS = { cash: "Tiền mặt", momo: "MoMo", vnpay: "VNPay" };

// Phản hồi của kỹ thuật viên khi được gửi đơn (mảng offers)
export const OFFER_LABELS = {
  PENDING: "Đang chờ",
  ACCEPTED: "Đã nhận",
  REJECTED: "Từ chối",
  EXPIRED: "Hết thời gian",
};

// 120000 → "120.000 đ"
export const formatPrice = (value) => `${(value || 0).toLocaleString("vi-VN")} đ`;

// Ngày giờ kiểu Việt Nam: "01/11/2026 13:45"; không có thì "—"
export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// Mã đơn ngắn để hiển thị: 6 ký tự cuối của _id, viết hoa (ví dụ "#A1B2C3")
export const shortOrderId = (id) => `#${String(id).slice(-6).toUpperCase()}`;
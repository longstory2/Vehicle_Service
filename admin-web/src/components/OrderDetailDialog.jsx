import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Link,
  Rating,
} from "@mui/material";
import adminApi from "../api/adminApi";
import OrderStatusChip from "./OrderStatusChip";
import CandidateRanking from "./CandidateRanking";
import {
  formatPrice,
  formatDateTime,
  shortOrderId,
  PAYMENT_LABELS,
  OFFER_LABELS,
} from "../utils/orderFormat";

// Một dòng "Nhãn: giá trị"; giá trị rỗng → hiện "—"
function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", py: 0.5 }}>
      <Typography sx={{ width: 160, flexShrink: 0, color: "text.secondary" }}>{label}</Typography>
      <Typography sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
    </Box>
  );
}

// Tiêu đề nhỏ cho từng phần
function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, mb: 0.5 }}>
      {children}
    </Typography>
  );
}

// Props:
//  - orderId: _id đơn cần xem
//  - onClose: đóng hộp thoại
//  - onCancelled: gọi sau khi admin hủy đơn thành công (để trang cha tải lại bảng)
export default function OrderDetailDialog({ orderId, onClose, onCancelled }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Mở hộp thoại: tải chi tiết đơn
  useEffect(() => {
    adminApi
      .getOrder(orderId)
      .then((res) => setOrder(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Không tải được chi tiết đơn"));
  }, [orderId]);

  // Admin hủy đơn: hỏi xác nhận trước
  const handleCancel = async () => {
    if (!window.confirm(`Hủy đơn ${shortOrderId(order._id)}? Thao tác này không hoàn tác được.`)) return;
    setCancelling(true);
    setError("");
    try {
      const res = await adminApi.cancelOrder(order._id);
      setOrder(res.data.data); // hiển thị ngay trạng thái "Đã hủy"
      onCancelled?.();
    } catch (err) {
      setError(err.response?.data?.message || "Không hủy được đơn");
    } finally {
      setCancelling(false);
    }
  };

  // Chỉ hủy được đơn chưa hoàn thành và chưa bị hủy
  const canCancel = order && !["COMPLETED", "CANCELLED"].includes(order.status);
  const details = order?.serviceDetails || {};

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        Chi tiết đơn {order && shortOrderId(order._id)}
        {order && <OrderStatusChip status={order.status} />}
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Đang tải */}
        {!order && !error && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {order && (
          <>
            {/* Hai cột: khách hàng | kỹ thuật viên */}
            <Stack direction="row" spacing={4}>
              <Box sx={{ flex: 1 }}>
                <SectionTitle>Khách hàng</SectionTitle>
                <InfoRow label="Họ tên" value={order.customerId?.fullName} />
                <InfoRow label="Số điện thoại" value={order.customerId?.phone} />
                <InfoRow label="Email" value={order.customerId?.email} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <SectionTitle>Kỹ thuật viên</SectionTitle>
                {order.technicianId ? (
                  <>
                    <InfoRow label="Họ tên" value={order.technicianId.fullName} />
                    <InfoRow label="Số điện thoại" value={order.technicianId.phone} />
                    <InfoRow label="Email" value={order.technicianId.email} />
                  </>
                ) : (
                  <Typography sx={{ color: "text.secondary" }}>Chưa có kỹ thuật viên nhận</Typography>
                )}
              </Box>
            </Stack>

            <Divider sx={{ mt: 2 }} />

            {/* Dịch vụ và xe */}
            <SectionTitle>Dịch vụ & phương tiện</SectionTitle>
            <InfoRow label="Dịch vụ" value={details.serviceName} />
            <InfoRow label="Danh mục" value={details.category} />
            <InfoRow
              label="Xe"
              value={[details.vehicleType, details.vehicleMake].filter(Boolean).join(" - ")}
            />
            <InfoRow label="Biển số" value={details.plate} />
            <InfoRow label="Số km" value={details.mileage} />
            <InfoRow label="Phụ tùng yêu cầu" value={details.sparePart} />
            <InfoRow label="Mô tả sự cố" value={details.description} />
            <InfoRow
              label="Địa chỉ"
              value={
                <>
                  {order.address}{" "}
                  {/* Mở vị trí trên OpenStreetMap ở tab mới */}
                  <Link
                    href={`https://www.openstreetmap.org/?mlat=${order.location.latitude}&mlon=${order.location.longitude}#map=17/${order.location.latitude}/${order.location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    (xem bản đồ)
                  </Link>
                </>
              }
            />

            <Divider sx={{ mt: 2 }} />

            {/* Chi phí */}
            <SectionTitle>Chi phí</SectionTitle>
            <InfoRow label="Giá ước tính" value={formatPrice(order.estimatedPrice)} />
            {order.additionalParts?.length > 0 && (
              <Table size="small" sx={{ my: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Phụ tùng phát sinh</TableCell>
                    <TableCell align="right">SL</TableCell>
                    <TableCell align="right">Đơn giá</TableCell>
                    <TableCell align="right">Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.additionalParts.map((part, index) => (
                    <TableRow key={index}>
                      <TableCell>{part.name}</TableCell>
                      <TableCell align="right">{part.quantity}</TableCell>
                      <TableCell align="right">{formatPrice(part.unitPrice)}</TableCell>
                      <TableCell align="right">{formatPrice(part.quantity * part.unitPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {/* Đề xuất phụ tùng đang chờ khách duyệt */}
            {order.partsProposal?.response === "PENDING" && (
              <Alert severity="info" sx={{ my: 1 }}>
                Đang chờ khách duyệt phụ tùng: {order.partsProposal.name} × {order.partsProposal.quantity} (
                {formatPrice(order.partsProposal.unitPrice)}/cái)
              </Alert>
            )}
            <InfoRow label="Tổng tiền" value={formatPrice(order.totalPrice)} />
            <InfoRow label="Thanh toán" value={PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod} />

            <Divider sx={{ mt: 2 }} />

            {/* Các mốc thời gian */}
            <SectionTitle>Thời gian</SectionTitle>
            <InfoRow label="Đặt lúc" value={formatDateTime(order.createdAt)} />
            <InfoRow label="Nhận lúc" value={formatDateTime(order.acceptedAt)} />
            <InfoRow label="Hoàn thành lúc" value={formatDateTime(order.completedAt)} />

            {/* Đánh giá: chỉ hiện khi đã có */}
            {(order.customerRating?.score || order.technicianRating?.score) && (
              <>
                <Divider sx={{ mt: 2 }} />
                <SectionTitle>Đánh giá</SectionTitle>
                {order.customerRating?.score && (
                  <Box sx={{ py: 0.5 }}>
                    <Typography sx={{ color: "text.secondary" }}>Khách đánh giá kỹ thuật viên</Typography>
                    <Rating value={order.customerRating.score} readOnly size="small" />
                    <Typography>{order.customerRating.comment}</Typography>
                  </Box>
                )}
                {order.technicianRating?.score && (
                  <Box sx={{ py: 0.5 }}>
                    <Typography sx={{ color: "text.secondary" }}>Kỹ thuật viên đánh giá khách</Typography>
                    <Rating value={order.technicianRating.score} readOnly size="small" />
                    <Typography>{order.technicianRating.comment}</Typography>
                  </Box>
                )}
              </>
            )}

            {/* Lịch sử hệ thống gửi đơn cho các kỹ thuật viên */}
            {order.offers?.length > 0 && (
              <>
                <Divider sx={{ mt: 2 }} />
                <SectionTitle>Lịch sử gửi đơn</SectionTitle>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Kỹ thuật viên</TableCell>
                      <TableCell>Gửi lúc</TableCell>
                      <TableCell>Phản hồi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.offers.map((offer, index) => (
                      <TableRow key={index}>
                        <TableCell>{offer.technicianId?.fullName || "—"}</TableCell>
                        <TableCell>{formatDateTime(offer.offeredAt)}</TableCell>
                        <TableCell>{OFFER_LABELS[offer.response] || offer.response}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}            
            {/* Xếp hạng kỹ thuật viên theo thuật toán ghép cặp */}
            <Divider sx={{ mt: 2 }} />
            <SectionTitle>Xếp hạng kỹ thuật viên (thuật toán SAW)</SectionTitle>
            <CandidateRanking orderId={order._id} />
          </>
        )}
      </DialogContent>

      <DialogActions>
        {canCancel && (
          <Button color="error" onClick={handleCancel} disabled={cancelling} sx={{ mr: "auto" }}>
            {cancelling ? "Đang hủy..." : "Hủy đơn"}
          </Button>
        )}
        <Button variant="contained" onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
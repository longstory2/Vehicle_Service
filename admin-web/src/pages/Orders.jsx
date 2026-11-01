import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import adminApi from "../api/adminApi";
import OrderStatusChip from "../components/OrderStatusChip";
import OrderDetailDialog from "../components/OrderDetailDialog";
import { ORDER_STATUS, formatPrice, formatDateTime, shortOrderId } from "../utils/orderFormat";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0); // tổng số đơn khớp bộ lọc (để phân trang)
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Bộ lọc
  const [status, setStatus] = useState(""); // "" = tất cả, "ACTIVE" = đang xử lý
  const [searchInput, setSearchInput] = useState(""); // chữ đang gõ
  const [search, setSearch] = useState(""); // chữ dùng để gọi API (cập nhật sau khi ngừng gõ)

  // Phân trang: MUI đếm trang từ 0, server đếm từ 1
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedId, setSelectedId] = useState(null); // đơn đang xem chi tiết
  const [toast, setToast] = useState(null);

  // Chờ 0,4 giây sau lần gõ cuối mới tìm; gõ tiếp thì hủy hẹn giờ cũ
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0); // tìm mới → quay về trang đầu
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Tải 1 trang đơn hàng theo bộ lọc hiện tại
  const loadOrders = useCallback(async () => {
    try {
      const res = await adminApi.getOrders({
        status: status || undefined,
        search: search || undefined,
        page: page + 1, // đổi sang cách đếm của server
        limit: rowsPerPage,
      });
      setOrders(res.data.data.items);
      setTotal(res.data.data.total);
      setLoadError("");
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
      setLoadError(err.response?.data?.message || "Không tải được đơn hàng. Kiểm tra server (cổng 5000) đã chạy chưa.");
    } finally {
      setLoading(false);
    }
  }, [status, search, page, rowsPerPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Quản lý đơn hàng
      </Typography>

      {/* Thanh lọc */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Tìm theo dịch vụ, địa chỉ, biển số, tên/SĐT"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: 360, bgcolor: "white" }}
        />
        <TextField
          select
          size="small"
          label="Trạng thái"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          sx={{ width: 220, bgcolor: "white" }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="ACTIVE">Đang xử lý (đã nhận → đang sửa)</MenuItem>
          {/* Sinh các lựa chọn từ ORDER_STATUS để luôn khớp nhãn */}
          {Object.entries(ORDER_STATUS).map(([value, info]) => (
            <MenuItem key={value} value={value}>
              {info.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell>Mã đơn</TableCell>
              <TableCell>Đặt lúc</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Dịch vụ</TableCell>
              <TableCell>Kỹ thuật viên</TableCell>
              <TableCell align="right">Tổng tiền</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Không có đơn hàng nào
                </TableCell>
              </TableRow>
            )}

            {/* Bấm vào dòng để xem chi tiết */}
            {orders.map((o) => (
              <TableRow key={o._id} hover sx={{ cursor: "pointer" }} onClick={() => setSelectedId(o._id)}>
                <TableCell sx={{ fontFamily: "monospace" }}>{shortOrderId(o._id)}</TableCell>
                <TableCell>{formatDateTime(o.createdAt)}</TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 500 }}>{o.customerId?.fullName || "—"}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {o.customerId?.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>{o.serviceDetails?.serviceName || "—"}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {o.serviceDetails?.vehicleType}
                  </Typography>
                </TableCell>
                <TableCell>{o.technicianId?.fullName || "—"}</TableCell>
                <TableCell align="right">{formatPrice(o.totalPrice)}</TableCell>
                <TableCell>
                  <OrderStatusChip status={o.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Thanh phân trang ở cuối bảng */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Số dòng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} trên ${count}`}
        />
      </TableContainer>

      {/* Chỉ gắn hộp thoại khi có đơn được chọn */}
      {selectedId && (
        <OrderDetailDialog
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onCancelled={() => {
            setToast({ message: "Đã hủy đơn hàng", severity: "success" });
            loadOrders();
          }}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        ) : (
          <span />
        )}
      </Snackbar>
    </Box>
  );
}
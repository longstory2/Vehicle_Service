import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import userApi from "../api/userApi";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null); // { message, severity } hoặc null

  // Tải danh sách khách hàng theo ô tìm kiếm
  const loadCustomers = useCallback(async () => {
    try {
      const res = await userApi.getCustomers({ search: search || undefined });
      setCustomers(res.data.data);
      setLoadError("");
    } catch (err) {
      // Hiện câu báo lỗi thật từ server (nếu có) để dễ tìm nguyên nhân
      setLoadError(
        err.response?.data?.message ||
          "Không tải được danh sách kỹ thuật viên. Kiểm tra server (cổng 5000) đã chạy chưa."
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Khóa / mở khóa tài khoản khách hàng
  const handleToggleLock = async (customer) => {
    const willLock = !customer.isLocked;
    const question = willLock
      ? `Khóa tài khoản "${customer.fullName}"? Khách hàng sẽ không đăng nhập và đặt đơn được nữa.`
      : `Mở khóa tài khoản "${customer.fullName}"?`;
    if (!window.confirm(question)) return;

    try {
      const res = await userApi.setLock(customer._id, willLock);
      setToast({ message: res.data.message, severity: "success" });
      loadCustomers();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Không thực hiện được", severity: "error" });
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Quản lý khách hàng
      </Typography>

      <TextField
        size="small"
        label="Tìm theo tên, SĐT, email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: 320, bgcolor: "white", mb: 2 }}
      />

      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell>Họ tên</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Ngày đăng ký</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading && customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Chưa có khách hàng nào
                </TableCell>
              </TableRow>
            )}

            {customers.map((c) => (
              <TableRow key={c._id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{c.fullName}</TableCell>
                <TableCell>{c.phone || "—"}</TableCell>
                <TableCell>{c.email || "—"}</TableCell>
                {/* createdAt do timestamps: true tự tạo; đổi sang dạng ngày Việt Nam */}
                <TableCell>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={c.isLocked ? "Đã khóa" : "Hoạt động"}
                    color={c.isLocked ? "error" : "success"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={c.isLocked ? "Mở khóa" : "Khóa tài khoản"}>
                    <IconButton color={c.isLocked ? "success" : "error"} onClick={() => handleToggleLock(c)}>
                      {c.isLocked ? <LockOpenIcon /> : <LockIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
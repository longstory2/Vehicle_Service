import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import serviceApi from "../api/serviceApi";
import ServiceFormDialog from "../components/ServiceFormDialog";

// Đổi mã loại xe sang tiếng Việt để hiển thị
const VEHICLE_LABELS = { motorbike: "Xe máy", car: "Ô tô" };

// Định dạng tiền: 120000 → "120.000 đ"
const formatPrice = (value) => `${value.toLocaleString("vi-VN")} đ`;

export default function Services() {
  const [services, setServices] = useState([]); // dữ liệu bảng
  const [loading, setLoading] = useState(true); // đang tải lần đầu
  const [loadError, setLoadError] = useState(""); // lỗi khi tải danh sách

  // Bộ lọc
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState(""); // "" = tất cả loại xe

  // Hộp thoại: dialogOpen bật/tắt, editing = dịch vụ đang sửa (null = thêm mới)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Thông báo nhỏ góc màn hình: { message, severity } hoặc null
  const [toast, setToast] = useState(null);

  // Gọi API lấy danh sách theo bộ lọc hiện tại
  // useCallback: chỉ tạo lại hàm khi search/filterType đổi → useEffect bên dưới tự gọi lại
  const loadServices = useCallback(async () => {
    try {
      const res = await serviceApi.getAll({
        all: true, // admin xem cả dịch vụ đã ẩn
        search: search || undefined, // rỗng thì không gửi
        vehicleType: filterType || undefined,
      });
      setServices(res.data.data); // server trả { success, data }
      setLoadError("");
    } catch {
      setLoadError("Không tải được danh sách. Kiểm tra server (cổng 5000) đã chạy chưa.");
    } finally {
      setLoading(false);
    }
  }, [search, filterType]);

  // Chạy khi mở trang và mỗi khi bộ lọc thay đổi
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Mở hộp thoại thêm mới
  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  // Mở hộp thoại sửa, truyền dịch vụ của dòng được bấm
  const handleEdit = (service) => {
    setEditing(service);
    setDialogOpen(true);
  };

  // Lưu từ hộp thoại. Nếu lỗi thì KHÔNG bắt ở đây
  // để lỗi chạy ngược về hộp thoại hiển thị
  const handleSave = async (data) => {
    if (editing) {
      await serviceApi.update(editing._id, data);
    } else {
      await serviceApi.create(data);
    }
    setDialogOpen(false);
    setToast({ message: editing ? "Đã cập nhật dịch vụ" : "Đã thêm dịch vụ", severity: "success" });
    loadServices(); // tải lại bảng
  };

  // Xóa: hỏi xác nhận trước
  const handleDelete = async (service) => {
    if (!window.confirm(`Xóa dịch vụ "${service.name}"?`)) return;
    try {
      await serviceApi.remove(service._id);
      setToast({ message: "Đã xóa dịch vụ", severity: "success" });
      loadServices();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Không xóa được dịch vụ", severity: "error" });
    }
  };

  return (
    <Box>
      {/* Tiêu đề + nút thêm */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Quản lý dịch vụ
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Thêm dịch vụ
        </Button>
      </Box>

      {/* Thanh lọc */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Tìm theo tên"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280, bgcolor: "white" }}
        />
        <TextField
          select
          size="small"
          label="Loại xe"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ width: 180, bgcolor: "white" }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="motorbike">Xe máy</MenuItem>
          <MenuItem value="car">Ô tô</MenuItem>
        </TextField>
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

      {/* Bảng danh sách */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell>Tên dịch vụ</TableCell>
              <TableCell>Loại xe</TableCell>
              <TableCell align="right">Giá</TableCell>
              <TableCell align="right">Thời gian</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Đang tải */}
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {/* Tải xong nhưng không có dữ liệu */}
            {!loading && services.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Chưa có dịch vụ nào
                </TableCell>
              </TableRow>
            )}

            {/* Mỗi dịch vụ một dòng; key giúp React phân biệt các dòng */}
            {services.map((s) => (
              <TableRow key={s._id} hover>
                <TableCell>
                  <Typography fontWeight={500}>{s.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.description}
                  </Typography>
                </TableCell>
                <TableCell>{VEHICLE_LABELS[s.vehicleType]}</TableCell>
                <TableCell align="right">{formatPrice(s.price)}</TableCell>
                <TableCell align="right">{s.estimatedMinutes} phút</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={s.isActive ? "Đang hoạt động" : "Đã ẩn"}
                    color={s.isActive ? "success" : "default"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Sửa">
                    <IconButton onClick={() => handleEdit(s)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {/* Dịch vụ kiểm tra mặc định không được xóa → khóa nút */}
                  <Tooltip title={s.isDefaultInspection ? "Dịch vụ mặc định, không thể xóa" : "Xóa"}>
                    <span>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(s)}
                        disabled={s.isDefaultInspection}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Chỉ gắn hộp thoại khi mở → mỗi lần mở form được khởi tạo lại từ đầu */}
      {dialogOpen && (
        <ServiceFormDialog service={editing} onClose={() => setDialogOpen(false)} onSubmit={handleSave} />
      )}

      {/* Thông báo góc dưới, tự tắt sau 3 giây */}
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
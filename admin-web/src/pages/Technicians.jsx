import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
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
  Tabs,
  Tab,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import technicianApi from "../api/technicianApi";
import userApi from "../api/userApi";
import TechnicianFormDialog from "../components/TechnicianFormDialog";
import PendingTechnicians from "../components/PendingTechnicians";

// Đổi mã chuyên môn sang tiếng Việt
const SPECIALTY_LABELS = { motorbike: "Xe máy", car: "Ô tô", both: "Xe máy + Ô tô" };

export default function Technicians() {
  const [tab, setTab] = useState("approved"); // "approved" | "pending"

  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  // Hộp thoại: editing = kỹ thuật viên đang sửa (null = thêm mới)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Thông báo nhỏ góc màn hình: { message, severity } hoặc null
  const [toast, setToast] = useState(null);

  // Tải danh sách đã duyệt theo ô tìm kiếm
  const loadTechnicians = useCallback(async () => {
    try {
      const res = await technicianApi.getAll({ search: search || undefined });
      setTechnicians(res.data.data);
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
    loadTechnicians();
  }, [loadTechnicians]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (technician) => {
    setEditing(technician);
    setDialogOpen(true);
  };

  // Lưu từ hộp thoại; lỗi KHÔNG bắt ở đây để hộp thoại tự hiện lỗi
  const handleSave = async (data) => {
    if (editing) {
      await technicianApi.update(editing._id, data);
    } else {
      await technicianApi.create(data);
    }
    setDialogOpen(false);
    setToast({ message: editing ? "Đã cập nhật kỹ thuật viên" : "Đã thêm kỹ thuật viên", severity: "success" });
    loadTechnicians();
  };

  // Khóa / mở khóa: _id ở đây là _id tài khoản (users) nên dùng thẳng cho API khóa
  const handleToggleLock = async (technician) => {
    const willLock = !technician.isLocked;
    const question = willLock
      ? `Khóa tài khoản "${technician.fullName}"? Kỹ thuật viên sẽ không đăng nhập và nhận đơn được nữa.`
      : `Mở khóa tài khoản "${technician.fullName}"?`;
    if (!window.confirm(question)) return;

    try {
      const res = await userApi.setLock(technician._id, willLock);
      setToast({ message: res.data.message, severity: "success" });
      loadTechnicians();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Không thực hiện được", severity: "error" });
    }
  };

  return (
    <Box>
      {/* Tiêu đề + nút thêm (chỉ hiện ở tab Đã duyệt) */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Quản lý kỹ thuật viên
        </Typography>
        {tab === "approved" && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Thêm kỹ thuật viên
          </Button>
        )}
      </Box>

      {/* Hai tab: value của Tab khớp với state tab */}
      <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="approved" label="Đã duyệt" />
        <Tab value="pending" label="Chờ duyệt" />
      </Tabs>

      {/* ===== Tab Chờ duyệt ===== */}
      {tab === "pending" && <PendingTechnicians onApproved={loadTechnicians} />}

      {/* ===== Tab Đã duyệt ===== */}
      {tab === "approved" && (
        <>
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
                  <TableCell>Kỹ thuật viên</TableCell>
                  <TableCell>Số điện thoại</TableCell>
                  <TableCell>Chuyên môn</TableCell>
                  <TableCell>Kỹ năng</TableCell>
                  <TableCell align="right">Bán kính</TableCell>
                  <TableCell>Đánh giá</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                )}

                {!loading && technicians.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Chưa có kỹ thuật viên nào
                    </TableCell>
                  </TableRow>
                )}

                {technicians.map((t) => (
                  <TableRow key={t._id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{t.fullName}</Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {t.email || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>{t.phone || "—"}</TableCell>

                    {/* profile = null: người tự đăng ký chưa được bổ sung hồ sơ */}
                    <TableCell>
                      {t.profile ? (
                        SPECIALTY_LABELS[t.profile.specialty]
                      ) : (
                        <Chip size="small" color="warning" label="Chưa có hồ sơ" />
                      )}
                    </TableCell>
                    <TableCell>
                      {t.profile?.skills?.length ? `${t.profile.skills.length} dịch vụ` : "—"}
                    </TableCell>
                    <TableCell align="right">{t.profile ? `${t.profile.radiusKm} km` : "—"}</TableCell>
                    <TableCell>
                      {t.profile?.ratingCount
                        ? `${t.profile.ratingAvg.toFixed(1)} ★ (${t.profile.ratingCount})`
                        : "Chưa có"}
                    </TableCell>

                    {/* Trạng thái: khóa / hoạt động, kèm nhắc chưa đổi mật khẩu tạm */}
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Chip
                          size="small"
                          label={t.isLocked ? "Đã khóa" : "Hoạt động"}
                          color={t.isLocked ? "error" : "success"}
                        />
                        {t.mustChangePassword && <Chip size="small" variant="outlined" label="Chưa đổi MK" />}
                      </Stack>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="Sửa">
                        <IconButton onClick={() => handleEdit(t)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.isLocked ? "Mở khóa" : "Khóa tài khoản"}>
                        <IconButton color={t.isLocked ? "success" : "error"} onClick={() => handleToggleLock(t)}>
                          {t.isLocked ? <LockOpenIcon /> : <LockIcon />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Chỉ gắn hộp thoại khi mở → mỗi lần mở form được khởi tạo lại */}
      {dialogOpen && (
        <TechnicianFormDialog technician={editing} onClose={() => setDialogOpen(false)} onSubmit={handleSave} />
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
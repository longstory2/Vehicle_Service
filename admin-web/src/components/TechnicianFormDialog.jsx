import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Autocomplete,
} from "@mui/material";
import serviceApi from "../api/serviceApi";

// Chuyên môn: khớp enum specialty trong server/src/models/Technician.js
const SPECIALTY_OPTIONS = [
  { value: "motorbike", label: "Xe máy" },
  { value: "car", label: "Ô tô" },
  { value: "both", label: "Cả xe máy và ô tô" },
];
const VEHICLE_LABELS = { motorbike: "Xe máy", car: "Ô tô" };

// Props:
//  - technician: null (thêm mới) hoặc object kỹ thuật viên từ GET /api/technicians (sửa)
//  - onClose: đóng hộp thoại
//  - onSubmit: hàm lưu do trang cha truyền vào, trả về Promise
export default function TechnicianFormDialog({ technician, onClose, onSubmit }) {
  const isEdit = Boolean(technician);

  // Khởi tạo form; khi sửa: lấy từ tài khoản + profile (profile có thể null nếu người tự đăng ký)
  const [form, setForm] = useState(
    isEdit
      ? {
          fullName: technician.fullName,
          phone: technician.phone || "",
          email: technician.email || "",
          password: "",
          specialty: technician.profile?.specialty || "",
          skills: technician.profile?.skills?.map((s) => s._id) || [], // chỉ giữ mảng id
          radiusKm: technician.profile?.radiusKm ?? 5,
        }
      : { fullName: "", phone: "", email: "", password: "", specialty: "", skills: [], radiusKm: 5 }
  );
  const [services, setServices] = useState([]); // danh sách dịch vụ để chọn kỹ năng
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Mở hộp thoại: tải danh sách dịch vụ đang hoạt động
  useEffect(() => {
    serviceApi
      .getAll()
      .then((res) => setServices(res.data.data))
      .catch(() => setError("Không tải được danh sách dịch vụ"));
  }, []);

  // Dùng chung cho các ô nhập thường (dựa vào thuộc tính name)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Chỉ cho chọn dịch vụ đúng loại xe của chuyên môn (chưa chọn chuyên môn → chưa có gì để chọn)
  const skillOptions = services.filter(
    (s) => form.specialty === "both" || s.vehicleType === form.specialty
  );

  // Đổi chuyên môn: bỏ các kỹ năng không còn hợp loại xe
  const handleSpecialtyChange = (e) => {
    const specialty = e.target.value;
    const allowedIds = services
      .filter((s) => specialty === "both" || s.vehicleType === specialty)
      .map((s) => s._id);
    setForm((prev) => ({
      ...prev,
      specialty,
      skills: prev.skills.filter((id) => allowedIds.includes(id)),
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const data = {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        specialty: form.specialty || undefined, // rỗng → không gửi, server báo "Vui lòng chọn chuyên môn"
        skills: form.skills,
        radiusKm: Number(form.radiusKm),
      };
      if (!isEdit) data.password = form.password; // mật khẩu tạm chỉ gửi khi thêm mới
      await onSubmit(data);
      // Lưu thành công: trang cha tự đóng hộp thoại
    } catch (err) {
      // Câu báo lỗi tiếng Việt từ server (SĐT không hợp lệ, đã được sử dụng...)
      setError(err.response?.data?.message || "Không lưu được kỹ thuật viên");
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Sửa kỹ thuật viên" : "Thêm kỹ thuật viên"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Người tự đăng ký vừa được duyệt chưa có hồ sơ nghề nghiệp */}
          {isEdit && !technician.profile && (
            <Alert severity="warning">
              Kỹ thuật viên này chưa có hồ sơ nghề nghiệp. Hãy chọn chuyên môn và kỹ năng để hệ thống
              có thể giao đơn.
            </Alert>
          )}

          <TextField label="Họ tên" name="fullName" value={form.fullName} onChange={handleChange} required />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Số điện thoại"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
          </Stack>

          {/* Mật khẩu tạm: chỉ khi thêm mới; kỹ thuật viên phải đổi ở lần đăng nhập đầu */}
          {!isEdit && (
            <TextField
              label="Mật khẩu tạm (ít nhất 6 ký tự)"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              helperText="Báo mật khẩu này cho kỹ thuật viên; họ sẽ phải đổi khi đăng nhập lần đầu"
            />
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Chuyên môn"
              value={form.specialty}
              onChange={handleSpecialtyChange}
              required
              fullWidth
            >
              {SPECIALTY_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Bán kính nhận việc (km)"
              name="radiusKm"
              type="number"
              value={form.radiusKm}
              onChange={handleChange}
              fullWidth
            />
          </Stack>

          {/* Autocomplete multiple: chọn nhiều dịch vụ, hiện thành các "chip" */}
          <Autocomplete
            multiple
            options={skillOptions}
            // value phải là object dịch vụ → đổi mảng id trong form thành object
            value={services.filter((s) => form.skills.includes(s._id))}
            onChange={(e, selected) => setForm((prev) => ({ ...prev, skills: selected.map((s) => s._id) }))}
            getOptionLabel={(s) => `${s.name} (${VEHICLE_LABELS[s.vehicleType]})`}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            disabled={!form.specialty}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Kỹ năng (dịch vụ làm được)"
                helperText={!form.specialty ? "Chọn chuyên môn trước" : ""}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
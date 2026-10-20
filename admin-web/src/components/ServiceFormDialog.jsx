import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Stack,
  Alert,
} from "@mui/material";

// Giá trị mặc định khi thêm mới
const emptyForm = {
  name: "",
  description: "",
  vehicleType: "motorbike",
  price: "",
  estimatedMinutes: 30,
  isActive: true,
};

// Props:
//  - service: null (thêm mới) hoặc object dịch vụ (sửa)
//  - onClose: đóng hộp thoại
//  - onSubmit: hàm lưu do trang cha truyền vào, trả về Promise
export default function ServiceFormDialog({ service, onClose, onSubmit }) {
  // Khởi tạo form: nếu đang sửa thì lấy dữ liệu của dịch vụ đó
  const [form, setForm] = useState(
    service
      ? {
          name: service.name,
          description: service.description,
          vehicleType: service.vehicleType,
          price: service.price,
          estimatedMinutes: service.estimatedMinutes,
          isActive: service.isActive,
        }
      : emptyForm
  );
  const [error, setError] = useState(""); // thông báo lỗi từ server
  const [saving, setSaving] = useState(false); // đang lưu → khóa nút

  // Dùng chung cho mọi ô nhập: dựa vào thuộc tính name của ô để biết sửa trường nào
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      // Ô số trả về chuỗi → đổi sang Number; để trống thì gửi undefined để server báo "Vui lòng nhập giá"
      await onSubmit({
        ...form,
        price: form.price === "" ? undefined : Number(form.price),
        estimatedMinutes: Number(form.estimatedMinutes),
      });
      // Lưu thành công: trang cha tự đóng hộp thoại
    } catch (err) {
      // Lấy câu báo lỗi tiếng Việt do errorHandler ở server trả về
      setError(err.response?.data?.message || "Không lưu được dịch vụ");
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{service ? "Sửa dịch vụ" : "Thêm dịch vụ"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Chỉ hiện khi có lỗi */}
          {error && <Alert severity="error">{error}</Alert>}

          <TextField label="Tên dịch vụ" name="name" value={form.name} onChange={handleChange} required />

          {/* TextField có select = ô chọn (dropdown) */}
          <TextField select label="Loại xe" name="vehicleType" value={form.vehicleType} onChange={handleChange}>
            <MenuItem value="motorbike">Xe máy</MenuItem>
            <MenuItem value="car">Ô tô</MenuItem>
          </TextField>

          {/* Hai ô số nằm cùng một hàng */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Giá (VNĐ)"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Thời gian dự kiến (phút)"
              name="estimatedMinutes"
              type="number"
              value={form.estimatedMinutes}
              onChange={handleChange}
              fullWidth
            />
          </Stack>

          <TextField
            label="Mô tả"
            name="description"
            value={form.description}
            onChange={handleChange}
            multiline
            rows={3}
          />

          {/* Công tắc bật/tắt: Switch trả về checked (true/false) chứ không phải value */}
          <FormControlLabel
            label="Đang hoạt động (hiển thị trên app khách hàng)"
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
            }
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
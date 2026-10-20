import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Box, Paper, Typography, TextField, Button, Alert } from "@mui/material";
import authApi from "../api/authApi";
import { saveAuth, isAdminLoggedIn } from "../utils/authStorage";

export default function Login() {
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Đã đăng nhập rồi thì vào thẳng trang chủ
  if (isAdminLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); // chặn trình duyệt tải lại trang khi submit form
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(account, password);
      const { token, user } = res.data.data; // server trả { success, data: { token, user } }

      // Admin Web chỉ dành cho quản trị viên
      if (user.role !== "admin") {
        setError("Tài khoản này không có quyền quản trị");
        setLoading(false);
        return;
      }

      saveAuth(token, user);
      navigate("/", { replace: true });
    } catch (err) {
      // Sai mật khẩu → câu báo từ server; server tắt → không có response
      setError(err.response?.data?.message || "Không kết nối được server");
      setLoading(false);
    }
  };

  return (
    // Nền xám, hộp đăng nhập nằm giữa màn hình
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f1f5f9" }}>
      <Paper sx={{ p: 4, width: 380 }} elevation={3}>
        <Typography variant="h5" sx={{ fontWeight: 600, textAlign: "center" }}>
          Admin Sửa Xe
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mb: 3 }}>
          Đăng nhập trang quản trị
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Dùng thẻ form để bấm Enter cũng đăng nhập được */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email hoặc số điện thoại"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            fullWidth
            required
            autoFocus
            sx={{ mb: 2 }}
          />
          <TextField
            label="Mật khẩu"
            type="password" // ẩn ký tự khi gõ
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
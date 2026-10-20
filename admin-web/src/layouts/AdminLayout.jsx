import { Outlet, useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import Sidebar from "../components/Sidebar";
import { getUser, clearAuth } from "../utils/authStorage";

// Khung chung cho mọi trang quản trị: Sidebar bên trái, bên phải gồm thanh trên + nội dung
export default function AdminLayout() {
  const navigate = useNavigate();
  const user = getUser(); // thông tin admin đã lưu lúc đăng nhập

  // Đăng xuất: xóa token rồi về trang đăng nhập
  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />

      <Box sx={{ flex: 1, bgcolor: "#f1f5f9", minHeight: "100vh" }}>
        {/* Thanh trên: tên người đăng nhập + nút đăng xuất, căn phải */}
        <Box
          component="header"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 2,
            px: 3,
            py: 1.5,
            bgcolor: "#fff",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <Typography>
            Xin chào, <b>{user?.fullName}</b>
          </Typography>
          <Button size="small" variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Đăng xuất
          </Button>
        </Box>

        {/* Outlet: nơi hiển thị trang con tương ứng với đường dẫn hiện tại */}
        <Box component="main" sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
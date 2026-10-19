import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";

// Khung chung cho mọi trang quản trị: Sidebar bên trái, nội dung bên phải
export default function AdminLayout() {
  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      {/* Outlet: nơi hiển thị trang con tương ứng với đường dẫn hiện tại */}
      <Box component="main" sx={{ flex: 1, p: 3, bgcolor: "#f1f5f9", minHeight: "100vh" }}>
        <Outlet />
      </Box>
    </Box>
  );
}
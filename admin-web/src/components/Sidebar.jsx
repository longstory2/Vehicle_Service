import { NavLink } from "react-router-dom";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import EngineeringIcon from "@mui/icons-material/Engineering";
import BuildIcon from "@mui/icons-material/Build";
import ReceiptIcon from "@mui/icons-material/Receipt";

// Danh sách menu: muốn thêm/bớt mục chỉ cần sửa mảng này
const menuItems = [
  { text: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { text: "Khách hàng", path: "/customers", icon: <PeopleIcon /> },
  { text: "Kỹ thuật viên", path: "/technicians", icon: <EngineeringIcon /> },
  { text: "Dịch vụ", path: "/services", icon: <BuildIcon /> },
  { text: "Đơn hàng", path: "/orders", icon: <ReceiptIcon /> },
];

export default function Sidebar() {
  return (
    <Box sx={{ width: 240, minHeight: "100vh", bgcolor: "#1e293b", color: "#fff", flexShrink: 0 }}>
      {/* Tên hệ thống ở đầu thanh menu */}
      <Typography variant="h6" sx={{ p: 2, fontWeight: "bold" }}>
        Admin Sửa Xe
      </Typography>

      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink} // dùng NavLink để chuyển trang không tải lại
            to={item.path}
            end={item.path === "/"} // "/" chỉ được tô sáng khi đúng trang chủ
            sx={{
              color: "#cbd5e1",
              // NavLink tự gắn class "active" cho mục đang chọn → tô sáng
              "&.active": { bgcolor: "#334155", color: "#fff" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
import { Navigate, Outlet } from "react-router-dom";
import { isAdminLoggedIn } from "../utils/authStorage";

// "Người gác cổng" cho các trang quản trị:
// - đã đăng nhập bằng admin → hiển thị trang con (Outlet)
// - chưa → chuyển về /login (replace: không lưu vào lịch sử, bấm Back không quay lại được)
export default function ProtectedRoute() {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
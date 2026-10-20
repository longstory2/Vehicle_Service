import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Technicians from "./pages/Technicians";
import Services from "./pages/Services";
import Orders from "./pages/Orders";
import Login from "./pages/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang đăng nhập: ai cũng vào được, không có Sidebar */}
        <Route path="/login" element={<Login />} />

        {/* Các trang quản trị: phải qua ProtectedRoute (đã đăng nhập admin) mới vào được */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/technicians" element={<Technicians />} />
            <Route path="/services" element={<Services />} />
            <Route path="/orders" element={<Orders />} />
          </Route>
        </Route>

        {/* Gõ đường dẫn không tồn tại → về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
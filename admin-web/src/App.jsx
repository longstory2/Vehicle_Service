import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
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
        {/* Trang đăng nhập: không có Sidebar */}
        <Route path="/login" element={<Login />} />

        {/* Các trang quản trị: dùng chung AdminLayout (có Sidebar) */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/technicians" element={<Technicians />} />
          <Route path="/services" element={<Services />} />
          <Route path="/orders" element={<Orders />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
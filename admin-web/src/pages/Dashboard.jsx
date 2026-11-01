import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TodayIcon from "@mui/icons-material/Today";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import PaymentsIcon from "@mui/icons-material/Payments";
import EngineeringIcon from "@mui/icons-material/Engineering";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import PeopleIcon from "@mui/icons-material/People";
import StarIcon from "@mui/icons-material/Star";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import adminApi from "../api/adminApi";
import StatCard from "../components/StatCard";
import { ORDER_STATUS, formatPrice } from "../utils/orderFormat";

// Màu cho từng trạng thái trong biểu đồ tròn (Recharts cần mã màu cụ thể)
const STATUS_COLORS = {
  PENDING: "#f59e0b",
  ACCEPTED: "#0ea5e9",
  ARRIVED: "#06b6d4",
  INSPECTING: "#6366f1",
  AWAITING_PARTS_APPROVAL: "#a855f7",
  REPAIRING: "#3b82f6",
  COMPLETED: "#22c55e",
  CANCELLED: "#94a3b8",
};

// "2026-11-01" → "01/11" để nhãn trục ngang gọn
const formatDayLabel = (dateKey) => {
  const [, month, day] = dateKey.split("-");
  return `${day}/${month}`;
};

// Rút gọn tiền trên trục dọc: 1500000 → "1.5tr", 250000 → "250k"
const formatShortMoney = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value;
};

// Khung trắng có tiêu đề cho mỗi biểu đồ
function ChartCard({ title, children }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [days, setDays] = useState(7); // khoảng thống kê: 7 hoặc 30 ngày
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  // Tải số liệu từ GET /api/admin/stats
  const loadStats = useCallback(async () => {
    try {
      const res = await adminApi.getStats({ days });
      setStats(res.data.data);
      setError("");
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
      setError(err.response?.data?.message || "Không tải được số liệu. Kiểm tra server (cổng 5000) đã chạy chưa.");
    }
  }, [days]);

  // Tải khi mở trang / đổi khoảng ngày, và tự làm mới mỗi 60 giây (tiện khi demo)
  useEffect(() => {
    loadStats();
    const timer = setInterval(loadStats, 60_000);
    return () => clearInterval(timer); // rời trang → dừng hẹn giờ
  }, [loadStats]);

  // Lần đầu chưa có số liệu
  if (!stats) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Dashboard
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}
      </Box>
    );
  }

  const { totals, byStatus, daily, topServices } = stats;

  // Dữ liệu biểu đồ cột + đường: thêm nhãn ngày ngắn
  const dailyData = daily.map((d) => ({ ...d, label: formatDayLabel(d.date) }));

  // Dữ liệu biểu đồ tròn: chỉ lấy trạng thái có ít nhất 1 đơn
  const statusData = Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      name: ORDER_STATUS[status]?.label || status,
      value: count,
    }));

  // Để vẽ thanh tỉ lệ cho top dịch vụ (dịch vụ nhiều nhất = 100%)
  const maxServiceCount = Math.max(...topServices.map((s) => s.count), 1);

  return (
    <Box>
      {/* Tiêu đề + chọn khoảng ngày */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive // chỉ chọn 1 nút
          value={days}
          onChange={(e, value) => value && setDays(value)} // bấm lại nút đang chọn → value null → bỏ qua
          sx={{ bgcolor: "white" }}
        >
          <ToggleButton value={7}>7 ngày</ToggleButton>
          <ToggleButton value={30}>30 ngày</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Lỗi khi tự làm mới (vẫn giữ số liệu cũ trên màn hình) */}
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Lưới thẻ số liệu: tự xuống dòng, mỗi thẻ rộng tối thiểu 230px */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 2, mb: 2 }}>
        <StatCard
          title="Tổng đơn hàng"
          value={totals.orders}
          icon={<ReceiptLongIcon />}
          color="#3b82f6"
          subtitle={`${totals.completedOrders} hoàn thành · ${totals.cancelledOrders} đã hủy`}
          onClick={() => navigate("/orders")}
        />
        <StatCard title="Đơn hôm nay" value={totals.todayOrders} icon={<TodayIcon />} color="#0ea5e9" />
        <StatCard
          title="Đang xử lý"
          value={totals.activeOrders}
          icon={<AutorenewIcon />}
          color="#6366f1"
          subtitle={`${totals.pendingOrders} đơn đang chờ nhận`}
          onClick={() => navigate("/orders")}
        />
        <StatCard
          title="Doanh thu"
          value={formatPrice(totals.revenue)}
          icon={<PaymentsIcon />}
          color="#22c55e"
          subtitle="Tổng tiền các đơn hoàn thành"
        />
        <StatCard
          title="Kỹ thuật viên"
          value={totals.technicians}
          icon={<EngineeringIcon />}
          color="#f97316"
          subtitle={`${totals.onlineTechnicians} đang bật nhận đơn`}
          onClick={() => navigate("/technicians")}
        />
        <StatCard
          title="Hồ sơ chờ duyệt"
          value={totals.pendingTechnicians}
          icon={<HourglassTopIcon />}
          color={totals.pendingTechnicians > 0 ? "#ef4444" : "#94a3b8"} // có hồ sơ chờ → đỏ cho dễ thấy
          subtitle="Kỹ thuật viên tự đăng ký"
          onClick={() => navigate("/technicians")}
        />
        <StatCard
          title="Khách hàng"
          value={totals.customers}
          icon={<PeopleIcon />}
          color="#14b8a6"
          onClick={() => navigate("/customers")}
        />
        <StatCard
          title="Đánh giá trung bình"
          value={totals.avgRating ? `${totals.avgRating} ★` : "Chưa có"}
          icon={<StarIcon />}
          color="#eab308"
          subtitle={`${totals.ratingCount} lượt khách đánh giá`}
        />
      </Box>

      {/* Biểu đồ kết hợp: cột = số đơn (trục trái), đường = doanh thu (trục phải) */}
      <ChartCard title={`Đơn hàng và doanh thu ${days} ngày gần nhất`}>
        {/* ResponsiveContainer cần khung cha có chiều cao cố định */}
        <Box sx={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis yAxisId="left" allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={formatShortMoney} />
              <Tooltip
                // Doanh thu hiện dạng tiền, số đơn giữ nguyên
                formatter={(value, name) => (name === "Doanh thu" ? formatPrice(value) : value)}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="orders" name="Số đơn" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" dataKey="revenue" name="Doanh thu" stroke="#22c55e" strokeWidth={2} dot />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </ChartCard>

      {/* Hàng dưới: 2 khung chia đôi */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mt: 2 }}>
        <ChartCard title="Tỉ lệ trạng thái đơn hàng">
          {statusData.length === 0 ? (
            <Typography sx={{ color: "text.secondary" }}>Chưa có đơn hàng</Typography>
          ) : (
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* innerRadius > 0 → biểu đồ dạng vành khuyên */}
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                    {statusData.map((item) => (
                      <Cell key={item.status} fill={STATUS_COLORS[item.status] || "#cbd5e1"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} đơn`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </ChartCard>

        <ChartCard title="Top 5 dịch vụ được đặt nhiều nhất">
          {topServices.length === 0 ? (
            <Typography sx={{ color: "text.secondary" }}>Chưa có dữ liệu</Typography>
          ) : (
            topServices.map((service, index) => (
              <Box key={service.name} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography>
                    {index + 1}. {service.name}
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{service.count} đơn</Typography>
                </Box>
                {/* Thanh dài theo tỉ lệ so với dịch vụ nhiều nhất */}
                <LinearProgress
                  variant="determinate"
                  value={(service.count / maxServiceCount) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            ))
          )}
        </ChartCard>
      </Box>
    </Box>
  );
}
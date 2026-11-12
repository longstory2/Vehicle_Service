import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  FormControlLabel,
  Switch,
  Chip,
  CircularProgress,
} from "@mui/material";
import adminApi from "../api/adminApi";

// 0.844 → "0,844" (dấu phẩy thập phân kiểu Việt Nam)
const formatNumber = (value, digits = 2) => value.toFixed(digits).replace(".", ",");

// Số nhỏ màu xám bên dưới mỗi ô: điểm thành phần S (0 → 1)
function SubScore({ value }) {
  return (
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      S = {formatNumber(value)}
    </Typography>
  );
}

// Bảng xếp hạng kỹ thuật viên của một đơn theo thuật toán SAW (GET /api/admin/orders/:id/candidates)
// Props: orderId
export default function CandidateRanking({ orderId }) {
  const [showAll, setShowAll] = useState(true); // true = gồm cả người đang offline
  const [result, setResult] = useState(null); // { radiusKm, weights, candidates }
  const [error, setError] = useState("");

  // Tải lại mỗi khi đổi đơn hoặc bật/tắt công tắc
  useEffect(() => {
    let ignore = false; // bỏ kết quả cũ nếu người dùng bấm công tắc liên tục
    adminApi
      .getCandidates(orderId, { all: showAll || undefined })
      .then((res) => {
        if (!ignore) {
          setResult(res.data.data);
          setError("");
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.response?.data?.message || "Không tải được bảng xếp hạng");
      });
    return () => {
      ignore = true;
    };
  }, [orderId, showAll]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!result) return <CircularProgress size={24} />;

  const { weights, radiusKm, candidates } = result;

  return (
    <Box>
      {/* Công thức đang dùng + công tắc */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Score = {formatNumber(weights.distance, 1)}·khoảng cách + {formatNumber(weights.rating, 1)}·đánh giá +{" "}
          {formatNumber(weights.skill, 1)}·kỹ năng + {formatNumber(weights.load, 1)}·khối lượng · bán kính tìm{" "}
          {formatNumber(radiusKm, 1)} km · tính theo thời điểm hiện tại
        </Typography>
        <FormControlLabel
          label="Gồm cả người đang offline"
          control={<Switch size="small" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />}
          sx={{ flexShrink: 0 }}
        />
      </Box>

      {candidates.length === 0 ? (
        <Alert severity="info">
          {showAll
            ? "Không có kỹ thuật viên phù hợp trong bán kính 10 km."
            : "Hiện chưa có kỹ thuật viên phù hợp đang trực (hoặc tất cả đã được gửi đơn này)."}
        </Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Kỹ thuật viên</TableCell>
              <TableCell>Khoảng cách</TableCell>
              <TableCell>Đánh giá</TableCell>
              <TableCell>Kỹ năng</TableCell>
              <TableCell>Đơn hôm nay</TableCell>
              <TableCell align="right">Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates.map((c, index) => (
              // Hạng 1 = người sẽ được gửi đơn trước → tô nền cam nhạt
              <TableRow key={c.technicianId} sx={{ bgcolor: index === 0 ? "#fff4e5" : "inherit" }}>
                <TableCell sx={{ fontWeight: 700 }}>{index + 1}</TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 500 }}>{c.fullName}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {c.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  {formatNumber(c.distanceKm)} km
                  <SubScore value={c.scores.distance} />
                </TableCell>
                <TableCell>
                  {c.ratingAvg ? `${formatNumber(c.ratingAvg, 1)} ★ (${c.ratingCount})` : "Chưa có"}
                  <SubScore value={c.scores.rating} />
                </TableCell>
                <TableCell>
                  {/* Có chữ, không chỉ dựa vào màu */}
                  <Chip size="small" label={c.scores.skill === 1 ? "Có" : "Không"} color={c.scores.skill === 1 ? "success" : "default"} />
                </TableCell>
                <TableCell>
                  {c.ordersToday}
                  <SubScore value={c.scores.load} />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatNumber(c.score, 3)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
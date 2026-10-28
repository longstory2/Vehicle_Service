import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import technicianApi from "../api/technicianApi";

// Tab "Chờ duyệt": hồ sơ ứng viên tự đăng ký trên app mobile (POST /api/auth/register-technician)
// Props:
//  - onApproved: gọi sau khi duyệt thành công để trang cha tải lại danh sách "Đã duyệt"
export default function PendingTechnicians({ onApproved }) {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(""); // id đang duyệt → khóa các nút khác
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Tải danh sách hồ sơ chờ duyệt
  const loadPendingTechnicians = useCallback(async () => {
    try {
      const response = await technicianApi.getPending();
      setTechnicians(response.data.data);
      setLoadError("");
    } catch (error) {
      setLoadError(error.response?.data?.message || "Không tải được hồ sơ kỹ thuật viên.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingTechnicians();
  }, [loadPendingTechnicians]);

  // Duyệt 1 hồ sơ: thành công thì bỏ khỏi danh sách chờ
  const handleApprove = async (technician) => {
    setApprovingId(technician._id);
    setActionError("");
    setSuccessMessage("");
    try {
      await technicianApi.approve(technician._id);
      setTechnicians((current) => current.filter((item) => item._id !== technician._id));
      setSuccessMessage(
        `Đã phê duyệt hồ sơ của ${technician.fullName}. Vào tab "Đã duyệt" để bổ sung chuyên môn, kỹ năng.`
      );
      onApproved?.(); // báo trang cha tải lại tab Đã duyệt
    } catch (error) {
      setActionError(error.response?.data?.message || "Không thể phê duyệt hồ sơ.");
    } finally {
      setApprovingId("");
    }
  };

  return (
    <Box>
      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : technicians.length === 0 ? (
        <Alert severity="info">Hiện không có hồ sơ kỹ thuật viên nào đang chờ duyệt.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell>Họ tên</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Số điện thoại</TableCell>
                <TableCell>Ngày đăng ký</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {technicians.map((technician) => (
                <TableRow key={technician._id}>
                  <TableCell>{technician.fullName}</TableCell>
                  <TableCell>{technician.email}</TableCell>
                  <TableCell>{technician.phone}</TableCell>
                  <TableCell>
                    {technician.createdAt
                      ? new Date(technician.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => handleApprove(technician)}
                      disabled={approvingId !== "" || Boolean(loadError)}
                    >
                      {approvingId === technician._id ? "Đang duyệt..." : "Phê duyệt"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
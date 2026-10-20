import express from "express";
import cors from "cors";
import serviceRoutes from "./routes/serviceRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Cho phép Admin Web (chạy ở cổng khác) gọi API
app.use(cors());

// Đọc dữ liệu JSON từ body của request
app.use(express.json());

// Route kiểm tra server còn sống hay không
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server đang chạy" });
});

// ===== Các route nghiệp vụ =====
app.use("/api/services", serviceRoutes);

// ===== Xử lý lỗi (luôn đặt CUỐI CÙNG, sau mọi route) =====
app.use(notFound); //     không khớp route nào → 404
app.use(errorHandler); // mọi lỗi khác → trả thông báo tiếng Việt

export default app;
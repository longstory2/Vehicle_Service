import express from "express";
import cors from "cors";

const app = express();

// Cho phép Admin Web (chạy ở cổng khác) gọi API
app.use(cors());

// Đọc dữ liệu JSON từ body của request
app.use(express.json());

// Route kiểm tra server còn sống hay không
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server đang chạy" });
});

export default app;
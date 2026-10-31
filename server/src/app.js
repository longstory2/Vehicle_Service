import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import technicianRoutes from "./routes/technicianRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Cho phép Admin Web (chạy ở cổng khác) gọi API
app.use(cors());

// Đọc dữ liệu JSON từ body của request
app.use(express.json());

// In ra mỗi request sau khi xử lý xong, ví dụ: "POST /api/auth/login → 200"
// Giúp kiểm tra app mobile / Admin Web có gọi tới được server hay không
app.use((req, res, next) => {
  res.on("finish", () => console.log(`${req.method} ${req.originalUrl} → ${res.statusCode}`));
  next();
});

// Route kiểm tra server còn sống hay không
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server đang chạy" });
});

// ===== Các route nghiệp vụ =====
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// ===== Xử lý lỗi (luôn đặt CUỐI CÙNG, sau mọi route) =====
app.use(notFound);
app.use(errorHandler);

export default app;
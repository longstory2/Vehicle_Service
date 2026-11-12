import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startDispatcher } from "./services/dispatcher.js";

// Nạp biến môi trường từ file .env (phải chạy trước khi dùng process.env)
dotenv.config();

const PORT = process.env.PORT || 5000;

// Kết nối database xong mới mở server và bật bộ ghép cặp
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
  });
  startDispatcher();
});
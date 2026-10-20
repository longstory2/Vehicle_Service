import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Service from "./models/Service.js";

dotenv.config(); // đọc file .env

// Danh sách dịch vụ mẫu
const sampleServices = [
  // Dịch vụ kiểm tra mặc định: tự gắn khi khách chỉ mô tả sự cố (mục 4.3.3 đề cương), không xóa được
  { name: "Kiểm tra, chẩn đoán tại chỗ", vehicleType: "motorbike", price: 50000, estimatedMinutes: 20, isDefaultInspection: true },
  { name: "Kiểm tra, chẩn đoán tại chỗ", vehicleType: "car", price: 150000, estimatedMinutes: 30, isDefaultInspection: true },

  // Xe máy
  { name: "Thay nhớt", vehicleType: "motorbike", price: 120000, estimatedMinutes: 20, description: "Thay nhớt động cơ" },
  { name: "Vá lốp", vehicleType: "motorbike", price: 50000, estimatedMinutes: 15 },
  { name: "Thay bugi", vehicleType: "motorbike", price: 80000, estimatedMinutes: 15 },
  { name: "Kích bình ắc quy", vehicleType: "motorbike", price: 70000, estimatedMinutes: 15 },

  // Ô tô
  { name: "Thay ắc quy", vehicleType: "car", price: 1500000, estimatedMinutes: 30 },
  { name: "Thay dầu máy", vehicleType: "car", price: 600000, estimatedMinutes: 40 },
  { name: "Thay lốp dự phòng", vehicleType: "car", price: 200000, estimatedMinutes: 30 },
  { name: "Kích bình ắc quy", vehicleType: "car", price: 250000, estimatedMinutes: 20 },
];

const seed = async () => {
  await connectDB();

  // 1. Tạo admin nếu chưa có
  const email = process.env.ADMIN_EMAIL;
  const existed = await User.findOne({ email });
  if (existed) {
    console.log(`Admin ${email} đã tồn tại, bỏ qua`);
  } else {
    const admin = new User({ fullName: "Quản trị viên", email, role: "admin" });
    await admin.setPassword(process.env.ADMIN_PASSWORD); // mã hóa mật khẩu
    await admin.save();
    console.log(`Đã tạo admin: ${email}`);
  }

  // 2. Thêm dịch vụ mẫu: chỉ thêm cái chưa có (tìm theo tên + loại xe)
  // $setOnInsert: chỉ gán dữ liệu khi THÊM MỚI, dịch vụ đã có thì giữ nguyên
  for (const { name, vehicleType, ...rest } of sampleServices) {
    await Service.updateOne({ name, vehicleType }, { $setOnInsert: rest }, { upsert: true });
  }
  console.log(`Đã kiểm tra ${sampleServices.length} dịch vụ mẫu`);

  await mongoose.disconnect(); // đóng kết nối để lệnh kết thúc
};

seed().catch((err) => {
  console.error("Seed lỗi:", err);
  process.exit(1);
});
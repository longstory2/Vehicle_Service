import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Service from "./models/Service.js";
import Technician from "./models/Technician.js";
import Order from "./models/order.js";

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

// Tài khoản mẫu để thử app mobile
const sampleUsers = [
  { fullName: "Kỹ thuật viên Mẫu", email: "ktv@vehicle.vn", phone: "0901111111", role: "technician", password: "Ktv@123" },
  { fullName: "Khách hàng Mẫu", email: "khach@vehicle.vn", phone: "0902222222", role: "customer", password: "Khach@123" },
];

// MỌI câu truy vấn database phải nằm TRONG hàm này, sau dòng await connectDB()
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

  // 2. Tạo tài khoản mẫu (chỉ tạo khi chưa có)
  for (const { password, ...info } of sampleUsers) {
    if (await User.findOne({ email: info.email })) {
      console.log(`Tài khoản ${info.email} đã tồn tại, bỏ qua`);
      continue;
    }
    const user = new User(info);
    await user.setPassword(password);
    await user.save();
    console.log(`Đã tạo ${info.role}: ${info.email} / ${password}`);
  }

  // 3. Thêm dịch vụ mẫu: chỉ thêm cái chưa có (tìm theo tên + loại xe)
  // $setOnInsert: chỉ gán dữ liệu khi THÊM MỚI, dịch vụ đã có thì giữ nguyên
  for (const { name, vehicleType, ...rest } of sampleServices) {
    await Service.updateOne({ name, vehicleType }, { $setOnInsert: rest }, { upsert: true });
  }
  console.log(`Đã kiểm tra ${sampleServices.length} dịch vụ mẫu`);

  // 4. Hồ sơ nghề nghiệp cho kỹ thuật viên mẫu (nếu chưa có)
  const sampleTech = await User.findOne({ email: "ktv@vehicle.vn" });
  if (sampleTech && !(await Technician.findOne({ userId: sampleTech._id }))) {
    // Gán sẵn các dịch vụ xe máy làm kỹ năng
    const motorbikeServices = await Service.find({ vehicleType: "motorbike" }).select("_id");
    await Technician.create({
      userId: sampleTech._id,
      specialty: "motorbike",
      skills: motorbikeServices.map((s) => s._id),
    });
    console.log("Đã tạo hồ sơ cho kỹ thuật viên mẫu");
  }

  // 5. Đơn hàng mẫu trong 7 ngày gần nhất để Dashboard có dữ liệu
  // CHỈ tạo khi chưa có đơn nào → không đụng tới đơn thật do app tạo
  if ((await Order.countDocuments()) === 0) {
    const customer = await User.findOne({ email: "khach@vehicle.vn" });
    const services = await Service.find({ isDefaultInspection: false });
    // Tỉ lệ trạng thái: phần lớn hoàn thành, một ít hủy / đang xử lý / chờ nhận
    const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED", "REPAIRING", "ACCEPTED", "PENDING"];
    const DAY = 24 * 60 * 60 * 1000;

    const orders = [];
    for (let i = 0; i < 20; i++) {
      const service = services[i % services.length];
      const status = statuses[i % statuses.length];
      // Ngày tạo ngẫu nhiên trong 7 ngày qua
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7) * DAY - Math.floor(Math.random() * 10) * 60 * 60 * 1000);
      // Chỉ đơn hoàn thành mới có đánh giá (ngẫu nhiên 4 hoặc 5 sao)
      const score = status === "COMPLETED" ? 4 + (i % 2) : null;

      orders.push({
        customerId: customer._id,
        technicianId: status === "PENDING" ? null : sampleTech._id,
        serviceDetails: {
          serviceName: service.name,
          vehicleType: service.vehicleType === "car" ? "Ô tô" : "Xe máy",
          description: "Đơn mẫu tạo bởi seed",
        },
        address: "Quận 1, TP.HCM (đơn mẫu)",
        location: { latitude: 10.776889 + Math.random() * 0.03, longitude: 106.700981 + Math.random() * 0.03 },
        estimatedPrice: service.price,
        totalPrice: service.price,
        paymentMethod: "cash",
        status,
        acceptedAt: status === "PENDING" ? null : createdAt,
        completedAt: status === "COMPLETED" ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null,
        customerRating: { score, comment: score ? "Thợ đến nhanh, làm cẩn thận" : "" },
        createdAt,
        updatedAt: createdAt,
      });
    }
    // timestamps: false → giữ nguyên createdAt ngẫu nhiên ở trên (không bị đè bằng giờ hiện tại)
    await Order.insertMany(orders, { timestamps: false });
    console.log(`Đã tạo ${orders.length} đơn hàng mẫu`);
  } else {
    console.log("Đã có đơn hàng, bỏ qua tạo đơn mẫu");
  }

  await mongoose.disconnect(); // đóng kết nối để lệnh kết thúc
};

seed().catch((err) => {
  console.error("Seed lỗi:", err);
  process.exit(1);
});
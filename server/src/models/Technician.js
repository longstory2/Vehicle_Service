import mongoose from "mongoose";

// Collection technicians: hồ sơ nghề nghiệp của kỹ thuật viên
// (thông tin đăng nhập: họ tên, SĐT, mật khẩu... nằm ở collection users, nối qua userId)
const technicianSchema = new mongoose.Schema(
  {
    // Mỗi tài khoản kỹ thuật viên có đúng 1 hồ sơ → unique
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Chuyên môn: sửa xe máy, ô tô, hoặc cả hai (dùng để lọc khi ghép cặp)
    specialty: {
      type: String,
      enum: { values: ["motorbike", "car", "both"], message: "Chuyên môn không hợp lệ" },
      required: [true, "Vui lòng chọn chuyên môn"],
    },

    // Các dịch vụ kỹ thuật viên làm được (tham chiếu collection services)
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],

    // Bán kính nhận việc (km) tính từ vị trí hiện tại
    radiusKm: {
      type: Number,
      default: 5,
      min: [1, "Bán kính tối thiểu là 1 km"],
      max: [50, "Bán kính tối đa là 50 km"],
    },

    // Đang bật nhận đơn hay không (kỹ thuật viên bật/tắt trên app)
    isOnline: { type: Boolean, default: false },

    // Vị trí hiện tại theo chuẩn GeoJSON: coordinates = [kinh độ, vĩ độ] (chú ý: kinh độ đứng TRƯỚC)
    currentLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [106.700981, 10.776889] }, // mặc định trung tâm TP.HCM
    },

    // Điểm đánh giá trung bình và số lượt đánh giá (cập nhật khi khách đánh giá ở Giai đoạn 6)
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Chỉ mục không gian: cho phép tìm kỹ thuật viên trong bán kính quanh khách (dùng ở Giai đoạn 6)
technicianSchema.index({ currentLocation: "2dsphere" });

const Technician = mongoose.model("Technician", technicianSchema);
export default Technician;
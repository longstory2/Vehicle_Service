import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Collection users: tài khoản đăng nhập chung cho cả 3 vai trò (khớp ERD đề cương)
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, "Vui lòng nhập họ tên"], trim: true },

    // Số điện thoại và email không bắt buộc riêng lẻ, nhưng phải có ít nhất một (kiểm tra ở hook bên dưới)
    // sparse: true → cho phép nhiều người cùng để trống mà không bị báo trùng
    phone: { type: String, trim: true, unique: true, sparse: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },

    // Mật khẩu đã mã hóa; select: false → mặc định KHÔNG lấy ra khi truy vấn, tránh lộ về client
    passwordHash: { type: String, required: true, select: false },

    // Vai trò: khách hàng, kỹ thuật viên, quản trị viên
    role: {
      type: String,
      enum: ["customer", "technician", "admin"],
      default: "customer",
    },
    technicianApprovalStatus: {
      type: String,
      enum: ["pending", "approved"],
      default: "approved",
    },

    // Admin khóa tài khoản vi phạm
    isLocked: { type: Boolean, default: false },

    // Kỹ thuật viên do admin cấp tài khoản phải đổi mật khẩu ở lần đăng nhập đầu
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Chạy trước khi kiểm tra dữ liệu: bắt buộc có số điện thoại hoặc email
// (Mongoose 9: không dùng next(), hàm chạy xong là tự đi tiếp)
userSchema.pre("validate", function () {
  if (!this.phone && !this.email) {
    this.invalidate("phone", "Cần nhập số điện thoại hoặc email");
  }
});

// Đặt mật khẩu: mã hóa bằng bcrypt rồi gán vào passwordHash
userSchema.methods.setPassword = async function (plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 10); // 10 = độ khó khi mã hóa
};

// So khớp mật khẩu người dùng nhập với bản mã hóa trong database
userSchema.methods.matchPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema);
export default User;
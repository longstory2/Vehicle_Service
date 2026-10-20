import jwt from "jsonwebtoken";
import User from "../models/User.js";

// protect: chỉ cho đi tiếp khi request có token hợp lệ
export const protect = async (req, res, next) => {
  // Header có dạng: "Bearer eyJhbGciOi..."
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Bạn chưa đăng nhập" });
  }
  const token = header.split(" ")[1];

  // Giải mã token; sai chữ ký hoặc hết hạn thì jwt.verify báo lỗi
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại" });
  }

  // Lấy người dùng từ database (phòng trường hợp tài khoản đã bị xóa/khóa sau khi cấp token)
  const user = await User.findById(decoded.id);
  if (!user || user.isLocked) {
    return res.status(401).json({ success: false, message: "Tài khoản không tồn tại hoặc đã bị khóa" });
  }

  // Gắn người dùng vào req để controller phía sau dùng
  req.user = user;
  next();
};

// authorize: chỉ cho các vai trò được liệt kê đi tiếp. Dùng SAU protect
// Ví dụ: authorize("admin") hoặc authorize("admin", "technician")
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền thực hiện thao tác này" });
    }
    next();
  };
};
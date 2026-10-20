import jwt from "jsonwebtoken";

// Tạo token chứa id và vai trò của người dùng, ký bằng JWT_SECRET
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, // dữ liệu gói trong token (không đưa mật khẩu vào đây)
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export default generateToken;
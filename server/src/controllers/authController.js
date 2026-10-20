import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// Chỉ trả về các trường an toàn của người dùng (không có passwordHash)
const toPublicUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
});

// POST /api/auth/login
// Body: { "account": "email hoặc số điện thoại", "password": "..." }
export const login = async (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập tài khoản và mật khẩu" });
  }

  // Tìm theo email hoặc số điện thoại; "+passwordHash" để lấy cả trường đang bị ẩn (select: false)
  const user = await User.findOne({
    $or: [{ email: String(account).toLowerCase() }, { phone: account }],
  }).select("+passwordHash");

  // Không nói rõ sai tài khoản hay sai mật khẩu → kẻ xấu khó dò tài khoản
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
  }

  if (user.isLocked) {
    return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa" });
  }

  res.json({
    success: true,
    message: "Đăng nhập thành công",
    data: { token: generateToken(user), user: toPublicUser(user) },
  });
};

// GET /api/auth/me - Lấy thông tin người đang đăng nhập (cần token)
export const getMe = async (req, res) => {
  // req.user do middleware protect gắn vào
  res.json({ success: true, data: toPublicUser(req.user) });
};
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { normalizePhone } from "../utils/phone.js";

// Chỉ trả về các trường an toàn của người dùng (không có passwordHash)
const toPublicUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
});

// POST /api/auth/register - Khách hàng tự đăng ký tài khoản trên app mobile
// Body: { "fullName": "...", "phone": "0901234567", "email": "...", "password": "..." }
// Kỹ thuật viên KHÔNG tự đăng ký: do admin tạo tài khoản (Giai đoạn 5)
export const register = async (req, res) => {
  const { fullName, phone, email, password } = req.body;

  if (!fullName || !String(fullName).trim()) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập họ tên" });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });
  }

  // Số điện thoại không bắt buộc, nhưng nếu nhập thì phải đúng định dạng
  const normalizedPhone = normalizePhone(phone);
  if (phone && !normalizedPhone) {
    return res.status(400).json({ success: false, message: "Số điện thoại không hợp lệ" });
  }

  // role luôn là customer, không lấy từ body (tránh người dùng tự gửi role "admin")
  const user = new User({
    fullName,
    phone: normalizedPhone || undefined,
    email: email ? String(email).toLowerCase() : undefined,
    role: "customer",
  });
  await user.setPassword(password); // mã hóa mật khẩu
  await user.save(); // trùng email/số điện thoại → errorHandler trả "đã được sử dụng"

  res.status(201).json({
    success: true,
    message: "Đăng ký thành công",
    data: { token: generateToken(user), user: toPublicUser(user) },
  });
};

// POST /api/auth/login
// Body: { "account": "email hoặc số điện thoại", "password": "..." }
export const login = async (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập tài khoản và mật khẩu" });
  }

  // Nếu người dùng nhập số điện thoại (0901..., +84901...) thì chuẩn hóa về cùng dạng đã lưu
  const phone = normalizePhone(account) || account;

  // Tìm theo email hoặc số điện thoại; "+passwordHash" để lấy cả trường đang bị ẩn (select: false)
  const user = await User.findOne({
    $or: [{ email: String(account).toLowerCase() }, { phone }],
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

// PUT /api/auth/me - Người dùng tự sửa họ tên, số điện thoại (cần token)
// Body: { "fullName": "...", "phone": "..." } - gửi trường nào thì sửa trường đó
export const updateMe = async (req, res) => {
  const { fullName, phone } = req.body;
  const user = req.user;

  if (fullName !== undefined) {
    if (!String(fullName).trim()) {
      return res.status(400).json({ success: false, message: "Họ tên không được để trống" });
    }
    user.fullName = fullName;
  }

  if (phone !== undefined) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: "Số điện thoại không hợp lệ" });
    }
    user.phone = normalizedPhone;
  }

  await user.save(); // save() chạy lại kiểm tra dữ liệu và ràng buộc trùng
  res.json({ success: true, message: "Đã cập nhật thông tin", data: toPublicUser(user) });
};

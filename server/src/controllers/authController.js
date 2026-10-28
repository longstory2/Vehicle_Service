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
  technicianApprovalStatus: user.technicianApprovalStatus,
  mustChangePassword: user.mustChangePassword,
});

// POST /api/auth/register - Khách hàng tự đăng ký tài khoản trên app mobile
// Body: { "fullName": "...", "phone": "0901234567", "email": "...", "password": "..." }
// Hồ sơ kỹ thuật viên dùng endpoint riêng để bắt buộc chờ admin phê duyệt
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

// POST /api/auth/register-technician - Ứng viên gửi hồ sơ để admin duyệt
export const registerTechnician = async (req, res) => {
  const { fullName, phone, email, password } = req.body;
  const normalizedEmail = email ? String(email).trim().toLowerCase() : "";
  const normalizedPhone = normalizePhone(phone);

  if (!fullName || !String(fullName).trim()) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập họ tên" });
  }
  if (!normalizedPhone) {
    return res.status(400).json({ success: false, message: "Số điện thoại không hợp lệ" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: "Email không hợp lệ" });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });
  }

  const user = new User({
    fullName,
    phone: normalizedPhone,
    email: normalizedEmail,
    role: "technician",
    technicianApprovalStatus: "pending",
  });
  await user.setPassword(password);
  await user.save();

  res.status(201).json({
    success: true,
    message: "Đã gửi hồ sơ kỹ thuật viên. Vui lòng chờ quản trị viên phê duyệt.",
    data: { user: toPublicUser(user) },
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

  if (user.role === "technician" && user.technicianApprovalStatus !== "approved") {
    return res.status(403).json({
      success: false,
      message: "Hồ sơ kỹ thuật viên đang chờ quản trị viên phê duyệt.",
    });
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
// PUT /api/auth/change-password - Người dùng tự đổi mật khẩu (cần token)
// Body: { "currentPassword": "...", "newPassword": "..." }
// Kỹ thuật viên dùng ở lần đăng nhập đầu (mustChangePassword = true)
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
  }

  // req.user không có passwordHash (select: false) → lấy lại kèm "+passwordHash" để so khớp
  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng" });
  }

  await user.setPassword(newPassword);
  user.mustChangePassword = false; // đã đổi → không bắt đổi nữa
  await user.save();

  res.json({ success: true, message: "Đã đổi mật khẩu" });
};
import User from "../models/User.js";
import Technician from "../models/Technician.js";
import { normalizePhone } from "../utils/phone.js";

// Các trường của users lấy kèm khi xem kỹ thuật viên (không có passwordHash)
const USER_FIELDS = "fullName phone email isLocked mustChangePassword";

// Gắn thông tin tài khoản và tên dịch vụ vào hồ sơ (thay id bằng dữ liệu thật)
const populateTechnician = (query) =>
  query.populate("userId", USER_FIELDS).populate("skills", "name vehicleType");

// GET /api/technicians?search=... - Danh sách kỹ thuật viên, tìm theo tên / SĐT / email
export const getTechnicians = async (req, res) => {
  const { search } = req.query;
  const filter = {};

  if (search) {
    // Tên, SĐT, email nằm ở users → tìm users trước, rồi lấy hồ sơ có userId thuộc danh sách đó
    const regex = { $regex: search, $options: "i" };
    const users = await User.find({
      role: "technician",
      $or: [{ fullName: regex }, { phone: regex }, { email: regex }],
    }).select("_id");
    filter.userId = { $in: users.map((u) => u._id) };
  }

  const technicians = await populateTechnician(Technician.find(filter).sort({ createdAt: -1 }));
  res.json({ success: true, data: technicians });
};

// POST /api/technicians - Admin tạo tài khoản + hồ sơ kỹ thuật viên
// Body: { fullName, phone, email, password, specialty, skills: [id dịch vụ], radiusKm }
export const createTechnician = async (req, res) => {
  const { fullName, phone, email, password, specialty, skills, radiusKm } = req.body;

  // Kỹ thuật viên bắt buộc có SĐT để khách liên hệ
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({ success: false, message: "Số điện thoại không hợp lệ" });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ success: false, message: "Mật khẩu tạm phải có ít nhất 6 ký tự" });
  }

  // 1. Tạo tài khoản đăng nhập; mustChangePassword = true → bắt đổi mật khẩu ở lần đăng nhập đầu
  const user = new User({
    fullName,
    phone: normalizedPhone,
    email: email || undefined, // chuỗi rỗng → không lưu (tránh trùng "" giữa nhiều người)
    role: "technician",
    mustChangePassword: true,
  });
  await user.setPassword(password);
  await user.save();

  // 2. Tạo hồ sơ nghề nghiệp
  try {
    const technician = await Technician.create({ userId: user._id, specialty, skills, radiusKm });
    const result = await populateTechnician(Technician.findById(technician._id));
    res.status(201).json({ success: true, data: result, message: "Đã tạo kỹ thuật viên" });
  } catch (error) {
    // Hồ sơ lỗi (ví dụ thiếu chuyên môn) → xóa tài khoản vừa tạo, tránh tài khoản "mồ côi" không có hồ sơ
    await user.deleteOne();
    throw error; // chuyển lỗi cho errorHandler trả thông báo tiếng Việt
  }
};

// PUT /api/technicians/:id - Sửa thông tin kỹ thuật viên (:id là _id của hồ sơ technicians)
// Gửi trường nào thì sửa trường đó
export const updateTechnician = async (req, res) => {
  const technician = await Technician.findById(req.params.id);
  if (!technician) {
    return res.status(404).json({ success: false, message: "Không tìm thấy kỹ thuật viên" });
  }
  const user = await User.findById(technician.userId);

  const { fullName, phone, email, specialty, skills, radiusKm } = req.body;

  // Phần thông tin tài khoản (users)
  if (fullName !== undefined) user.fullName = fullName;
  if (email !== undefined) user.email = email || undefined;
  if (phone !== undefined) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: "Số điện thoại không hợp lệ" });
    }
    user.phone = normalizedPhone;
  }

  // Phần hồ sơ nghề nghiệp (technicians)
  if (specialty !== undefined) technician.specialty = specialty;
  if (skills !== undefined) technician.skills = skills;
  if (radiusKm !== undefined) technician.radiusKm = radiusKm;

  // save() chạy lại kiểm tra dữ liệu (enum, min/max, trùng SĐT/email)
  await user.save();
  await technician.save();

  const result = await populateTechnician(Technician.findById(technician._id));
  res.json({ success: true, data: result, message: "Đã cập nhật kỹ thuật viên" });
};
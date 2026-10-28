import User from "../models/User.js";
import Technician from "../models/Technician.js";
import { normalizePhone } from "../utils/phone.js";

// =====================================================================
// Kỹ thuật viên lưu ở 2 nơi:
//   - users: tài khoản đăng nhập, trạng thái duyệt, khóa, sẵn sàng nhận đơn (isAcceptingOrders)
//   - technicians: hồ sơ nghề nghiệp (chuyên môn, kỹ năng, bán kính, vị trí, đánh giá)
// Có 2 cách tạo kỹ thuật viên:
//   1. Ứng viên tự gửi hồ sơ trên app (POST /api/auth/register-technician) → chờ admin duyệt
//   2. Admin tạo trực tiếp trên Admin Web (POST /api/technicians) → duyệt luôn
// Mọi API admin bên dưới dùng :id là _id trong collection users
// =====================================================================

// Gộp tài khoản + hồ sơ thành 1 object để Admin Web hiển thị
// profile = null nghĩa là kỹ thuật viên chưa có hồ sơ nghề nghiệp (thường là người tự đăng ký)
const toTechnicianView = (user, profile) => ({
  _id: user._id,
  fullName: user.fullName,
  phone: user.phone,
  email: user.email,
  isLocked: user.isLocked,
  mustChangePassword: user.mustChangePassword,
  technicianApprovalStatus: user.technicianApprovalStatus,
  isAcceptingOrders: user.isAcceptingOrders !== false,
  createdAt: user.createdAt,
  profile: profile
    ? {
        _id: profile._id,
        specialty: profile.specialty,
        skills: profile.skills, // đã populate: [{ _id, name, vehicleType }]
        radiusKm: profile.radiusKm,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
      }
    : null,
});

// Lấy view của 1 kỹ thuật viên theo userId (dùng sau khi tạo/sửa)
const findTechnicianView = async (userId) => {
  const user = await User.findById(userId);
  const profile = await Technician.findOne({ userId }).populate("skills", "name vehicleType");
  return toTechnicianView(user, profile);
};

// GET /api/technicians?search=... - Danh sách kỹ thuật viên ĐÃ DUYỆT, tìm theo tên / SĐT / email
export const getTechnicians = async (req, res) => {
  const { search } = req.query;

  // $ne "pending": lấy người đã duyệt, kể cả tài khoản cũ chưa có trường technicianApprovalStatus
  const filter = { role: "technician", technicianApprovalStatus: { $ne: "pending" } };
  if (search) {
    const regex = { $regex: search, $options: "i" };
    filter.$or = [{ fullName: regex }, { phone: regex }, { email: regex }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 });

  // Lấy hồ sơ của tất cả kỹ thuật viên trong 1 lần truy vấn, rồi ghép theo userId
  const profiles = await Technician.find({ userId: { $in: users.map((u) => u._id) } }).populate(
    "skills",
    "name vehicleType"
  );
  const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]));

  const data = users.map((u) => toTechnicianView(u, profileByUserId.get(String(u._id))));
  res.json({ success: true, data });
};

// POST /api/technicians - Admin tạo tài khoản + hồ sơ kỹ thuật viên (duyệt luôn)
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

  // 1. Tạo tài khoản; mustChangePassword = true → bắt đổi mật khẩu ở lần đăng nhập đầu
  const user = new User({
    fullName,
    phone: normalizedPhone,
    email: email || undefined, // chuỗi rỗng → không lưu (tránh trùng "" giữa nhiều người)
    role: "technician",
    technicianApprovalStatus: "approved", // admin tự tạo nên không cần chờ duyệt
    mustChangePassword: true,
  });
  await user.setPassword(password);
  await user.save();

  // 2. Tạo hồ sơ nghề nghiệp
  try {
    await Technician.create({ userId: user._id, specialty, skills, radiusKm });
  } catch (error) {
    // Hồ sơ lỗi (ví dụ thiếu chuyên môn) → xóa tài khoản vừa tạo, tránh tài khoản "mồ côi"
    await user.deleteOne();
    throw error; // chuyển lỗi cho errorHandler trả thông báo tiếng Việt
  }

  res.status(201).json({
    success: true,
    data: await findTechnicianView(user._id),
    message: "Đã tạo kỹ thuật viên",
  });
};

// PUT /api/technicians/:id - Sửa thông tin + hồ sơ kỹ thuật viên (:id là _id của users)
// Gửi trường nào thì sửa trường đó. Chưa có hồ sơ thì tạo mới (khi đó bắt buộc có specialty)
export const updateTechnician = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: "technician" });
  if (!user) {
    return res.status(404).json({ success: false, message: "Không tìm thấy kỹ thuật viên" });
  }

  const { fullName, phone, email, specialty, skills, radiusKm } = req.body;

  // Phần tài khoản (users)
  if (fullName !== undefined) user.fullName = fullName;
  if (email !== undefined) user.email = email || undefined;
  if (phone !== undefined) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: "Số điện thoại không hợp lệ" });
    }
    user.phone = normalizedPhone;
  }

  // Phần hồ sơ (technicians): người tự đăng ký chưa có hồ sơ → tạo mới
  const profile = (await Technician.findOne({ userId: user._id })) || new Technician({ userId: user._id });
  if (specialty !== undefined) profile.specialty = specialty;
  if (skills !== undefined) profile.skills = skills;
  if (radiusKm !== undefined) profile.radiusKm = radiusKm;

  // Kiểm tra hồ sơ TRƯỚC khi lưu tài khoản, để không lưu một nửa khi hồ sơ sai
  await profile.validate();
  await user.save();
  await profile.save();

  res.json({
    success: true,
    data: await findTechnicianView(user._id),
    message: "Đã cập nhật kỹ thuật viên",
  });
};

// GET /api/technicians/pending - Hồ sơ ứng viên đang chờ duyệt (người tự đăng ký trên app)
export const getPendingTechnicians = async (_req, res) => {
  const technicians = await User.find({
    role: "technician",
    technicianApprovalStatus: "pending",
  })
    .select("fullName email phone createdAt")
    .sort({ createdAt: 1 });

  res.json({ success: true, data: technicians });
};

// PUT /api/technicians/:id/approve - Admin duyệt hồ sơ ứng viên
export const approveTechnician = async (req, res) => {
  const technician = await User.findOneAndUpdate(
    {
      _id: req.params.id,
      role: "technician",
      technicianApprovalStatus: "pending",
    },
    { $set: { technicianApprovalStatus: "approved" } },
    { returnDocument: "after", runValidators: true }
  ).select("fullName email phone createdAt technicianApprovalStatus");

  if (!technician) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy hồ sơ kỹ thuật viên đang chờ duyệt",
    });
  }

  res.json({
    success: true,
    message: "Đã phê duyệt tài khoản kỹ thuật viên",
    data: technician,
  });
};

// GET /api/technicians/availability - Kỹ thuật viên xem mình đang bật nhận đơn hay không
export const getMyAvailability = async (req, res) => {
  res.json({
    success: true,
    data: {
      // Tài khoản cũ chưa có trường này được xem là đang sẵn sàng.
      isAcceptingOrders: req.user.isAcceptingOrders !== false,
    },
  });
};

// PUT /api/technicians/availability - Kỹ thuật viên bật/tắt nhận đơn
export const updateMyAvailability = async (req, res) => {
  const { isAcceptingOrders } = req.body;

  if (typeof isAcceptingOrders !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Trạng thái nhận đơn không hợp lệ",
    });
  }

  req.user.isAcceptingOrders = isAcceptingOrders;
  await req.user.save();

  res.json({
    success: true,
    message: isAcceptingOrders ? "Đã bật nhận đơn" : "Đã tắt nhận đơn",
    data: { isAcceptingOrders: req.user.isAcceptingOrders },
  });
};

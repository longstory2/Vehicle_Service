import User from "../models/User.js";

// GET /api/users/customers?search=... - Danh sách khách hàng, tìm theo tên / SĐT / email
export const getCustomers = async (req, res) => {
  const { search } = req.query;
  const filter = { role: "customer" };

  if (search) {
    const regex = { $regex: search, $options: "i" };
    filter.$or = [{ fullName: regex }, { phone: regex }, { email: regex }];
  }

  // passwordHash có select: false nên không bị trả về
  const customers = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: customers });
};

// PATCH /api/users/:id/lock - Khóa hoặc mở khóa tài khoản (khách hàng hoặc kỹ thuật viên)
// Body: { "isLocked": true } để khóa, { "isLocked": false } để mở khóa
// :id là _id trong collection users
export const setLockStatus = async (req, res) => {
  const { isLocked } = req.body;
  if (typeof isLocked !== "boolean") {
    return res.status(400).json({ success: false, message: "isLocked phải là true hoặc false" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
  }
  // Không cho khóa admin (tránh tự khóa mình, mất quyền vào hệ thống)
  if (user.role === "admin") {
    return res.status(400).json({ success: false, message: "Không thể khóa tài khoản quản trị" });
  }

  user.isLocked = isLocked;
  await user.save();

  // Bị khóa → middleware protect từ chối mọi request kể cả khi token còn hạn; đăng nhập báo "Tài khoản đã bị khóa"
  res.json({
    success: true,
    data: { _id: user._id, isLocked: user.isLocked },
    message: isLocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
  });
};
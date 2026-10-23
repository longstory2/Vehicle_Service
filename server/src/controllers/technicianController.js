import User from "../models/User.js";

export const getPendingTechnicians = async (_req, res) => {
  const technicians = await User.find({
    role: "technician",
    technicianApprovalStatus: "pending",
  })
    .select("fullName email phone createdAt")
    .sort({ createdAt: 1 });

  res.json({ success: true, data: technicians });
};

export const approveTechnician = async (req, res) => {
  const technician = await User.findOneAndUpdate(
    {
      _id: req.params.id,
      role: "technician",
      technicianApprovalStatus: "pending",
    },
    { $set: { technicianApprovalStatus: "approved" } },
    { new: true, runValidators: true }
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

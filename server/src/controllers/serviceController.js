import Service from "../models/Service.js";

// Các trường client được phép gửi lên (tránh gửi trường lạ như isDefaultInspection)
const pickFields = (body) => {
  const { name, description, vehicleType, price, estimatedMinutes, isActive } = body;
  return { name, description, vehicleType, price, estimatedMinutes, isActive };
};

// GET /api/services?vehicleType=car&search=nhớt&all=true
// Lấy danh sách dịch vụ, có lọc theo loại xe và tìm theo tên
export const getServices = async (req, res) => {
  const { vehicleType, search, all } = req.query;
  const filter = {};

  // Mặc định chỉ lấy dịch vụ đang hoạt động; all=true để lấy cả dịch vụ đã ẩn (dùng cho admin)
  if (all !== "true") filter.isActive = true;
  if (vehicleType) filter.vehicleType = vehicleType;
  // Tìm gần đúng theo tên, không phân biệt hoa thường
  if (search) filter.name = { $regex: search, $options: "i" };

  const services = await Service.find(filter).sort({ vehicleType: 1, name: 1 });
  res.json({ success: true, data: services });
};

// GET /api/services/:id - Xem chi tiết một dịch vụ
export const getServiceById = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" });
  }
  res.json({ success: true, data: service });
};

// POST /api/services - Thêm dịch vụ mới
export const createService = async (req, res) => {
  const service = await Service.create(pickFields(req.body));
  res.status(201).json({ success: true, data: service, message: "Đã thêm dịch vụ" });
};

// PUT /api/services/:id - Cập nhật dịch vụ
export const updateService = async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, pickFields(req.body), {
    returnDocument: "after", // trả về bản ghi SAU khi sửa
    runValidators: true, // vẫn kiểm tra dữ liệu theo schema (giá âm, loại xe sai...)
  });
  if (!service) {
    return res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" });
  }
  res.json({ success: true, data: service, message: "Đã cập nhật dịch vụ" });
};

// DELETE /api/services/:id - Xóa dịch vụ
export const deleteService = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" });
  }
  // Dịch vụ kiểm tra mặc định cần cho thuật toán ghép cặp → không cho xóa
  if (service.isDefaultInspection) {
    return res.status(400).json({ success: false, message: "Không thể xóa dịch vụ kiểm tra mặc định" });
  }
  // TODO (giai đoạn Đơn hàng): nếu dịch vụ đã có trong đơn thì chỉ ẩn (isActive = false), không xóa hẳn
  await service.deleteOne();
  res.json({ success: true, message: "Đã xóa dịch vụ" });
};
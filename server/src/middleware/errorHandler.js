// Gọi khi không có route nào khớp → trả về 404
export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Không tìm thấy đường dẫn ${req.originalUrl}` });
};

// Middleware xử lý lỗi: Express nhận ra nhờ có đủ 4 tham số (err, req, res, next)
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = err.message || "Lỗi máy chủ";

  // Dữ liệu sai so với schema: thiếu tên, giá âm, loại xe không hợp lệ...
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join("; ");
  }

  // _id sai định dạng, ví dụ gọi /api/services/abc
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Mã không hợp lệ";
  }

  // Trùng dữ liệu có ràng buộc unique; err.keyValue cho biết trùng ở trường nào
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    if (field === "email") message = "Email này đã được sử dụng";
    else if (field === "phone") message = "Số điện thoại này đã được sử dụng";
    else message = "Dịch vụ này đã tồn tại cho loại xe đã chọn"; // unique (name, vehicleType) của services
  }

  // In lỗi ra terminal để dễ tìm nguyên nhân khi lập trình
  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({ success: false, message });
};
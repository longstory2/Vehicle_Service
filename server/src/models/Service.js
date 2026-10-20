import mongoose from "mongoose";

// Collection services: danh mục dịch vụ (khớp với ERD trong đề cương)
const serviceSchema = new mongoose.Schema(
  {
    // Tên dịch vụ, ví dụ "Thay nhớt"
    name: { type: String, required: [true, "Vui lòng nhập tên dịch vụ"], trim: true },

    // Mô tả ngắn, không bắt buộc
    description: { type: String, default: "" },

    // Loại xe áp dụng: chỉ nhận "motorbike" (xe máy) hoặc "car" (ô tô)
    vehicleType: {
      type: String,
      enum: { values: ["motorbike", "car"], message: "Loại xe không hợp lệ" },
      required: [true, "Vui lòng chọn loại xe"],
    },

    // Giá niêm yết (VNĐ)
    price: { type: Number, required: [true, "Vui lòng nhập giá"], min: [0, "Giá không được âm"] },

    // Thời gian dự kiến hoàn thành (phút)
    estimatedMinutes: { type: Number, default: 30, min: [5, "Thời gian tối thiểu là 5 phút"] },

    // false = ẩn dịch vụ khỏi app khách hàng (không xóa hẳn)
    isActive: { type: Boolean, default: true },

    // Dịch vụ "Kiểm tra, chẩn đoán tại chỗ": tự gắn khi khách chỉ mô tả sự cố (mục 4.3.3 đề cương)
    isDefaultInspection: { type: Boolean, default: false },
  },
  { timestamps: true } // tự động thêm createdAt, updatedAt
);

// Không cho trùng tên dịch vụ trong cùng một loại xe
serviceSchema.index({ name: 1, vehicleType: 1 }, { unique: true });

const Service = mongoose.model("Service", serviceSchema);
export default Service;
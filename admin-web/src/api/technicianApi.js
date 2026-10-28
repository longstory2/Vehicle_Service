import axiosClient from "./axiosClient";

// Các API quản lý kỹ thuật viên (chỉ admin gọi được)
// Lưu ý: id dùng trong update/approve là _id của tài khoản (collection users)
const technicianApi = {
  // Danh sách đã duyệt; params ví dụ { search: "0903" }
  getAll: (params) => axiosClient.get("/technicians", { params }),

  // Admin tạo kỹ thuật viên (duyệt luôn)
  create: (data) => axiosClient.post("/technicians", data),

  // Sửa thông tin tài khoản + hồ sơ nghề nghiệp
  update: (id, data) => axiosClient.put(`/technicians/${id}`, data),

  // Hồ sơ người tự đăng ký trên app đang chờ duyệt
  getPending: () => axiosClient.get("/technicians/pending"),

  // Duyệt một hồ sơ
  approve: (id) => axiosClient.put(`/technicians/${id}/approve`),
};

export default technicianApi;
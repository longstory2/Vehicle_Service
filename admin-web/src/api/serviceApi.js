import axiosClient from "./axiosClient";

// Gom các lời gọi API dịch vụ vào một chỗ, trang nào cần thì import dùng
// (baseURL đã là http://localhost:5000/api nên chỉ cần viết phần sau)
const serviceApi = {
  // Lấy danh sách; params ví dụ { all: true, vehicleType: "car", search: "nhớt" }
  getAll: (params) => axiosClient.get("/services", { params }),

  // Thêm dịch vụ mới
  create: (data) => axiosClient.post("/services", data),

  // Sửa dịch vụ theo id
  update: (id, data) => axiosClient.put(`/services/${id}`, data),

  // Xóa dịch vụ theo id
  remove: (id) => axiosClient.delete(`/services/${id}`),
};

export default serviceApi;
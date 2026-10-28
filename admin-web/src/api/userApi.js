import axiosClient from "./axiosClient";

// API quản lý người dùng chung (chỉ admin gọi được)
const userApi = {
  // Danh sách khách hàng; params ví dụ { search: "nguyễn" }
  getCustomers: (params) => axiosClient.get("/users/customers", { params }),

  // Khóa (true) hoặc mở khóa (false) tài khoản khách hàng / kỹ thuật viên
  setLock: (id, isLocked) => axiosClient.patch(`/users/${id}/lock`, { isLocked }),
};

export default userApi;
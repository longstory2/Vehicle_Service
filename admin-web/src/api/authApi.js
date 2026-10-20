import axiosClient from "./axiosClient";

// Các lời gọi API liên quan đến đăng nhập
const authApi = {
  // account: email hoặc số điện thoại
  login: (account, password) => axiosClient.post("/auth/login", { account, password }),

  // Lấy thông tin người đang đăng nhập
  getMe: () => axiosClient.get("/auth/me"),
};

export default authApi;
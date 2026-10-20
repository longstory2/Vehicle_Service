import axios from "axios";
import { getToken, clearAuth } from "../utils/authStorage";

// Instance Axios dùng chung cho toàn bộ Admin Web
const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api", // Địa chỉ backend (thư mục server)
  headers: { "Content-Type": "application/json" },
});

// Interceptor request: chạy TRƯỚC mỗi request → tự gắn token nếu đã đăng nhập
// Nhờ vậy serviceApi, authApi... không cần tự thêm header
axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor response: chạy SAU mỗi response
axiosClient.interceptors.response.use(
  (response) => response, // thành công: trả nguyên kết quả
  (error) => {
    // 401 = chưa đăng nhập / token hết hạn → xóa token, về trang đăng nhập
    // (trừ chính request login: sai mật khẩu cũng là 401, để trang Login tự hiện lỗi)
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error); // chuyển lỗi tiếp cho nơi gọi xử lý
  }
);

export default axiosClient;
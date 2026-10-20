import axios from "axios";

// Instance Axios dùng chung cho toàn bộ Admin Web
const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api", // Địa chỉ backend (thư mục server)
  headers: { "Content-Type": "application/json" },
});

export default axiosClient;
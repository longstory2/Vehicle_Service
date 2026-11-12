import axiosClient from "./axiosClient";

// Các API dành riêng cho admin (server/src/routes/adminRoutes.js)
const adminApi = {
  // Danh sách đơn; params ví dụ { status: "ACTIVE", search: "nhớt", page: 1, limit: 10 }
  getOrders: (params) => axiosClient.get("/admin/orders", { params }),

  // Chi tiết 1 đơn
  getOrder: (id) => axiosClient.get(`/admin/orders/${id}`),

  // Admin hủy đơn
  cancelOrder: (id) => axiosClient.put(`/admin/orders/${id}/cancel`),

  // Số liệu Dashboard; params ví dụ { days: 7 }
  getStats: (params) => axiosClient.get("/admin/stats", { params }),
       // Bảng xếp hạng kỹ thuật viên cho 1 đơn; params ví dụ { all: true } để xem cả người offline
     getCandidates: (id, params) => axiosClient.get(`/admin/orders/${id}/candidates`, { params }),
};

export default adminApi;
// Gom việc lưu/đọc thông tin đăng nhập vào một chỗ
// localStorage: bộ nhớ của trình duyệt, tắt trình duyệt mở lại vẫn còn
const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";

// Lưu sau khi đăng nhập thành công
export const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user)); // localStorage chỉ lưu chuỗi → đổi object sang chuỗi
};

// Lấy token (null nếu chưa đăng nhập)
export const getToken = () => localStorage.getItem(TOKEN_KEY);

// Lấy thông tin người dùng (null nếu chưa có hoặc dữ liệu hỏng)
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

// Đã đăng nhập bằng tài khoản admin chưa
export const isAdminLoggedIn = () => !!getToken() && getUser()?.role === "admin";

// Xóa khi đăng xuất hoặc token hết hạn
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
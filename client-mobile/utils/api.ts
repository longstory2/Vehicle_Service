import { getToken } from "./tokenStorage";

// Địa chỉ backend, khai báo trong file .env:
//   EXPO_PUBLIC_API_URL=http://<IP máy tính chạy server>:5000/api
// Điện thoại thật KHÔNG dùng được "localhost" (localhost lúc đó là chính điện thoại)
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api";

// Lỗi trả về từ server, kèm mã trạng thái HTTP (401, 400...) để nơi gọi xử lý
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

// Hàm gọi API dùng chung cho toàn app:
// - tự gắn token (nếu đã đăng nhập) vào header Authorization
// - server trả { success, data, message } → trả về phần data, lỗi thì ném ApiError với câu báo tiếng Việt
export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const token = await getToken();
  const url = `${API_URL}${path}`;
  const method = options.method ?? "GET";
  console.log(`[API] ${method} ${url}`); // xem trong Terminal chạy Expo để biết app đang gọi tới đâu

  // Quá 15 giây không có phản hồi thì hủy request (tránh app "đứng yên" khi sai IP / bị tường lửa chặn)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    // Không tới được server: sai IP, server chưa chạy, điện thoại và máy tính khác mạng Wi-Fi, tường lửa chặn
    console.error(`[API] Lỗi kết nối ${url}`, error);
    throw new ApiError(`Không kết nối được server (${url}). Kiểm tra server đã chạy, IP trong .env và cùng mạng Wi-Fi.`, 0);
  } finally {
    clearTimeout(timeoutId);
  }

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new ApiError(json?.message ?? "Có lỗi xảy ra, vui lòng thử lại.", response.status);
  }
  return json.data as T;
};

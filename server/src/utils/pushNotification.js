import User from "../models/User.js";

// Địa chỉ dịch vụ gửi thông báo của Expo (miễn phí, không cần khóa bí mật)
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Kiểm tra chuỗi có đúng dạng Expo push token không: ExponentPushToken[...] hoặc ExpoPushToken[...]
export const isExpoPushToken = (token) =>
  typeof token === "string" && /^Expo(nent)?PushToken\[.+\]$/.test(token);

// Gửi một thông báo cho một người dùng theo userId
// Không bao giờ ném lỗi: gửi hỏng chỉ ghi log, không làm hỏng việc tạo đơn hay ghép cặp
// Trả về true nếu Expo đã nhận thông báo
export const sendPushToUser = async (userId, { title, body, data = {}, ttlSeconds = 60 }) => {
  try {
    const user = await User.findById(userId).select("expoPushToken");
    if (!user?.expoPushToken) return false; // app chưa gửi token lên → bỏ qua

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      // Gửi dạng mảng (Expo cho gửi nhiều thông báo một lần), ở đây chỉ có 1
      body: JSON.stringify([
        {
          to: user.expoPushToken,
          title,
          body,
          data, // app đọc data.orderId để mở đúng đơn khi bấm vào thông báo
          sound: "default",
          priority: "high", // Android: hiện ngay cả khi máy đang ở chế độ tiết kiệm pin
          channelId: "orders", // Android: kênh thông báo "orders" do app tạo
          ttl: ttlSeconds, // quá thời gian này mà máy chưa nhận được thì bỏ, không giao muộn
        },
      ]),
    });
    const result = await response.json();

    // Lỗi cả yêu cầu (sai định dạng, quá tải...)
    if (result.errors) {
      console.error("[Thông báo] Expo từ chối yêu cầu:", result.errors[0]?.message);
      return false;
    }

    // Lỗi của riêng thông báo này
    const ticket = result.data?.[0];
    if (ticket?.status === "error") {
      console.error("[Thông báo] Không gửi được:", ticket.message);
      // Token không còn dùng được (gỡ app, cài lại...) → xóa để lần sau không gửi nữa
      if (ticket.details?.error === "DeviceNotRegistered") {
        await User.updateOne({ _id: userId }, { $set: { expoPushToken: null } });
      }
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Thông báo] Lỗi kết nối Expo:", error.message);
    return false;
  }
};
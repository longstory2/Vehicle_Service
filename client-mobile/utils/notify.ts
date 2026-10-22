import { Alert, Platform } from "react-native";

// Alert.alert của React Native KHÔNG hiện gì khi chạy trên web (npm run web)
// → trên web dùng window.alert / window.confirm của trình duyệt thay thế

// Hiện thông báo một nút OK
export const showAlert = (title: string, message?: string) => {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
};

// Hỏi xác nhận (Hủy / nút xác nhận), đồng ý thì chạy onConfirm
export const confirmAction = (
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void | Promise<void>,
) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Hủy", style: "cancel" },
    { text: confirmText, style: "destructive", onPress: () => onConfirm() },
  ]);
};

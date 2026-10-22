import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Nơi lưu token đăng nhập (JWT do server cấp)
// - Điện thoại: expo-secure-store (bộ nhớ mã hóa của máy)
// - Web (npm run web): SecureStore không chạy trên trình duyệt → dùng localStorage
const TOKEN_KEY = "auth_token";
const isWeb = Platform.OS === "web";
const hasLocalStorage = () => typeof localStorage !== "undefined";

export const saveToken = async (token: string) => {
  if (isWeb) {
    if (hasLocalStorage()) localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  if (isWeb) return hasLocalStorage() ? localStorage.getItem(TOKEN_KEY) : null;
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  if (isWeb) {
    if (hasLocalStorage()) localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

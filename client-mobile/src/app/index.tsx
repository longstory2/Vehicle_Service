import { Redirect } from "expo-router";
import { useAuth } from "../../context/AuthContext";

// Màn hình điều hướng: dựa vào trạng thái đăng nhập và vai trò để chuyển tới đúng nhóm tab
const Index = () => {
  const { isLoaded, isSignedIn, user } = useAuth();

  if (!isLoaded) return null; // đang đọc token đã lưu
  if (!isSignedIn || !user) return <Redirect href="/(auth)/welcome" />;
  if (user.role === "technician") {
    return <Redirect href="/(tabs)/(MechanicTab)/home" />;
  }

  return <Redirect href="/(tabs)/(CustomerTab)/home" />;
};

export default Index;

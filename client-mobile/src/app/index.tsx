import { Redirect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// Màn hình điều hướng: dựa vào trạng thái đăng nhập và vai trò để chuyển tới đúng nhóm tab
const Index = () => {
  const { isLoaded, isSignedIn, user } = useAuth();

  if (!isLoaded) {
    return (<View style={styles.loading}>
      <ActivityIndicator size="large" color="#0286FF" />
      <Text style={styles.loadingText}>Đang khởi động ứng dụng...</Text>
    </View>)


  }
  if (!isSignedIn || !user) return <Redirect href="/(auth)/welcome" />;
  if (user.role === "technician") {
    return <Redirect href="/(tabs)/(MechanicTab)/home" />;
  }

  return <Redirect href="/(tabs)/(CustomerTab)/home" />;
};

export default Index;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
  },
});

import { useState } from "react";
import { Alert, View, Text, Image } from "react-native";
import { router } from "expo-router";
import { useSSO } from "@clerk/expo/experimental";
import CustomButton from "../components/CustomButton";
import { icons } from "../constants/icon";
const OAuth = () => {
  const { startSSOFlow } = useSSO();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { createdSessionId } = await startSSOFlow({
        strategy: "oauth_google",
        unsafeMetadata: { role: "customer" },
      });
      if (createdSessionId) router.replace("/");
    } catch (error) {
      Alert.alert("Không thể đăng nhập bằng Google", error instanceof Error ? error.message : "Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-lg">Hoặc đăng nhập bằng</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>
      <CustomButton
        title={isSubmitting ? "Đang kết nối..." : "Đăng ký bằng Google"}
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
        disabled={isSubmitting}
      />
    </View>
  )
};

export default OAuth; 
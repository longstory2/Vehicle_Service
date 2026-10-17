import { Alert, Text, Image, ScrollView, View } from "react-native";
import { icons } from "../../../constants/icon";
import { images } from "../../../constants/index";
import InputField from "../../../components/InputField";
import { useState } from "react";
import CustomButton from "../../../components/CustomButton";
import { Link, router } from "expo-router";
import OAuth from "../../../components/OAuth";
import { useAuth, useSignIn } from "@clerk/expo";

const SignIn = () => {
  const { isLoaded } = useAuth();
  const { signIn } = useSignIn();
  const [form, setForm] = useState({
    emailAddress: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignInPress = async () => {
    const emailAddress = form.emailAddress.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      Alert.alert("Email không hợp lệ", "Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (!form.password.trim()) {
      Alert.alert("Thiếu mật khẩu", "Vui lòng nhập mật khẩu.");
      return;
    }
    if (!isLoaded) return;

    setIsSubmitting(true);
    try {
      const { error } = await signIn.password({ emailAddress, password: form.password });
      if (error) {
        Alert.alert("Đăng nhập không thành công", error.message);
        return;
      }
      if (signIn.status !== "complete") {
        Alert.alert("Chưa thể đăng nhập", "Tài khoản cần hoàn tất thêm bước xác minh.");
        return;
      }

      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) {
        Alert.alert("Đăng nhập không thành công", finalizeError.message);
        return;
      }
      router.replace("/");
    } catch (error) {
      Alert.alert("Lỗi đăng nhập", error instanceof Error ? error.message : "Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 h-[250px] w-full" />
          <Text className="absolute bottom-5 left-5 text-2xl text-black font-JakartaSemiBold">
            Đăng nhập
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Nhập email"
            icon={icons.person}
            value={form.emailAddress}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCapitalize="none"
            onChangeText={(emailAddress) => setForm({ ...form, emailAddress })}
          />

          <InputField
            label="mật khẩu"
            placeholder="Nhập mật khẩu"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(password) => setForm({ ...form, password })}
          />

          <CustomButton title={isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"} onPress={onSignInPress} disabled={isSubmitting} className="mt-6" />

          {/* OAtuth các loại đăng ký khác */}
          <OAuth />
          <Link href={"/(auth)/sign-up"}
            className="text-lg text-center text-general-200 mt-10">Chưa có tài khoản?
            <Text className="text-blue-500">Đăng ký</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;
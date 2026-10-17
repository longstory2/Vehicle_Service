import { Text, Image, ScrollView, View, Alert } from "react-native";
import { icons } from "../../../constants/icon";
import { images } from "../../../constants/index";
import InputField from "../../../components/InputField";
import { useState } from "react";
import CustomButton from "../../../components/CustomButton";
import { Link, router, type Href } from "expo-router";
import OAuth from "../../../components/OAuth";
import { useAuth, useSignUp } from "@clerk/expo";

const SignUp = () => {
  const goToSignIn = () => {
    router.replace("/(auth)/sign-in");
  };

  const { isLoaded } = useAuth();
  const { signUp } = useSignUp();
  const [form, setForm] = useState({ emailAddress: "", password: "" });
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    const emailAddress = form.emailAddress.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      Alert.alert("Email không hợp lệ", "Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (form.password.length < 8) {
      Alert.alert("Mật khẩu chưa hợp lệ", "Mật khẩu phải có ít nhất 15 ký tự.");
      return;
    }
    if (!isLoaded) return;

    setIsSubmitting(true);
    try {
      const { error } = await signUp.password({
        emailAddress,
        password: form.password,
        unsafeMetadata: { role: "customer" },
      });
      if (error) {
        Alert.alert("Không thể đăng ký", error.message);
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        Alert.alert("Không thể gửi mã xác minh", sendError.message);
        return;
      }
      setIsVerifying(true);
    } catch (error) {
      Alert.alert("Lỗi đăng ký", error instanceof Error ? error.message : "Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      Alert.alert("Mã xác minh không hợp lệ", "Vui lòng nhập mã gồm 6 chữ số.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) {
        Alert.alert("Xác minh không thành công", error.message);
        return;
      }

      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) {
        Alert.alert("Không thể hoàn tất đăng ký", finalizeError.message);
        return;
      }
      router.replace("/(auth)/complete-profile" as Href);
    } catch (error) {
      Alert.alert("Lỗi xác minh", error instanceof Error ? error.message : "Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return null;
  }

  if (isVerifying) {
    return (
      <View className="flex-1 bg-white p-5 justify-center">
        <Text className="text-2xl text-black font-JakartaSemiBold mb-3">Xác minh email</Text>
        <Text className="text-base text-general-200 mb-4">Nhập mã xác minh được gửi đến email của bạn.</Text>
        <InputField
          label="Mã xác minh"
          placeholder="Nhập mã 6 chữ số"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
        <CustomButton title={isSubmitting ? "Đang xác minh..." : "Xác minh"} onPress={handleVerify} disabled={isSubmitting} className="mt-6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 h-[250px] w-full" />
          <Text className="absolute bottom-5 left-5 text-2xl text-black font-Jakarta-ExtraBold">
            Tạo tài khoản
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Nhập email"
            icon={icons.person}
            value={form.emailAddress}
            onChangeText={(emailAddress) => setForm({ ...form, emailAddress })}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCapitalize="none"
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

          <CustomButton
            title={isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            onPress={handleSignUp}
            disabled={isSubmitting}
            className="mt-6"
          />

          <OAuth />
          <CustomButton
            title="Đăng nhập với kỹ thuật viên"
            onPress={goToSignIn}
            className="mt-6"
          />
          <Link
            href="/(auth)/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            <Text>Đã có tài khoản? </Text>
            <Text className="text-blue-500">Đăng nhập</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;
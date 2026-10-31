import { Text, Image, ScrollView, View } from "react-native";
import { icons } from "../../../constants/icon";
import { images } from "../../../constants/index";
import InputField from "../../../components/InputField";
import { useState } from "react";
import CustomButton from "../../../components/CustomButton";
import { Link, router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { normalizeVietnamPhoneNumber } from "../../../utils/auth";
import { showAlert } from "../../../utils/notify";

// Đăng ký tài khoản khách hàng: gộp luôn họ tên, số điện thoại (trước đây ở màn complete-profile)
const SignUp = () => {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "", emailAddress: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    const fullName = form.fullName.trim();
    const emailAddress = form.emailAddress.trim().toLowerCase();

    if (!fullName) {
      showAlert("Thiếu họ tên", "Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!normalizeVietnamPhoneNumber(form.phone)) {
      showAlert("Số điện thoại không hợp lệ", "Vui lòng nhập số điện thoại di động Việt Nam gồm 10 số.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      showAlert("Email không hợp lệ", "Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (form.password.length < 6) {
      showAlert("Mật khẩu chưa hợp lệ", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      // POST /api/auth/register → server tạo tài khoản role "customer" và trả token (đăng nhập luôn)
      await signUp({ fullName, phone: form.phone, email: emailAddress, password: form.password });
      router.replace("/");
    } catch (error) {
      // Ví dụ: "Email này đã được sử dụng", "Số điện thoại này đã được sử dụng"
      showAlert("Không thể đăng ký", error instanceof Error ? error.message : "Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 h-[250px] w-full" />
          <Text className="absolute bottom-5 left-5 text-2xl text-black font-bold">
            Tạo tài khoản
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Họ và tên"
            placeholder="Nhập họ và tên"
            icon={icons.person}
            value={form.fullName}
            onChangeText={(fullName) => setForm({ ...form, fullName })}
            textContentType="name"
            autoCapitalize="words"
          />
          <InputField
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            icon={icons.person}
            value={form.phone}
            onChangeText={(phone) => setForm({ ...form, phone })}
            keyboardType="phone-pad"
            maxLength={10}
          />
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
            placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
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
          <Link
            href="/(auth)/sign-in"
            className="text-lg text-center text-general-200 mt-5">
            <Text>Đã có tài khoản? </Text>
            <Text className="text-blue-500">Đăng nhập</Text>
          </Link>
          <View className="h-[3px] bg-[#e7e7e7]" />
          <CustomButton
            title="Đăng nhập kỹ thuật viên"
            onPress={() => router.replace("/(auth)/sign-in")}
            className="mt-6"
          />
          <CustomButton
            title="Đăng ký làm kỹ thuật viên"
            onPress={() => router.replace("/(auth)/TechSignUp")}
            className="mt-6"
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;

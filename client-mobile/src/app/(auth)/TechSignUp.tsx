import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import CustomButton from "../../../components/CustomButton";
import InputField from "../../../components/InputField";
import { icons } from "../../../constants/icon";
import { images } from "../../../constants/index";
import { useAuth } from "../../../context/AuthContext";
import { normalizeVietnamPhoneNumber } from "../../../utils/auth";
import { showAlert } from "../../../utils/notify";

const TechSignUp = () => {
  const { signUpTechnician } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSignUp = async () => {
    const fullName = form.fullName.trim();
    const phone = form.phone.trim();
    const email = form.email.trim().toLowerCase();

    if (!fullName) {
      showAlert("Thiếu họ tên", "Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!normalizeVietnamPhoneNumber(phone)) {
      showAlert("Số điện thoại không hợp lệ", "Vui lòng nhập số điện thoại di động Việt Nam gồm 10 số.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert("Email không hợp lệ", "Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (form.password.length < 6) {
      showAlert("Mật khẩu chưa hợp lệ", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpTechnician({ fullName, phone, email, password: form.password });
      setIsSubmitted(true);
    } catch (error) {
      showAlert("Không thể gửi hồ sơ", error instanceof Error ? error.message : "Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="mb-3 text-center text-2xl font-JakartaSemiBold text-black">
          Đã gửi hồ sơ đăng ký
        </Text>
        <Text className="mb-6 text-center text-base text-general-200">
          Thông tin của bạn đã được gửi đến quản trị viên. Bạn có thể đăng nhập sau khi hồ sơ được phê duyệt.
        </Text>
        <CustomButton
          title="Về đăng nhập kỹ thuật viên"
          onPress={() => router.replace("/(auth)/sign-in")}
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative h-[250px] w-full">
          <Image source={images.signUpCar} className="z-0 h-[250px] w-full" />
          <Text className="absolute bottom-5 left-5 text-2xl font-JakartaSemiBold text-black">
            Đăng ký kỹ thuật viên
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
            value={form.email}
            onChangeText={(email) => setForm({ ...form, email })}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCapitalize="none"
          />
          <InputField
            label="Mật khẩu"
            placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
            icon={icons.lock}
            secureTextEntry
            textContentType="newPassword"
            value={form.password}
            onChangeText={(password) => setForm({ ...form, password })}
          />

          <CustomButton
            title={isSubmitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ đăng ký"}
            onPress={handleSignUp}
            disabled={isSubmitting}
            className="mt-6"
          />
          <Text className="mt-4 text-center text-general-200">
            Tài khoản chỉ đăng nhập được sau khi quản trị viên phê duyệt.
          </Text>
          <Link href="/(auth)/sign-in" className="mt-8 text-center text-lg text-blue-500">
            Đã có tài khoản kỹ thuật viên? Đăng nhập
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default TechSignUp;

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

const SignIn = () => {
    const { signIn } = useAuth();
    const [form, setForm] = useState({
        account: "", // email hoặc số điện thoại
        password: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSignInPress = async () => {
        const account = form.account.trim().toLowerCase();

        // Có "@" thì kiểm tra như email, ngược lại kiểm tra như số điện thoại
        const isEmail = account.includes("@");
        if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
            showAlert("Email không hợp lệ", "Vui lòng nhập địa chỉ email hợp lệ.");
            return;
        }
        if (!isEmail && !normalizeVietnamPhoneNumber(account)) {
            showAlert("Tài khoản không hợp lệ", "Vui lòng nhập email hoặc số điện thoại 10 số.");
            return;
        }
        if (!form.password.trim()) {
            showAlert("Thiếu mật khẩu", "Vui lòng nhập mật khẩu.");
            return;
        }

        setIsSubmitting(true);
        try {
            // POST /api/auth/login → lưu token; màn hình "/" tự chuyển theo vai trò (khách hàng / kỹ thuật viên)
            await signIn(account, form.password);
            router.replace("/");
        } catch (error) {
            console.error(error); // xem lỗi chi tiết trong Terminal chạy Expo
            showAlert("Đăng nhập không thành công", error instanceof Error ? error.message : "Vui lòng thử lại.");
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
                        label="Email hoặc số điện thoại"
                        placeholder="Nhập email hoặc số điện thoại"
                        icon={icons.person}
                        value={form.account}
                        keyboardType="email-address"
                        textContentType="username"
                        autoCapitalize="none"
                        onChangeText={(account) => setForm({ ...form, account })}
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

                    <Link href="/(auth)/sign-up"
                        className="text-lg text-center text-general-200 mt-10">Chưa có tài khoản kỹ thuật viên?
                        <Text className="text-blue-500"> Gửi hồ sơ đăng ký</Text>
                    </Link>
                </View>
            </View>
        </ScrollView>
    );
};

export default SignIn;

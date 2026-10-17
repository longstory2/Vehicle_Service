import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useUser } from "@clerk/expo";
import CustomButton from "../../../components/CustomButton";
import InputField from "../../../components/InputField";
import { icons } from "../../../constants/icon";
import { normalizeVietnamPhoneNumber } from "../../../utils/auth";

const CompleteProfile = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const [fullName, setFullName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isLoaded) return null;
    if (!isSignedIn || !user) return <Redirect href="/(auth)/sign-in" />;

    const handleSaveProfile = async () => {
        const normalizedPhone = normalizeVietnamPhoneNumber(phoneNumber);
        const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
        if (!nameParts.length) {
            Alert.alert("Thiếu họ tên", "Vui lòng nhập họ và tên của bạn.");
            return;
        }
        if (!normalizedPhone) {
            Alert.alert("Số điện thoại không hợp lệ", "Vui lòng nhập số điện thoại di động Việt Nam gồm 10 số.");
            return;
        }

        const lastName = nameParts.length > 1 ? nameParts.pop()! : "";
        setIsSubmitting(true);
        try {
            await user.update({ firstName: nameParts.join(" "), lastName });
            await user.updateMetadata({
                unsafeMetadata: { contactPhone: normalizedPhone, profileComplete: true, role: "customer" },
            });
            router.replace("/");
        } catch (error) {
            Alert.alert("Không thể lưu thông tin", error instanceof Error ? error.message : "Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white">
            <View className="flex-1 bg-white p-5 pt-16">
                <Text className="text-2xl text-black font-JakartaSemiBold mb-2">Hoàn tất thông tin</Text>
                <Text className="text-base text-general-200 mb-5">Cho chúng tôi biết tên và số điện thoại liên hệ của bạn.</Text>
                <InputField
                    label="Họ và tên"
                    placeholder="Nhập họ và tên"
                    icon={icons.person}
                    value={fullName}
                    onChangeText={setFullName}
                    textContentType="name"
                    autoCapitalize="words"
                />
                <InputField
                    label="Số điện thoại"
                    placeholder="Nhập số điện thoại"
                    icon={icons.person}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                />
                <CustomButton
                    title={isSubmitting ? "Đang lưu..." : "Tiếp tục"}
                    onPress={handleSaveProfile}
                    disabled={isSubmitting}
                    className="mt-6"
                />
            </View>
        </ScrollView>
    );
};

export default CompleteProfile;
import { useEffect, useState } from "react";
import { Image, Pressable, Text, TextInput, View, type ImageSourcePropType, } from "react-native";
import { Redirect, router } from "expo-router";
import { useAuth } from "../../../../context/AuthContext";
import { icons } from "../../../../constants/icon";
import { normalizeVietnamPhoneNumber } from "../../../../utils/auth";
import { confirmAction, showAlert } from "../../../../utils/notify";
import { AccountField } from "../../../../components/InputField"
const avatar = require("../../../../assets/images/avatar.png");

const TabIcon = ({ source }: { source: ImageSourcePropType }) => (
    <Image source={source} className="w-6 h-6" resizeMode="contain" />
);

const Account = () => {
    const { isLoaded, isSignedIn, user, signOut, updateProfile } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Thông tin lấy từ server (GET /api/auth/me), số điện thoại dạng 0901234567
    const savedPhone = user?.phone ?? "";
    const email = user?.email ?? "";
    const fullName = user?.fullName?.trim() || "Tên chưa cập nhật";

    useEffect(() => {
        setPhoneNumber(savedPhone);
    }, [savedPhone]);

    if (!isLoaded) return null;
    if (!isSignedIn || !user) return <Redirect href="/(auth)/sign-in" />;

    const hasPhoneChanges = phoneNumber.trim() !== savedPhone;

    const handleSavePhone = async () => {
        const normalizedPhone = normalizeVietnamPhoneNumber(phoneNumber);
        if (!normalizedPhone) {
            showAlert(
                "Số điện thoại không hợp lệ",
                "Vui lòng nhập số điện thoại di động Việt Nam gồm 10 số.",
            );
            return;
        }

        setIsSaving(true);
        try {
            // PUT /api/auth/me: server chuẩn hóa và lưu số điện thoại
            const updated = await updateProfile({ phone: phoneNumber });
            setPhoneNumber(updated.phone ?? "");
            showAlert("Đã lưu", "Số điện thoại của bạn đã được cập nhật.");
        } catch (error) {
            showAlert(
                "Không thể lưu thông tin",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = () => {
        // Đăng xuất JWT: chỉ xóa token trên máy, không cần gọi server
        confirmAction("Đăng xuất", "Bạn có chắc muốn đăng xuất khỏi tài khoản?", "Đăng xuất", async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
        });
    };

    return (
        <View className="flex-1 bg-white px-6 pb-4 pt-5">
            <View className="h-12 flex-row items-center justify-center mt-10">
                <Pressable
                    className="absolute left-0 h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
                    accessibilityRole="button"
                    accessibilityLabel="Quay lại"
                    hitSlop={8}
                    onPress={() => router.back()}
                >
                    <TabIcon source={icons.backarrow} />
                </Pressable>
                <Text className="text-xl font-Jakarta-Bold text-black">Tài khoản</Text>
            </View>

            <View className="mt-5 items-center">
                <Image
                    source={avatar}
                    className="h-24 w-24  rounded-full"
                />
                <Text className="mt-3 text-lg font-JakartaSemiBold text-black">
                    {fullName}
                </Text>
            </View>

            <View className="mt-6">
                <AccountField
                    label="Số điện thoại"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    editable
                    keyboardType="phone-pad"
                    accessibilityLabel="Số điện thoại"
                />
                <AccountField
                    label="Email"
                    value={email || "Chưa có email"}
                    accessibilityLabel="Email"
                />
                {hasPhoneChanges && (
                    <Pressable
                        accessibilityRole="button"
                        className={`mt-2 items-center rounded-lg bg-neutral-100 py-3 ${isSaving ? "opacity-50" : ""}`}
                        disabled={isSaving}
                        onPress={handleSavePhone}
                    >
                        <Text className="font-JakartaSemiBold text-black">
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                        </Text>
                    </Pressable>
                )}
            </View>

            <Pressable
                accessibilityRole="button"
                className="mt-auto items-center rounded-lg bg-neutral-100 py-3"
                onPress={handleSignOut}
            >
                <Text className="font-JakartaSemiBold text-black">Đăng xuất</Text>
            </Pressable>
        </View>
    );
};

export default Account;

import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    Text,
    TextInput,
    View,
    type ImageSourcePropType,
} from "react-native";
import { Redirect, router } from "expo-router";
import { useClerk, useUser } from "@clerk/expo";
import { icons } from "../../../../constants/icon";
import { normalizeVietnamPhoneNumber } from "../../../../utils/auth";
const avatar = require("../../../../assets/images/avatar.png");
const TabIcon = ({ source }: { source: ImageSourcePropType }) => (
    <Image source={source} className="w-6 h-6" resizeMode="contain" />
);

type AccountFieldProps = {
    label: string;
    value: string;
    onChangeText?: (value: string) => void;
    editable?: boolean;
    keyboardType?: "default" | "phone-pad" | "email-address";
    accessibilityLabel: string;
};

const AccountField = ({
    label,
    value,
    onChangeText,
    editable = false,
    keyboardType = "default",
    accessibilityLabel,
}: AccountFieldProps) => (
    <View className="mb-2">
        <Text className="mb-1 text-lg font-JakartaSemiBold text-black">{label}</Text>
        <TextInput
            accessibilityLabel={accessibilityLabel}
            className="h-12 rounded-xl bg-neutral-100 px-3 text-base text-black"
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            keyboardType={keyboardType}
            autoCapitalize="none"
            maxLength={16}
        />
    </View>
);

const Account = () => {
    const { signOut } = useClerk();
    const { isLoaded, isSignedIn, user } = useUser();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const savedPhone =
        typeof user?.unsafeMetadata.contactPhone === "string"
            ? user.unsafeMetadata.contactPhone
            : "";
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    const fullName =
        user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        "Tên chưa cập nhật";

    useEffect(() => {
        setPhoneNumber(savedPhone);
    }, [savedPhone]);

    if (!isLoaded) return null;
    if (!isSignedIn || !user) return <Redirect href="/(auth)/sign-in" />;

    const hasPhoneChanges = phoneNumber.trim() !== savedPhone;

    const handleSavePhone = async () => {
        const normalizedPhone = normalizeVietnamPhoneNumber(phoneNumber);
        if (!normalizedPhone) {
            Alert.alert(
                "Số điện thoại không hợp lệ",
                "Vui lòng nhập số điện thoại di động Việt Nam gồm 10 số.",
            );
            return;
        }

        setIsSaving(true);
        try {
            await user.updateMetadata({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    contactPhone: normalizedPhone,
                },
            });
            setPhoneNumber(normalizedPhone);
            Alert.alert("Đã lưu", "Số điện thoại của bạn đã được cập nhật.");
        } catch (error) {
            Alert.alert(
                "Không thể lưu thông tin",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất khỏi tài khoản?", [
            { text: "Hủy", style: "cancel" },
            {
                text: "Đăng xuất",
                style: "destructive",
                onPress: async () => {
                    try {
                        await signOut();
                        router.replace("/(auth)/sign-in");
                    } catch (error) {
                        Alert.alert(
                            "Không thể đăng xuất",
                            error instanceof Error ? error.message : "Vui lòng thử lại.",
                        );
                    }
                },
            },
        ]);
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
                    source={user.hasImage ? { uri: user.imageUrl } : avatar}
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

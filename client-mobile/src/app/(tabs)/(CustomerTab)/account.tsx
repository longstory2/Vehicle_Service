import { Alert, View, Text } from "react-native";
import { useClerk } from "@clerk/expo";
import { router } from "expo-router";
import CustomButton from "../../../../components/CustomButton";

const Account = () => {
    const { signOut } = useClerk();

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
                        Alert.alert("Không thể đăng xuất", error instanceof Error ? error.message : "Vui lòng thử lại.");
                    }
                },
            },
        ]);
    };

    return (
        <View className="flex-1 bg-white p-5">
            <Text className="text-2xl font-JakartaSemiBold text-black">Tài khoản</Text>
            <CustomButton
                title="Đăng xuất"
                bgVariant="danger"
                onPress={handleSignOut}
                className="mt-6"
            />
        </View>
    )
}

export default Account
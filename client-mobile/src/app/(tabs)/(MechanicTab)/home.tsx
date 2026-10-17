import { useUser } from "@clerk/expo";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

const MechanicHome = () => {
    const { isLoaded, isSignedIn, user } = useUser();

    if (!isLoaded) return null;
    if (!isSignedIn || !user) return <Redirect href="/(auth)/welcome" />;
    if (user.publicMetadata.role !== "mechanic") {
        return <Redirect href="/(tabs)/(CustomerTab)/home" />;
    }

    return (
        <SafeAreaView className="flex-1 bg-[#eeeeee]" edges={["top"]}>
            <View className="bg-[#9dccf5] px-5 py-6">
                <Text className="text-2xl font-JakartaSemiBold text-black">
                    Xin chào, {user.firstName || user.fullName || "Kỹ thuật viên"}
                </Text>
                <Text className="mt-1 text-base text-black">Tài khoản kỹ thuật viên</Text>
            </View>
            <View className="mt-3 bg-white px-5 py-5">
                <Text className="text-lg font-JakartaSemiBold text-black">Thông tin đăng nhập</Text>
                <Text className="mt-2 text-base text-black">
                    {user.primaryEmailAddress?.emailAddress || "Chưa có email"}
                </Text>
            </View>
        </SafeAreaView>
    )
}

export default MechanicHome
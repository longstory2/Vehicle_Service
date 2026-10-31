import { useAuth } from "../../../../context/AuthContext";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { popularServices, serviceCategories } from "../../../../constants/data"
import { banner } from "../../../../constants";
import { icons } from "../../../../constants/icon";

const avatar = require("../../../../assets/images/avatar.png");
const screenWidth = Dimensions.get("window").width;
const serviceCardWidth = screenWidth * 0.68;

const HomeScreen = () => {
    const { isLoaded, isSignedIn, user } = useAuth();
    const [activeBanner, setActiveBanner] = useState(0);

    if (!isLoaded) return null;
    if (!isSignedIn || !user) return <Redirect href="/(auth)/welcome" />;
    if (user.role === "technician") {
        return <Redirect href="/(tabs)/(MechanicTab)/home" />;
    }

    const goToBooking = () => {
        router.push("/(tabs)/(CustomerTab)/book");
    };

    return (
        <SafeAreaView
            edges={["top"]}
            style={{ flex: 1, backgroundColor: "#9dccf5" }}
        >
            <ScrollView
                className="flex-1 bg-[#eeeeee]"
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-row items-center bg-[#9dccf5] px-5 py-4">
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Tài khoản"
                        onPress={() => router.push("/(tabs)/(CustomerTab)/account")}
                        className="h-14 w-14 items-center justify-center rounded-full bg-white">
                        <Image
                            source={avatar}
                            className="h-11 w-11 rounded-full"
                        />
                    </TouchableOpacity>

                    <Text
                        className="ml-3 flex-1 text-[20px] text-black">

                        Xin chào, {user.fullName.trim().split(/\s+/).pop() || "bạn"}
                    </Text>

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Thông báo"
                        className="h-14 w-14 items-center justify-center rounded-full bg-white"
                    >
                        <Image source={icons.bell} className="h-8 w-8" resizeMode="contain" />
                    </TouchableOpacity>
                </View>

                <View className="bg-white pb-5 pt-4">
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => {
                            const page = Math.round(
                                event.nativeEvent.contentOffset.x / screenWidth,
                            );
                            setActiveBanner(page);
                        }}
                    >
                        {banner.map((item) => (
                            <View
                                key={item.id}
                                style={{ width: screenWidth }}
                                className="items-center">
                                <Image
                                    source={item.images}
                                    resizeMode="cover"
                                    style={{
                                        width: screenWidth - 40,
                                        height: 170,
                                    }}
                                    className="rounded-md" />
                            </View>
                        ))}
                    </ScrollView>

                    <View className="mt-4 flex-row justify-center">
                        {banner.map((item, index) => (
                            <View
                                key={item.id}
                                className={`mx-1.5 h-3 w-3 rounded-full ${activeBanner === index ? "bg-[#27b9ee]" : "bg-[#d8d8d8]"}`} />))}
                    </View>
                </View>

                <View className="mt-3 bg-white px-4 py-4">
                    <Text
                        className="text-[28px] text-black font-bold"
                    >
                        Chăm sóc xe
                    </Text>
                    <Text className="text-[16px] text-black">
                        Chăm sóc xe định kỳ sẽ giúp xe bền hơn
                    </Text>

                    <View className="mt-3 gap-3">
                        {[
                            "Thay nhớt xe sau 2000km",
                            "Thay vỏ xe mới nếu lố cán đinh",
                            "Dù bạn đang ở đâu chúng tôi sẵn sàng giúp bạn",
                        ].map((tip) => (
                            <View key={tip} className="flex-row items-center">
                                <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#ff7628]">
                                    <Text className="text-[26px] font-bold text-white">✓</Text>
                                </View>
                                <Text className="flex-1 text-[16px] text-black">{tip}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="mt-3 bg-white py-4">
                    <Text
                        className="mb-3 px-4 text-[27px] text-black font-bold">
                        Các dịch vụ hay đặt nhất
                    </Text>

                    <ScrollView
                        horizontal
                        nestedScrollEnabled
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 14, gap: 14 }}>
                        {popularServices.map((service) => (
                            <View
                                key={service.id}
                                style={{ width: serviceCardWidth }}
                                className="rounded-2xl bg-[#f2f2f2] p-3"
                            >
                                <Image
                                    source={service.image}
                                    resizeMode="cover"
                                    style={{ width: "100%", height: 112 }}
                                    className="rounded-sm"
                                />

                                <Text
                                    className="mt-2 text-[15px] text-black"
                                    style={{ fontFamily: "Jakarta-Bold" }}
                                >
                                    {service.title}
                                </Text>
                                <Text className="mt-1 text-[14px] text-black">
                                    Giá: {service.price}
                                </Text>

                                <TouchableOpacity
                                    accessibilityRole="button"
                                    onPress={goToBooking}
                                    className="mt-3 self-end rounded-full bg-[#a9e1ff] px-5 py-3"
                                >
                                    <Text className="text-[14px] text-black font-bold">
                                        Đặt ngay
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View className="mt-3 bg-white px-4 py-4">
                    <Text className="mb-3 text-[27px] text-black font-bold">
                        Các loại dịch vụ
                    </Text>

                    <View className="flex-row gap-3">
                        {serviceCategories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                accessibilityRole="button"
                                onPress={() => router.push("/(tabs)/(CustomerTab)/service")}
                                className="min-h-[145px] flex-1 items-center justify-center rounded-xl bg-[#2795c8] px-2 py-4"
                            >
                                <Text className="text-[38px]">{category.icon}</Text>
                                <Text className="mt-3 text-center text-[14px] text-white">
                                    {category.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="h-5" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default HomeScreen;
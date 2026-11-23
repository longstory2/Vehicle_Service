import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Keyboard, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { icons } from "../constants/icon";

const tabs = [
    { name: "home", label: "Trang chủ", icon: icons.home, href: "/(tabs)/(CustomerTab)/home" },
    { name: "service", label: "Dịch vụ", icon: icons.service, href: "/(tabs)/(CustomerTab)/service" },
    { name: "history", label: "Lịch sử", icon: icons.history, href: "/(tabs)/(CustomerTab)/history" },
    { name: "account", label: "Tài khoản", icon: icons.profile, href: "/(tabs)/(CustomerTab)/account" },
] as const;

type CustomerTabBarProps = {
    activeTab: (typeof tabs)[number]["name"];
};

const CustomerTabBar = ({ activeTab }: CustomerTabBarProps) => {
    const insets = useSafeAreaInsets();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
            setIsKeyboardVisible(true);
        });
        const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    if (isKeyboardVisible) return null;

    return (
        <View
            className="min-h-16 flex-row items-center border-t border-[#D9D9D9] bg-white"
            style={{ paddingBottom: insets.bottom }}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.name;

                return (
                    <Pressable
                        key={tab.name}
                        accessibilityRole="button"
                        accessibilityState={isActive ? { selected: true } : {}}
                        accessibilityLabel={tab.label}
                        onPress={() => {
                            if (!isActive) router.replace(tab.href);
                        }}
                        className="h-16 flex-1 items-center justify-center gap-[3px]"
                    >
                        <Image
                            source={tab.icon}
                            resizeMode="contain"
                            className={`h-6 w-6 ${isActive ? "tint-[#4A9CCF]" : "tint-[#777777]"}`}
                        />
                        <Text
                            className={`text-[11px] leading-[14px] ${
                                isActive
                                    ? "font-semibold text-[#4A9CCF]"
                                    : "text-[#777777]"
                            }`}
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

export default CustomerTabBar;

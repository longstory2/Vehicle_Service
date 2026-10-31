import { Stack, Tabs } from "expo-router";
import { Image, View, type ImageSourcePropType } from "react-native";
import { icons } from "../../../../constants/icon";
const TabIcon = ({ source }: { source: ImageSourcePropType }) => (
    <View>
        <View>
            <Image source={source} className="w-7 h-7" />
        </View>
    </View>
)
const TabLayout = () => (
    <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
            name="home"
            options={{
                title: 'Trang chủ',
                tabBarIcon: () => <TabIcon source={icons.home} />
            }} />
        <Tabs.Screen name="service" options={{
            title: 'Dịch vụ',
            tabBarIcon: () => <TabIcon source={icons.service} />
        }} />
        <Tabs.Screen name="history" options={{
            title: 'Lịch sử',
            tabBarIcon: () => <TabIcon source={icons.history} />
        }} />

        <Tabs.Screen name="book" options={{
            title: 'Đơn đặt',
            tabBarStyle: { display: "none" },

        }} />
        <Tabs.Screen name="bill" options={{
            title: 'Hóa đơn',
            tabBarStyle: { display: "none" },
        }} />
        <Tabs.Screen name="account" options={{
            title: 'Tài khoản',
            tabBarIcon: () => <TabIcon source={icons.profile} />
        }} />
    </Tabs>
)

export default TabLayout
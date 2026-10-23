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
        <Tabs.Screen name="book" options={{
            title: 'Đơn đặt',
            tabBarStyle: { display: "none" },
            tabBarIcon: () => <TabIcon source={icons.book} />
        }} />
        <Tabs.Screen name="account" options={{
            title: 'Tài khoản',
            tabBarIcon: () => <TabIcon source={icons.profile} />
        }} />
        {/* <Tabs.Screen
            name="bill"
            options={{
                title: "Hóa đơn",
                tabBarIcon: () => <TabIcon source={icons.payment} />,
            }}
        /> */}
    </Tabs>
)

export default TabLayout
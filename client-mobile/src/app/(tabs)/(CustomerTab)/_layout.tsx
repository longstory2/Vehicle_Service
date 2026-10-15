import { Tabs } from "expo-router";

const TabLayout = () => (
    <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" options={{ title: 'Trang chủ' }} />
        <Tabs.Screen name="service" options={{ title: 'Dịch vụ' }} />
        <Tabs.Screen name="book" options={{ title: 'Đơn đặt' }} />
        <Tabs.Screen name="account" options={{ title: 'Tài khoản' }} />
    </Tabs>
)

export default TabLayout
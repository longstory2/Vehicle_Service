import { Tabs } from "expo-router";

const TabLayout = () => (
    <Tabs
        screenOptions={{
            headerShown: false,
        }}
        tabBar={() => null}
    >
        <Tabs.Screen
            name="home"
            options={{
                title: "Trang chủ",
            }}
        />
        <Tabs.Screen
            name="service"
            options={{
                title: "Dịch vụ",
            }}
        />
        <Tabs.Screen
            name="history"
            options={{
                title: "Lịch sử",
            }}
        />
        <Tabs.Screen
            name="account"
            options={{
                title: "Tài khoản",
            }}
        />

        <Tabs.Screen
            name="book"
            options={{
                title: "Đơn đặt",
                tabBarStyle: { display: "none" },
            }}
        />
        <Tabs.Screen
            name="bill"
            options={{
                title: "Hóa đơn",
                tabBarStyle: { display: "none" },
            }}
        />
    </Tabs>
);

export default TabLayout;

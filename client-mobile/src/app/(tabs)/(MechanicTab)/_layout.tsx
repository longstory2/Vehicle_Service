import { Tabs } from "expo-router";

const TabLayout = () => (
    <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="haveBook" />
        <Tabs.Screen name="setting" />
    </Tabs>
)

export default TabLayout
import { Tabs } from "expo-router";

const TabLayout = () => (
    <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" options={{ href: null, }} />
        <Tabs.Screen name="haveBook" options={{ href: null, }} />
        <Tabs.Screen name="setting" options={{ href: null, }} />
    </Tabs>
)

export default TabLayout
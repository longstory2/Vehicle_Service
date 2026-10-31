import { Stack, Tabs } from "expo-router";

const TabLayout = () => (
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="havebook" />
        <Stack.Screen name="history" />
        <Stack.Screen name="bill" />
    </Stack>
)

export default TabLayout
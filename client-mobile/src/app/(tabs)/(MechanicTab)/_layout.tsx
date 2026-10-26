import { Tabs } from "expo-router";
import { useAudioPlayer } from "expo-audio";
const TabLayout = () => (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="haveBook" />
        <Tabs.Screen name="setting" />
    </Tabs>
)

export default TabLayout
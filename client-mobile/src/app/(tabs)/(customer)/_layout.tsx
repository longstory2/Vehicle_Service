import { Tabs } from "expo-router"

const TabLayout = () => {
  <Tabs screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="home" options={{ title: 'Home' }} />
    <Tabs.Screen name="home" options={{ title: 'Home' }} />
    <Tabs.Screen name="home" options={{ title: 'Home' }} />
  </Tabs>
}

export default TabLayout;
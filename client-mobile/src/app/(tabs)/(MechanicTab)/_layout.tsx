import { Tabs } from "expo-router";
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
        <Tabs.Screen name="home" />
        <Tabs.Screen name="haveBook" />
        <Tabs.Screen name="setting" />
    </Tabs>
)

export default TabLayout
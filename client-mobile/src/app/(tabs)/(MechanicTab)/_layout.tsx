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
        <Tabs.Screen name="home" options={{ title: 'Trang chủ' }} />
        <Tabs.Screen name="haveBook" options={{ title: 'Đơn đặt' }} />
        <Tabs.Screen name="setting" options={{ title: 'Tài khoản' }} />
    </Tabs>
)

export default TabLayout
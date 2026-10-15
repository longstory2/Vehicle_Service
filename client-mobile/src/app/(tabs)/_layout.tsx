import { Stack } from "expo-router";

const Layout = () => {
    return (
        <Stack>
            <Stack.Screen name="(CustomerTab)" options={{ headerShown: false }} />
            <Stack.Screen name="(MechanicTab)" options={{ headerShown: false }} />
        </Stack>
    )
};

export default Layout
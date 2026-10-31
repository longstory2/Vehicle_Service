import { Image, Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { router } from "expo-router";
import { icons } from "../constants/icon";

type BackButtonProps = {
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
};

const BackButton = ({
    onPress = () => router.back(),
    style,
    accessibilityLabel = "Quay lại",
}: BackButtonProps) => (
    <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        onPress={onPress}
        style={[styles.button, style]}
    >
        <Image source={icons.backarrow} style={styles.icon} resizeMode="contain" />
    </Pressable>
);

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "#f5f5f5",
    },
    icon: {
        width: 24,
        height: 24,
    },
});

export default BackButton;

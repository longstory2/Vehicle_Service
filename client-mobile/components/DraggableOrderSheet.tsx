import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
    Animated,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type DraggableOrderSheetProps = {
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
    screenHeight: number;
    compactContent: ReactNode;
    children: ReactNode;
    swipeEnabled?: boolean;
};

const DraggableOrderSheet = ({
    expanded,
    onExpandedChange,
    screenHeight,
    compactContent,
    children,
    swipeEnabled = false,
}: DraggableOrderSheetProps) => {
    const collapsedHeight = 174;
    const expandedHeight = Math.max(560, screenHeight * 0.9);
    const [sheetHeight] = useState(
        () => new Animated.Value(expanded ? expandedHeight : collapsedHeight),
    );
    const currentHeight = useRef(expanded ? expandedHeight : collapsedHeight);
    const gestureStartHeight = useRef(expanded ? expandedHeight : collapsedHeight);

    useEffect(() => {
        const listenerId = sheetHeight.addListener(({ value }) => {
            currentHeight.current = value;
        });
        return () => sheetHeight.removeListener(listenerId);
    }, [sheetHeight]);

    useEffect(() => {
        const targetHeight = expanded ? expandedHeight : collapsedHeight;
        Animated.spring(sheetHeight, {
            toValue: targetHeight,
            damping: 22,
            mass: 0.8,
            stiffness: 180,
            useNativeDriver: false,
        }).start();
    }, [collapsedHeight, expanded, expandedHeight, sheetHeight]);

    const handlePanResponderRelease = useCallback(
        (_: unknown, gesture: { dy: number; vy: number }) => {
            const shouldExpand =
                gesture.dy < -24 ||
                (gesture.dy <= 0 && gesture.vy < -0.5);
            const shouldCollapse =
                gesture.dy > 24 ||
                (gesture.dy >= 0 && gesture.vy > 0.5);

            if (shouldExpand) onExpandedChange(true);
            else if (shouldCollapse) onExpandedChange(false);
            else onExpandedChange(currentHeight.current > (collapsedHeight + expandedHeight) / 2);
        },
        [collapsedHeight, expandedHeight, onExpandedChange],
    );
    const handlePanResponderGrant = useCallback(() => {
        sheetHeight.stopAnimation((value) => {
            currentHeight.current = value;
            gestureStartHeight.current = value;
        });
    }, [sheetHeight]);
    const handlePanResponderMove = useCallback(
        (_: unknown, gesture: { dy: number }) => {
            const nextHeight = Math.max(
                collapsedHeight,
                Math.min(expandedHeight, gestureStartHeight.current - gesture.dy),
            );
            sheetHeight.setValue(nextHeight);
        },
        [collapsedHeight, expandedHeight, sheetHeight],
    );
    const panResponder = useMemo(
        () =>
            // PanResponder invokes these callbacks only in response to touch events.
            // eslint-disable-next-line react-hooks/refs
            PanResponder.create({
                onPanResponderGrant: handlePanResponderGrant,
                onMoveShouldSetPanResponder: (_, gesture) =>
                    swipeEnabled &&
                    Math.abs(gesture.dy) > 5 &&
                    Math.abs(gesture.dy) > Math.abs(gesture.dx),
                onPanResponderMove: handlePanResponderMove,
                onPanResponderRelease: handlePanResponderRelease,
            }),
        [
            handlePanResponderGrant,
            handlePanResponderMove,
            handlePanResponderRelease,
            swipeEnabled,
        ],
    );

    return (
        <Animated.View
            style={[
                styles.sheet,
                { height: swipeEnabled ? sheetHeight : expanded ? expandedHeight : collapsedHeight },
            ]}
        >
            {swipeEnabled ? (
                <View

                    style={styles.handleArea}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.handle} />
                </View>
            ) : (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={expanded ? "Thu gọn chi tiết đơn" : "Mở chi tiết đơn"}
                    onPress={() => onExpandedChange(!expanded)}
                    style={styles.handleArea}
                >
                    <View style={styles.handle} />
                    <Text style={styles.handleHint}>
                        {expanded ? "Ấn để thu gọn" : "Ấn để xem chi tiết"}
                    </Text>
                </Pressable>
            )}

            {compactContent}

            {expanded ? (
                <ScrollView
                    bounces={false}
                    contentContainerStyle={styles.details}
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </ScrollView>
            ) : null}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sheet: {
        position: "absolute",
        right: 0,
        bottom: 0,
        left: 0,
        overflow: "hidden",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        backgroundColor: "#ffffff",
        paddingBottom: 22,
        elevation: 12,
    },
    handleArea: {
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 10,
    },
    handle: {
        width: 72,
        height: 5,
        borderRadius: 3,
        backgroundColor: "#858585",
    },
    handleHint: {
        marginTop: 5,
        color: "#858585",
        fontSize: 11,
    },
    details: {
        paddingHorizontal: 22,
        paddingTop: 14,
        paddingBottom: 22,
    },
});

export default DraggableOrderSheet;

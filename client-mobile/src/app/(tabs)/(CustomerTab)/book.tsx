import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { bookingPreview } from "../../../../constants/data";
import LeafletMap from "../../../../components/LeafletMap";

const BookScreen = () => {
    const { height } = useWindowDimensions();
    const [pickupAddress, setPickupAddress] = useState(bookingPreview.pickupAddress);
    const [selectedOption, setSelectedOption] = useState("cash");
    const mapHeight = height * 0.56;

    return (
        <View style={styles.screen}>
            <View style={[styles.mapStage, { height: mapHeight }]}>
                <LeafletMap />
                <SafeAreaView
                    edges={["top"]}
                    pointerEvents="box-none"
                    style={styles.mapControls}
                >
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Quay lại"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Text style={styles.backArrow}>←</Text>
                    </Pressable>
                    <View style={styles.addressField}>
                        <View style={styles.locationIcon}>
                            <View style={styles.locationDot} />
                        </View>
                        <TextInput
                            accessibilityLabel="Địa chỉ điểm đón"
                            onChangeText={setPickupAddress}
                            placeholder="Vị trí của bạn"
                            placeholderTextColor="#858585"
                            value={pickupAddress}
                            style={styles.addressInput}
                        />
                    </View>
                </SafeAreaView>
            </View>

            <SafeAreaView edges={["bottom"]} style={styles.bottomSheet}>
                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.detailsContent}
                    style={styles.detailsScroll}
                >
                    <View style={styles.sheetHandle} />
                    <InfoSection title="Thông tin xe" rows={bookingPreview.vehicleInfo} />
                    <View style={styles.sectionDivider} />
                    <InfoSection title="Mô tả dịch vụ" rows={bookingPreview.serviceInfo} />
                </ScrollView>

                <View style={styles.orderFooter}>
                    <View style={styles.optionRow}>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setSelectedOption("cash")}
                            style={styles.optionButton}
                        >
                            <Text style={styles.optionIcon}>▰</Text>
                            <Text style={[styles.optionText, selectedOption === "cash" && styles.optionSelected]}>
                                Tiền mặt
                            </Text>
                        </Pressable>
                        <View style={styles.optionDivider} />
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setSelectedOption("offer")}
                            style={styles.optionButton}
                        >
                            <Text style={styles.optionIcon}>%</Text>
                            <Text style={[styles.optionText, selectedOption === "offer" && styles.optionSelected]}>
                                Ưu đãi
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.priceRow}>
                        <View style={styles.priceDetails}>
                            <Text style={styles.priceTitle}>Chi phí</Text>
                            <Text style={styles.priceEstimate}>
                                Ước tính: {bookingPreview.estimatedPrice.toLocaleString("vi-VN")} VND
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => Alert.alert("Đặt đơn", `Điểm đón: ${pickupAddress}`)}
                            style={styles.orderButton}
                        >
                            <Text style={styles.orderButtonText}>Đặt đơn</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

type InfoRow = { label: string; value: string };

const InfoSection = ({ title, rows }: { title: string; rows: InfoRow[] }) => (
    <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rows.map((row) => (
            <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#eeeeee",
    },
    mapStage: {
        position: "relative",
        backgroundColor: "#e8e5dc",
    },
    mapControls: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 12,
    },
    backButton: {
        width: 54,
        height: 54,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 27,
        backgroundColor: "#ffffff",
        elevation: 3,
    },
    backArrow: {
        color: "#111111",
        fontSize: 32,
        lineHeight: 36,
    },
    addressField: {
        height: 58,
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#3e3e3e",
        borderRadius: 17,
        backgroundColor: "#ffffff",
        paddingHorizontal: 12,
        elevation: 3,
    },
    locationIcon: {
        width: 28,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        borderRadius: 14,
        backgroundColor: "#393939",
    },
    locationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#ffffff",
    },
    addressInput: {
        flex: 1,
        padding: 0,
        color: "#333333",
        fontSize: 15,
        fontWeight: "600",
    },
    bottomSheet: {
        flex: 1,
        marginTop: -22,
        overflow: "hidden",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        backgroundColor: "#f4f4f4",
    },
    detailsContent: {
        paddingTop: 10,
        paddingBottom: 14,
    },
    detailsScroll: {
        flex: 1,
    },
    sheetHandle: {
        alignSelf: "center",
        width: 72,
        height: 5,
        marginBottom: 24,
        borderRadius: 3,
        backgroundColor: "#858585",
    },
    infoSection: {
        paddingHorizontal: 22,
        paddingBottom: 14,
    },
    sectionTitle: {
        marginBottom: 8,
        color: "#111111",
        fontSize: 18,
        fontWeight: "700",
    },
    infoRow: {
        minHeight: 30,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    infoLabel: {
        flex: 1,
        color: "#858585",
        fontSize: 16,
        fontWeight: "600",
    },
    infoValue: {
        flex: 1,
        color: "#111111",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "right",
    },
    sectionDivider: {
        height: 8,
        marginBottom: 10,
        backgroundColor: "#e7e7e7",
    },
    orderFooter: {
        borderTopWidth: 1,
        borderTopColor: "#e9e9e9",
        backgroundColor: "#f7f7f7",
        paddingHorizontal: 22,
        paddingTop: 10,
        paddingBottom: 8,
    },
    optionRow: {
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    optionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    optionIcon: {
        color: "#333333",
        fontSize: 23,
        fontWeight: "700",
    },
    optionText: {
        color: "#555555",
        fontSize: 16,
    },
    optionSelected: {
        color: "#222222",
        fontWeight: "600",
    },
    optionDivider: {
        width: 1,
        height: 34,
        marginHorizontal: 16,
        backgroundColor: "#d4d4d4",
    },
    priceRow: {
        minHeight: 78,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    priceDetails: {
        flex: 1,
    },
    priceTitle: {
        color: "#111111",
        fontSize: 17,
        fontWeight: "700",
    },
    priceEstimate: {
        marginTop: 3,
        color: "#38c98d",
        fontSize: 17,
        fontWeight: "700",
    },
    orderButton: {
        minWidth: 145,
        minHeight: 58,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
        backgroundColor: "#a9dfff",
        paddingHorizontal: 18,
    },
    orderButtonText: {
        color: "#111111",
        fontSize: 17,
        fontWeight: "700",
    },
});

export default BookScreen;
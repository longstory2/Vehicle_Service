import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageSourcePropType,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    Image,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
    bookingPreview,
    serviceCategories,
    serviceEstimatedPrices,
    spareParts,
    vehicleMakes,
    vehicleTypes,
} from "../../../../constants/data";
import LeafletMap from "../../../../components/LeafletMap";
import { icons } from "../../../../constants/icon";
const TabIcon = ({ source }: { source: ImageSourcePropType }) => (
    <View>
        <View>
            <Image source={source} className="w-6 h-6" />
        </View>
    </View>
)
type BookingParams = {
    categoryId?: string | string[];
    vehicleTypeId?: string | string[];
    vehicleMakeId?: string | string[];
    plate?: string | string[];
    sparePartId?: string | string[];
    mileage?: string | string[];
    description?: string | string[];
    estimatedPrice?: string | string[];
};

type PickupLocation = {
    latitude: number;
    longitude: number;
    address: string;
};

type NominatimResult = {
    lat: string;
    lon: string;
    display_name: string;
};

const readParam = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] ?? "" : value ?? "";

const BookScreen = () => {
    const params = useLocalSearchParams<BookingParams>();
    const categoryId = readParam(params.categoryId);
    const vehicleTypeId = readParam(params.vehicleTypeId);
    const vehicleMakeId = readParam(params.vehicleMakeId);
    const plate = readParam(params.plate);
    const sparePartId = readParam(params.sparePartId);
    const mileage = readParam(params.mileage);
    const description = readParam(params.description);
    const routePrice = readParam(params.estimatedPrice);
    const selectedCategory = serviceCategories.find((item) => item.id === categoryId);
    const selectedSparePart = spareParts.find((item) => item.id === sparePartId);
    const selectedPrice = Number(routePrice);
    const estimatedPrice = routePrice !== "" && Number.isFinite(selectedPrice)
        ? selectedPrice
        : selectedSparePart?.estimatedPrice
        ?? serviceEstimatedPrices[categoryId]
        ?? bookingPreview.estimatedPrice;

    const vehicleRows = [
        {
            label: "Loại xe",
            value: vehicleTypes.find((item) => item.id === vehicleTypeId)?.label
                ?? bookingPreview.vehicleInfo[0].value,
        },
        {
            label: "Hãng xe",
            value: vehicleMakes.find((item) => item.id === vehicleMakeId)?.label
                ?? bookingPreview.vehicleInfo[1].value,
        },
        {
            label: "Biển số xe",
            value: plate || bookingPreview.vehicleInfo[2].value,
        },
    ];
    const serviceRows = [
        { label: "Loại dịch vụ", value: selectedCategory?.title ?? bookingPreview.serviceInfo[0].value },
        ...(selectedSparePart ? [{ label: "Phụ tùng", value: selectedSparePart.label }] : []),
        ...(mileage ? [{ label: "Số Km hiện tại", value: `${mileage} km` }] : []),
        { label: "Mô tả", value: description || "Chưa có mô tả" },
    ];
    const { height } = useWindowDimensions();
    const [pickupAddress, setPickupAddress] = useState("");
    const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
    const [locationError, setLocationError] = useState("");
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [selectedOption, setSelectedOption] = useState("cash");
    const lastSearchAt = useRef(0);
    const mapHeight = height * 0.56;

    // Chỉ tra cứu khi khách chủ động bấm Tìm hoặc gửi từ bàn phím.
    const searchPickupLocation = async () => {
        const query = pickupAddress.trim();
        if (!query) {
            setLocationError("Nhập địa chỉ hoặc tên địa điểm trước khi tìm.");
            return;
        }
        if (Date.now() - lastSearchAt.current < 1000) {
            setLocationError("Vui lòng chờ một giây trước khi tìm địa chỉ tiếp theo.");
            return;
        }

        lastSearchAt.current = Date.now();
        setIsSearchingLocation(true);
        setLocationError("");
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&accept-language=vi&q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "Accept-Language": "vi",
                    "User-Agent": "VehicleServiceMobile/1.0",
                },
            });

            if (!response.ok) {
                throw new Error(`Geocoding request failed: ${response.status}`);
            }

            const results: NominatimResult[] = await response.json();
            const result = results[0];
            if (!result) {
                setPickupLocation(null);
                setLocationError("Không tìm thấy địa chỉ. Hãy thử nhập tên đường, phường hoặc quận.");
                return;
            }

            const latitude = Number(result.lat);
            const longitude = Number(result.lon);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                throw new Error("Geocoding returned invalid coordinates");
            }

            setPickupAddress(result.display_name);
            setPickupLocation({ latitude, longitude, address: result.display_name });
        } catch {
            setPickupLocation(null);
            setLocationError("Không thể tìm địa chỉ lúc này. Kiểm tra kết nối rồi thử lại.");
        } finally {
            setIsSearchingLocation(false);
        }
    };

    const requestCurrentLocation = () => {
        // TODO: Tự tích hợp expo-location, xin quyền GPS rồi cập nhật pickupLocation.
        Alert.alert("Định vị GPS", "Tích hợp lấy tọa độ thiết bị tại handler này.");
    };

    const submitBooking = () => {
        if (!pickupLocation) {
            Alert.alert("Chưa chọn điểm đón", "Nhập địa chỉ rồi bấm Tìm để hiển thị vị trí trên bản đồ.");
            return;
        }

        Alert.alert(
            "Đặt đơn",
            `Điểm đón: ${pickupLocation.address}\nTọa độ: ${pickupLocation.latitude}, ${pickupLocation.longitude}`,
        );
    };

    return (
        <View style={styles.screen}>
            <View style={[styles.mapStage, { height: mapHeight }]}>
                <LeafletMap location={pickupLocation} />
                <SafeAreaView
                    edges={["top"]}
                    pointerEvents="box-none"
                    style={styles.mapControls}
                >
                    <View style={styles.searchRow}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Quay lại"
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Text style={styles.backArrow}>←</Text>
                        </Pressable>
                        <View style={styles.addressField}>
                            <View>
                                <TabIcon source={icons.location} />
                            </View>
                            <TextInput
                                accessibilityLabel="Địa chỉ điểm đón"
                                editable={!isSearchingLocation}
                                onChangeText={(value) => {
                                    setPickupAddress(value);
                                    setPickupLocation(null);
                                    setLocationError("");
                                }}
                                onSubmitEditing={() => void searchPickupLocation()}
                                returnKeyType="search"
                                placeholder="Nhập vị trí của bạn"
                                placeholderTextColor="#858585"
                                value={pickupAddress}
                                style={styles.addressInput}
                            />
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Tìm địa chỉ trên bản đồ"
                            disabled={isSearchingLocation}
                            onPress={() => void searchPickupLocation()}
                            style={styles.searchButton}
                        >
                            {isSearchingLocation ? (
                                <ActivityIndicator color="#16835d" />
                            ) : (
                                <Text style={styles.searchButtonText}>Tìm</Text>
                            )}
                        </Pressable>
                    </View>
                    {locationError ? (
                        <Text accessibilityRole="alert" style={styles.locationError}>
                            {locationError}
                        </Text>
                    ) : null}
                </SafeAreaView>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Định vị vị trí hiện tại bằng GPS"
                    onPress={requestCurrentLocation}
                    style={styles.locateButton}
                >
                    <Text style={styles.locateIcon}>◎</Text>
                </Pressable>
            </View>

            <SafeAreaView edges={["bottom"]} style={styles.bottomSheet}>
                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.detailsContent}
                    style={styles.detailsScroll}
                >
                    <View style={styles.sheetHandle} />
                    <InfoSection title="Thông tin xe" rows={vehicleRows} />
                    <View style={styles.sectionDivider} />
                    <InfoSection title="Mô tả dịch vụ" rows={serviceRows} />
                </ScrollView>

                <View style={styles.orderFooter}>
                    <View style={styles.optionRow}>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setSelectedOption("cash")}
                            style={styles.optionButton}
                        >
                            <TabIcon source={icons.payment} />
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
                            <TabIcon source={icons.sale} />
                            <Text style={[styles.optionText, selectedOption === "offer" && styles.optionSelected]}>
                                Ưu đãi
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.priceRow}>
                        <View style={styles.priceDetails}>
                            <Text style={styles.priceTitle}>Chi phí</Text>
                            <Text style={styles.priceEstimate}>
                                Ước tính: {estimatedPrice.toLocaleString("vi-VN")} VND
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            onPress={submitBooking}
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
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    backButton: {
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
        backgroundColor: "#ffffff",
        elevation: 3,
    },
    backArrow: {
        color: "#111111",
        fontSize: 30,
        lineHeight: 34,
    },
    addressField: {
        height: 54,
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#3e3e3e",
        borderRadius: 16,
        backgroundColor: "#ffffff",
        paddingHorizontal: 10,
        elevation: 3,
    },
    locationIcon: {
        width: 28,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
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
        fontSize: 14,
        fontWeight: "600",
    },
    searchButton: {
        minWidth: 52,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: "#e8f5ef",
    },
    searchButtonText: {
        color: "#16835d",
        fontSize: 14,
        fontWeight: "700",
    },
    locationError: {
        marginTop: 8,
        borderRadius: 10,
        backgroundColor: "#ffffff",
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: "#b42318",
        fontSize: 13,
    },
    locateButton: {
        position: "absolute",
        right: 18,
        bottom: 38,
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
        backgroundColor: "#ffffff",
        elevation: 4,
    },
    locateIcon: {
        color: "#16835d",
        fontSize: 31,
        lineHeight: 35,
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
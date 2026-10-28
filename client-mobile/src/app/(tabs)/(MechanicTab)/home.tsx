import { useAuth } from "../../../../context/AuthContext";
import { Redirect, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../../utils/api";
import { ActivityIndicator, Alert, ImageSourcePropType, Pressable, StyleSheet, Text, TextInput, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LeafletMap from "../../../../components/LeafletMap";
import { icons } from "../../../../constants/icon";

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

type QuickActionProps = {
    icon: ImageSourcePropType;
    label: string;
    onPress: () => void;
};

const QuickAction = ({ icon, label, onPress }: QuickActionProps) => (
    <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={styles.quickAction}
    >
        <View style={styles.quickActionIconBox}>
            <Image source={icon} style={styles.quickActionIconImage} resizeMode="contain" />
        </View>
        <Text numberOfLines={1} style={styles.quickActionLabel}>
            {label}
        </Text>
    </Pressable>
);

const MechanicHome = () => {
    const { isLoaded, isSignedIn, user } = useAuth();
    const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
    const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
    const [pickupAddress, setPickupAddress] = useState("");
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [locationError, setLocationError] = useState("");
    const lastSearchAt = useRef(0);
    const toggleAvailability = async () => {
        const nextValue = !isAcceptingOrders;

        try {
            const result = await apiRequest<{ isAcceptingOrders: boolean }>(
                "/technicians/availability",
                {
                    method: "PUT",
                    body: { isAcceptingOrders: nextValue },
                }
            );

            setIsAcceptingOrders(result.isAcceptingOrders);
        } catch (error) {
            Alert.alert(
                "Không đổi được trạng thái",
                error instanceof Error ? error.message : "Vui lòng thử lại."
            );
        }
    };
    // Tìm địa chỉ chỉ khi người dùng bấm nút hoặc gửi từ bàn phím.
    const searchPickupLocation = async () => {
        const query = pickupAddress.trim();
        if (!query) {
            setLocationError("Nhập địa chỉ hoặc tên địa điểm trước khi tìm.");
            return;
        }

        // Nominatim giới hạn tần suất truy vấn, nên chặn tìm liên tiếp quá nhanh.
        if (Date.now() - lastSearchAt.current < 1000) {
            setLocationError("Vui lòng chờ một giây rồi thử tìm lại.");
            return;
        }

        lastSearchAt.current = Date.now();
        setIsSearchingLocation(true);
        setLocationError("");

        try {
            const url =
                `https://nominatim.openstreetmap.org/search?format=jsonv2` +
                `&limit=1&countrycodes=vn&accept-language=vi&q=${encodeURIComponent(query)}`;

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
                setLocationError("Không tìm thấy địa chỉ. Hãy thử nhập tên đường hoặc quận.");
                return;
            }

            const latitude = Number(result.lat);
            const longitude = Number(result.lon);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                throw new Error("Geocoding returned invalid coordinates");
            }

            setPickupAddress(result.display_name);
            setPickupLocation({
                latitude,
                longitude,
                address: result.display_name,
            });
        } catch {
            setPickupLocation(null);
            setLocationError("Không thể tìm địa chỉ lúc này. Kiểm tra mạng rồi thử lại.");
        } finally {
            setIsSearchingLocation(false);
        }
    };

    const requestCurrentLocation = () => {
        // TODO: Tích hợp expo-location và xin quyền GPS để lấy vị trí thiết bị.
        Alert.alert("Định vị GPS", "Tích hợp lấy tọa độ thiết bị tại handler này.");
    };

    const openOrders = () => {
        router.push("/(tabs)/(MechanicTab)/haveBook");
    };

    const openSettings = () => {
        router.push("/(tabs)/(MechanicTab)/setting");
    };

    if (!isLoaded) {
        return null;
    }

    if (!isSignedIn || !user) {
        return <Redirect href="/(auth)/welcome" />;
    }

    if (user.role !== "technician") {
        return <Redirect href="/(tabs)/(CustomerTab)/home" />;
    }

    useEffect(() => {
        let isMounted = true;

        apiRequest<{ isAcceptingOrders: boolean }>("/technicians/availability")
            .then((data) => {
                if (isMounted) {
                    setIsAcceptingOrders(data.isAcceptingOrders);
                }
            })
            .catch((error) => {
                Alert.alert(
                    "Không tải được trạng thái",
                    error instanceof Error ? error.message : "Vui lòng thử lại."
                );
            });

        return () => {
            isMounted = false;
        };
    }, []);
    return (
        <View style={styles.screen}>
            <View style={StyleSheet.absoluteFill}>
                <LeafletMap location={pickupLocation} />
            </View>

            <SafeAreaView
                edges={["top"]}
                pointerEvents="box-none"
                style={styles.overlay}
            >
                <View>
                    <View style={styles.searchRow}>
                        <View style={styles.addressField}>
                            <View style={styles.locationIcon}>
                                <View style={styles.locationDot} />
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
                                placeholder="Nhập vị trí cần tìm"
                                placeholderTextColor="#858585"
                                returnKeyType="search"
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
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Định vị vị trí hiện tại bằng GPS"
                    onPress={requestCurrentLocation}
                    style={styles.locateButton}
                >
                    <Text style={styles.locateIcon}>◎</Text>
                </Pressable>

                <View style={styles.bottomControls}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                            isAcceptingOrders ? "Tắt nhận đơn" : "Bật nhận đơn"
                        }
                        onPress={() => void toggleAvailability()}
                        style={styles.statusCard}
                    >
                        <View
                            style={[
                                styles.statusDot,
                                isAcceptingOrders
                                    ? styles.statusDotOn
                                    : styles.statusDotOff,
                            ]}
                        />
                        <Text style={styles.statusText}>
                            {isAcceptingOrders
                                ? "Đang bật nhận đơn"
                                : "Đang tắt nhận đơn"}
                        </Text>
                    </Pressable>

                    <View style={styles.quickActionsPanel}>
                        <QuickAction
                            icon={icons.power}
                            label={isAcceptingOrders ? "Tắt nhận đơn" : "Bật nhận đơn"}
                            onPress={() => void toggleAvailability()}
                        />
                        <QuickAction icon={icons.book} label="Đơn đặt" onPress={openOrders} />
                        <QuickAction
                            icon={icons.history}
                            label="Lịch sử"
                            // Hiện chưa có route lịch sử riêng, tạm mở danh sách đơn.
                            onPress={openOrders}
                        />
                        <QuickAction icon={icons.setting} label="Cài đặt" onPress={openSettings} />
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    quickActionIconImage: {
        width: 32,
        height: 32,
    },
    screen: {
        flex: 1,
        backgroundColor: "#e8e5dc",
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingBottom: 16,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    addressField: {
        height: 52,
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 14,
        backgroundColor: "#ffffff",
        paddingHorizontal: 12,
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
        right: 4,
        bottom: 178,
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
    bottomControls: {
        gap: 12,
    },
    statusCard: {
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 14,
        backgroundColor: "#ffffff",
        paddingHorizontal: 18,
        elevation: 4,
    },
    statusDot: {
        width: 13,
        height: 13,
        marginRight: 12,
        borderRadius: 7,
    },
    statusDotOn: {
        backgroundColor: "#00d94b",
    },
    statusDotOff: {
        backgroundColor: "#ff2020",
    },
    statusText: {
        color: "#111111",
        fontSize: 16,
        fontWeight: "700",
    },
    quickActionsPanel: {
        minHeight: 116,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        borderRadius: 18,
        backgroundColor: "#ffffff",
        paddingHorizontal: 6,
        paddingVertical: 12,
        elevation: 5,
    },
    quickAction: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    quickActionIconBox: {
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
        backgroundColor: "#f3f3f3",
    },
    quickActionIcon: {
        color: "#111111",
        fontSize: 29,
    },
    quickActionLabel: {
        color: "#111111",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
    },
});

export default MechanicHome;
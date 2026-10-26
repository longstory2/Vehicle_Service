import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../../../../utils/api";

type Customer = {
    fullName: string;
    phone?: string;
};

type Order = {
    _id: string;
    customerId: Customer;
    serviceDetails: {
        category?: string;
        serviceName?: string;
        sparePart?: string;
        vehicleType?: string;
        vehicleMake?: string;
        plate?: string;
        mileage?: string;
        description?: string;
    };
    address: string;
    estimatedPrice: number;
    createdAt: string;
    offerExpiresAt: string;
};

const HaveBookScreen = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [now, setNow] = useState(Date.now());
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [workingId, setWorkingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const loading = useRef(false);

    const loadOrders = useCallback(
        async () => {
            if (loading.current) return;

            loading.current = true;
            setErrorMessage("");

            try {
                const data = await apiRequest<Order[]>("/orders/available");
                setOrders(data);
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Không tải được danh sách đơn."
                );
            } finally {
                loading.current = false;
                setIsLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useFocusEffect(
        useCallback(() => {
            void loadOrders();

            const pollTimer = setInterval(() => {
                void loadOrders();
            }, 5000);

            const countdownTimer = setInterval(() => {
                setNow(Date.now());
            }, 1000);

            return () => {
                clearInterval(pollTimer);
                clearInterval(countdownTimer);
            };
        }, [loadOrders])
    );

    const refresh = () => {
        setRefreshing(true);
        void loadOrders();
    };

    const acceptOrder = async (orderId: string) => {
        setWorkingId(orderId);

        try {
            await apiRequest(`/orders/${orderId}/accept`, { method: "PUT" });
            setOrders((current) => current.filter((order) => order._id !== orderId));
            Alert.alert("Đã nhận đơn", "Đơn hàng đã được giao cho bạn.");
            void loadOrders();
        } catch (error) {
            Alert.alert(
                "Không nhận được đơn",
                error instanceof Error ? error.message : "Vui lòng tải lại danh sách."
            );
            void loadOrders();
        } finally {
            setWorkingId(null);
        }
    };

    const rejectOrder = async (orderId: string) => {
        setWorkingId(orderId);

        try {
            await apiRequest(`/orders/${orderId}/reject`, { method: "PUT" });
            setOrders((current) => current.filter((order) => order._id !== orderId));
        } catch (error) {
            Alert.alert(
                "Không từ chối được đơn",
                error instanceof Error ? error.message : "Vui lòng tải lại danh sách."
            );
            void loadOrders();
        } finally {
            setWorkingId(null);
        }
    };

    const visibleOrders = orders.filter(
        (order) => Date.parse(order.offerExpiresAt) > now
    );

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Đang tải đơn hàng...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Đơn đang chờ</Text>

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <FlatList
                data={visibleOrders}
                keyExtractor={(item) => item._id}
                contentContainerStyle={
                    visibleOrders.length === 0 ? styles.emptyList : undefined
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                }
                ListEmptyComponent={
                    <Text style={styles.muted}>Hiện chưa có đơn nào đang chờ.</Text>
                }
                renderItem={({ item }) => {
                    const details = item.serviceDetails;
                    const secondsLeft = Math.max(
                        0,
                        Math.ceil((Date.parse(item.offerExpiresAt) - now) / 1000)
                    );
                    const isWorking = workingId === item._id;

                    return (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>
                                {details.category || details.serviceName || "Yêu cầu dịch vụ"}
                            </Text>

                            <Text>
                                Khách hàng: {item.customerId?.fullName ?? "Khách hàng"}
                            </Text>
                            {item.customerId?.phone ? (
                                <Text>Số điện thoại: {item.customerId.phone}</Text>
                            ) : null}
                            <Text>Địa chỉ: {item.address}</Text>

                            {details.vehicleType || details.vehicleMake ? (
                                <Text>
                                    Xe: {[details.vehicleType, details.vehicleMake]
                                        .filter(Boolean)
                                        .join(" - ")}
                                </Text>
                            ) : null}

                            {details.plate ? <Text>Biển số: {details.plate}</Text> : null}
                            {details.description ? (
                                <Text>Mô tả: {details.description}</Text>
                            ) : null}

                            <Text style={styles.price}>
                                Ước tính: {item.estimatedPrice.toLocaleString("vi-VN")} VND
                            </Text>

                            <Text style={styles.countdown}>
                                Thời gian xác nhận còn {secondsLeft} giây
                            </Text>

                            <View style={styles.buttonRow}>
                                <Pressable
                                    accessibilityRole="button"
                                    disabled={isWorking}
                                    onPress={() => void rejectOrder(item._id)}
                                    style={[styles.button, styles.rejectButton]}
                                >
                                    <Text style={styles.buttonText}>Từ chối</Text>
                                </Pressable>

                                <Pressable
                                    accessibilityRole="button"
                                    disabled={isWorking}
                                    onPress={() => void acceptOrder(item._id)}
                                    style={[styles.button, styles.acceptButton]}
                                >
                                    {isWorking ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Nhận đơn</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f7f8fa",
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    title: {
        marginBottom: 12,
        fontSize: 22,
        fontWeight: "700",
    },
    card: {
        gap: 8,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#fff",
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: "700",
    },
    muted: {
        color: "#666",
        textAlign: "center",
    },
    error: {
        marginBottom: 12,
        color: "#b00020",
    },
    price: {
        fontWeight: "700",
    },
    countdown: {
        color: "#b54708",
        fontWeight: "700",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 4,
    },
    button: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        borderRadius: 8,
    },
    acceptButton: {
        backgroundColor: "#16835d",
    },
    rejectButton: {
        backgroundColor: "#b42318",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: "center",
    },
});

export default HaveBookScreen;
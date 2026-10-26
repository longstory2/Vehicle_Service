import { useCallback, useState } from "react";
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
};

const HaveBookScreen = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const loadOrders = useCallback(async () => {
        setErrorMessage("");

        try {
            const data = await apiRequest<Order[]>("/orders/available");
            setOrders(data);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Không tải được danh sách đơn."
            );
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadOrders();
        }, [loadOrders])
    );

    const refresh = () => {
        setRefreshing(true);
        void loadOrders();
    };

    const acceptOrder = async (orderId: string) => {
        setAcceptingId(orderId);

        try {
            await apiRequest(`/orders/${orderId}/accept`, { method: "PUT" });
            Alert.alert("Đã nhận đơn", "Đơn hàng đã được giao cho bạn.");
            await loadOrders();
        } catch (error) {
            Alert.alert(
                "Không nhận được đơn",
                error instanceof Error ? error.message : "Vui lòng tải lại danh sách."
            );
            await loadOrders();
        } finally {
            setAcceptingId(null);
        }
    };

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

            {errorMessage ? (
                <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            <FlatList
                data={orders}
                keyExtractor={(item) => item._id}
                contentContainerStyle={orders.length === 0 ? styles.emptyList : undefined}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                }
                ListEmptyComponent={
                    <Text style={styles.muted}>Hiện chưa có đơn nào đang chờ.</Text>
                }
                renderItem={({ item }) => {
                    const details = item.serviceDetails;

                    return (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>
                                {details.category || details.serviceName || "Yêu cầu dịch vụ"}
                            </Text>

                            <Text>Khách hàng: {item.customerId?.fullName ?? "Khách hàng"}</Text>
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

                            <Pressable
                                accessibilityRole="button"
                                disabled={acceptingId === item._id}
                                onPress={() => void acceptOrder(item._id)}
                                style={styles.button}
                            >
                                {acceptingId === item._id ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Nhận đơn</Text>
                                )}
                            </Pressable>
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
    button: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        marginTop: 4,
        borderRadius: 8,
        backgroundColor: "#16835d",
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
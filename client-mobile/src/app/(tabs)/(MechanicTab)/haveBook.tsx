import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { apiRequest } from "../../../../utils/api";
import BackButton from "../../../../components/BackButton";
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
    const params = useLocalSearchParams<{ orderId?: string | string[] }>();
    const requestedOrderId = Array.isArray(params.orderId)
        ? params.orderId[0]
        : params.orderId;
    const [orders, setOrders] = useState<Order[]>([]);
    const [now, setNow] = useState(0);
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
                setNow(Date.now());
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
            router.replace("/(tabs)/(MechanicTab)/home");
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
    const prioritizedOrders = requestedOrderId
        ? [...visibleOrders].sort(
            (first, second) =>
                Number(second._id === requestedOrderId) -
                Number(first._id === requestedOrderId),
        )
        : visibleOrders;

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center gap-2">
                <ActivityIndicator />
                <Text className="text-center text-[#666666]">Đang tải đơn hàng...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#f7f8fa]">
            <View className="min-h-14 flex-row items-center justify-center mt-10 bg-[#9dccf5]">
                <BackButton style={{ position: "absolute", left: 10 }} />
                <Text className="text-[20px] font-bold text-[#111111]">Đơn đang chờ</Text>
            </View>

            {errorMessage ? (
                <Text className="mb-3 text-[#b00020]">{errorMessage}</Text>
            ) : null}

            <FlatList
                data={prioritizedOrders}
                keyExtractor={(item) => item._id}
                contentContainerClassName={visibleOrders.length === 0 ? "grow justify-center" : undefined}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                }
                ListEmptyComponent={
                    <Text className="text-center text-[#666666]">
                        Hiện chưa có đơn nào đang chờ.
                    </Text>
                }
                renderItem={({ item }) => {
                    const details = item.serviceDetails;
                    const secondsLeft = Math.max(
                        0,
                        Math.ceil((Date.parse(item.offerExpiresAt) - now) / 1000)
                    );
                    const isWorking = workingId === item._id;

                    return (
                        <View
                            className={`mb-3 gap-2 rounded-xl bg-white p-4 ${item._id === requestedOrderId
                                ? "border-2 border-[#16835d]"
                                : ""
                                }`}
                        >
                            {item._id === requestedOrderId ? (
                                <Text className="font-bold text-[#16835d]">
                                    Đơn mới dành cho bạn
                                </Text>
                            ) : null}
                            <Text className="text-[17px] font-bold">
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

                            <Text className="font-bold">
                                Ước tính: {item.estimatedPrice.toLocaleString("vi-VN")} VND
                            </Text>

                            <Text className="font-bold text-[#b54708]">
                                Thời gian xác nhận còn {secondsLeft} giây
                            </Text>

                            <View className="mt-1 flex-row gap-2.5">
                                <Pressable
                                    accessibilityRole="button"
                                    disabled={isWorking}
                                    onPress={() => void rejectOrder(item._id)}
                                    className="min-h-11 flex-1 items-center justify-center rounded-lg bg-[#b42318]"
                                >
                                    <Text className="font-bold text-white">Từ chối</Text>
                                </Pressable>

                                <Pressable
                                    accessibilityRole="button"
                                    disabled={isWorking}
                                    onPress={() => void acceptOrder(item._id)}
                                    className="min-h-11 flex-1 items-center justify-center rounded-lg bg-[#16835d]"
                                >
                                    {isWorking ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text className="font-bold text-white">Xác nhận đơn</Text>
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

export default HaveBookScreen;
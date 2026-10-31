import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { apiRequest } from "../../../../utils/api";
import BackButton from "../../../../components/BackButton";
type Order = {
    _id: string;
    status: string;
    createdAt: string;
    completedAt?: string | null;
    estimatedPrice: number;
    totalPrice?: number;
    address: string;
    serviceDetails: {
        category?: string;
        serviceName?: string;
        plate?: string;
    };
    additionalParts?: { name: string; quantity: number; unitPrice: number }[];
    customerId?: { fullName?: string; phone?: string };
    technicianRating?: { score: number | null; comment: string };
};

const statusLabels: Record<string, string> = {
    PENDING: "Đang tìm kỹ thuật viên",
    ACCEPTED: "Đã xác nhận",
    ARRIVED: "Đã đến nơi",
    INSPECTING: "Đang kiểm tra",
    AWAITING_PARTS_APPROVAL: "Chờ duyệt phụ tùng",
    REPAIRING: "Đang sửa chữa",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
};

const formatCurrency = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;

const MechanicHistory = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadOrders = useCallback(async () => {
        setError("");
        try {
            setOrders(await apiRequest<Order[]>("/orders/mine"));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Không tải được lịch sử đơn.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadOrders();
        }, [loadOrders]),
    );

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center gap-2">
                <ActivityIndicator />
                <Text>Đang tải lịch sử...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#f7f8fa]">
            <View className="min-h-14 flex-row items-center justify-center mt-10 bg-[#9dccf5]">
                <BackButton style={{ position: "absolute", left: 10 }} />
                <Text className="text-[20px] font-bold text-[#111111]">Lịch sử đơn hàng</Text>
            </View>
            {error ? (
                <Text accessibilityRole="alert" className="mb-2.5 text-[#b42318]">
                    {error}
                </Text>
            ) : null}
            <FlatList
                data={orders}
                keyExtractor={(item) => item._id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            void loadOrders();
                        }}
                    />
                }
                ListEmptyComponent={
                    <Text className="pt-10 text-center text-[#666666]">
                        Bạn chưa nhận đơn nào.
                    </Text>
                }
                renderItem={({ item }) => {
                    const details = item.serviceDetails;
                    return (
                        <View className="mb-3 gap-2 rounded-xl bg-white p-4">
                            <Text className="text-[17px] font-bold text-[#111111]">
                                {details.serviceName || details.category || "Dịch vụ sửa xe"}
                            </Text>
                            <Text className="font-bold text-[#16835d]">
                                {statusLabels[item.status] ?? item.status}
                            </Text>
                            <Text className="text-xs text-[#777777]">Mã đơn: {item._id}</Text>
                            <Text className="text-sm text-[#333333]">
                                Khách hàng: {item.customerId?.fullName || "Khách hàng"}
                                {item.customerId?.phone ? ` · ${item.customerId.phone}` : ""}
                            </Text>
                            <Text className="text-sm text-[#333333]">
                                Biển số: {details.plate || "Chưa cung cấp"}
                            </Text>
                            <Text className="text-sm text-[#333333]">Địa chỉ: {item.address}</Text>
                            {item.additionalParts?.map((part, index) => (
                                <Text key={`${part.name}-${index}`} className="text-sm text-[#333333]">
                                    {part.name} × {part.quantity} · {formatCurrency(part.unitPrice * part.quantity)}
                                </Text>
                            ))}
                            <Text className="mt-1 text-base font-bold text-[#111111]">
                                Tổng: {formatCurrency(item.totalPrice ?? item.estimatedPrice)}
                            </Text>
                            {item.completedAt ? (
                                <Text className="text-xs text-[#777777]">
                                    Hoàn thành: {new Date(item.completedAt).toLocaleString("vi-VN")}
                                </Text>
                            ) : null}
                            {item.technicianRating?.score ? (
                                <Text className="text-sm text-[#333333]">
                                    Đánh giá khách hàng: {item.technicianRating.score}/5
                                    {item.technicianRating.comment ? ` — ${item.technicianRating.comment}` : ""}
                                </Text>
                            ) : null}
                            {item.status === "COMPLETED" ? (
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={() => router.push({
                                        pathname: "/(tabs)/(MechanicTab)/bill",
                                        params: { orderId: item._id },
                                    })}
                                    className="items-center rounded-lg bg-[#80b5f8] p-3">
                                    <Text className="font-bold text-[#111111]">Xem hóa đơn / đánh giá</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    );
                }}
            />
        </View>
    );
};

export default MechanicHistory;

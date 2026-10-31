import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest } from "../../../../utils/api";
import BackButton from "../../../../components/BackButton";

type Order = {
  _id: string;
  status: string;
  estimatedPrice: number;
  totalPrice?: number;
  completedAt?: string | null;
  paymentMethod: string;
  serviceDetails: {
    category?: string;
    serviceName?: string;
    vehicleType?: string;
    vehicleMake?: string;
    plate?: string;
  };
  additionalParts?: { name: string; quantity: number; unitPrice: number }[];
  technicianId?: { fullName?: string; phone?: string } | null;
  customerRating?: { score: number | null; comment: string };
};

const formatCurrency = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;
const paymentMethodLabels: Record<string, string> = {
  cash: "Tiền mặt",
  momo: "MoMo",
  vnpay: "VNPay",
};

const Bill = () => {
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    let active = true;
    if (!orderId) return () => {
      active = false;
    };

    void apiRequest<Order>(`/orders/${orderId}`)
      .then((data) => {
        if (active) {
          setOrder(data);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Không tải được hóa đơn.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const submitRating = async () => {
    if (!order || submittingRating) return;
    setSubmittingRating(true);
    try {
      const updated = await apiRequest<Order>(`/orders/${order._id}/customer-rating`, {
        method: "PUT",
        body: { score: rating, comment: review },
      });
      setOrder(updated);
      Alert.alert("Cảm ơn bạn", "Đánh giá của bạn đã được lưu.");
    } catch (submitError) {
      Alert.alert(
        "Không gửi được đánh giá",
        submitError instanceof Error ? submitError.message : "Vui lòng thử lại.",
      );
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!orderId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 p-5">
        <Text accessibilityRole="alert" className="text-center text-[#b42318]">
          Không tìm thấy mã đơn để hiển thị hóa đơn.
        </Text>
        <Pressable onPress={() => router.back()} className="items-center rounded-[10px] bg-[#80b5f8] p-3.5">
          <Text className="text-base font-bold text-[#111111]">Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 p-5">
        <ActivityIndicator />
        <Text>Đang tải hóa đơn...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 p-5">
        <Text accessibilityRole="alert" className="text-center text-[#b42318]">{error}</Text>
        <Pressable onPress={() => router.back()} className="items-center rounded-[10px] bg-[#80b5f8] p-3.5">
          <Text className="text-base font-bold text-[#111111]">Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const serviceName = order.serviceDetails.serviceName || order.serviceDetails.category || "Dịch vụ sửa xe";
  const total = order.totalPrice ?? order.estimatedPrice;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#f5f5f5]">
      <View className="relative min-h-14 flex-row items-center justify-center bg-[#9dccf5] px-5">
        <BackButton style={{ position: "absolute", left: 12, backgroundColor: "transparent" }} />
        <Text className="text-lg font-bold text-[#111111]">Hóa đơn và đánh giá</Text>
      </View>
      {error ? <Text accessibilityRole="alert" className="text-center text-[#b42318]">{error}</Text> : null}
      <ScrollView contentContainerClassName="gap-3 p-3.5 pb-8" showsVerticalScrollIndicator={false}>
        <View className="gap-2.5 rounded-xl bg-white p-4">
          <Text className="text-lg font-bold text-[#111111]">Chi tiết đơn</Text>
          <Text className="text-[15px] text-[#444444]">Mã đơn: {order._id}</Text>
          <Text className="text-[15px] text-[#444444]">Dịch vụ: {serviceName}</Text>
          <Text className="text-[15px] text-[#444444]">
            Xe: {[order.serviceDetails.vehicleType, order.serviceDetails.vehicleMake]
              .filter(Boolean)
              .join(" ") || "Chưa cung cấp"}
          </Text>
          <Text className="text-[15px] text-[#444444]">Biển số: {order.serviceDetails.plate || "Chưa cung cấp"}</Text>
          <Text className="text-[15px] text-[#444444]">
            Kỹ thuật viên: {order.technicianId?.fullName || "Chưa có thông tin"}
          </Text>
        </View>

        <View className="gap-2.5 rounded-xl bg-white p-4">
          <Text className="text-lg font-bold text-[#111111]">Chi tiết giá</Text>
          <View className="flex-row justify-between gap-3">
            <Text className="text-[15px] text-[#444444]">Phí dịch vụ cơ bản</Text>
            <Text className="text-[15px] text-[#444444]">{formatCurrency(order.estimatedPrice)}</Text>
          </View>
          {order.additionalParts?.map((part, index) => (
            <View key={`${part.name}-${index}`} className="flex-row justify-between gap-3">
              <Text className="text-[15px] text-[#444444]">
                {part.name} × {part.quantity}
              </Text>
              <Text className="text-[15px] text-[#444444]">{formatCurrency(part.unitPrice * part.quantity)}</Text>
            </View>
          ))}
          <View className="mt-1.5 flex-row justify-between gap-3 border-t border-[#dddddd] pt-3">
            <Text className="text-[17px] font-bold text-[#111111]">Tổng cộng</Text>
            <Text className="text-lg font-bold text-[#d92d20]">{formatCurrency(total)}</Text>
          </View>
          <Text className="text-[15px] text-[#444444]">
            Phương thức thanh toán: {paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}
          </Text>
          <Text className="text-[15px] text-[#444444]">
            Trạng thái đơn: {order.status === "COMPLETED" ? "Hoàn thành" : order.status}
          </Text>
          {order.completedAt ? (
            <Text className="text-[15px] text-[#444444]">
              Thời gian hoàn thành: {new Date(order.completedAt).toLocaleString("vi-VN")}
            </Text>
          ) : null}
        </View>

        <View className="gap-2.5 rounded-xl bg-white p-4">
          <Text className="text-lg font-bold text-[#111111]">Đánh giá kỹ thuật viên</Text>
          {order.customerRating?.score ? (
            <>
              <Text className="text-[15px] text-[#444444]">Bạn đã đánh giá {order.customerRating.score}/5 sao.</Text>
              {order.customerRating.comment ? (
                <Text className="text-[15px] text-[#444444]">Nhận xét: {order.customerRating.comment}</Text>
              ) : null}
            </>
          ) : order.status !== "COMPLETED" ? (
            <Text className="text-[15px] text-[#444444]">Bạn có thể đánh giá sau khi đơn hoàn thành.</Text>
          ) : (
            <>
              <View className="flex-row justify-center gap-2">
                {Array.from({ length: 5 }, (_, index) => {
                  const score = index + 1;
                  return (
                    <Pressable
                      key={score}
                      accessibilityRole="button"
                      accessibilityLabel={`${score} sao`}
                      onPress={() => setRating(score)}
                    >
                      <Text className={`text-4xl ${score <= rating ? "text-[#ffb900]" : "text-[#999999]"}`}>★</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                accessibilityLabel="Nhận xét về dịch vụ"
                value={review}
                onChangeText={setReview}
                placeholder="Nhận xét (không bắt buộc)"
                multiline
                className="min-h-[100px] rounded-[10px] border border-[#d0d5dd] p-3"
              />
              <Pressable
                accessibilityRole="button"
                disabled={submittingRating}
                onPress={() => void submitRating()}
                className="items-center rounded-[10px] bg-[#80b5f8] p-3.5"
              >
                <Text className="text-base font-bold text-[#111111]">
                  {submittingRating ? "Đang gửi..." : "Gửi đánh giá"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Bill;

import { useAuth } from "../../../../context/AuthContext";
import { Redirect, router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../../utils/api";
import { ActivityIndicator, Alert, ImageSourcePropType, Pressable, Text, TextInput, View, Image, useWindowDimensions } from "react-native";
import * as Location from "expo-location";
import LeafletMap from "../../../../components/LeafletMap";
import { icons } from "../../../../constants/icon";
import DraggableOrderSheet from "../../../../components/DraggableOrderSheet";
import InfoSection from "../../../../components/InfoSection";
import { useLocationSearch, type PickupLocation } from "../../../../utils/useLocationSearch";
import { isWithinHoChiMinhBounds } from "../../../../constants/serviceArea";

type ActiveOrder = {
    _id: string;
    status:
    | "ACCEPTED"
    | "ARRIVED"
    | "INSPECTING"
    | "AWAITING_PARTS_APPROVAL"
    | "REPAIRING"
    | "COMPLETED"
    | "CANCELLED";
    address: string;
    location: { latitude: number; longitude: number };
    technicianLocation?: {
        latitude: number;
        longitude: number;
        updatedAt?: string;
    } | null;
    estimatedPrice: number;
    totalPrice?: number;
    partsProposal?: {
        name: string;
        quantity: number;
        unitPrice: number;
        response: "PENDING" | "ACCEPTED" | "REJECTED";
    };
    additionalParts?: { name: string; quantity: number; unitPrice: number }[];
    technicianRating?: { score: number | null; comment: string };
    serviceDetails: {
        category?: string;
        serviceName?: string;
        sparePart?: string;
        vehicleType?: string;
        vehicleMake?: string;
        plate?: string;
        description?: string;
    };
    customerId: {
        fullName: string;
        phone?: string;
    };
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
        className="flex-1 items-center justify-center gap-1.5">
        <View className="h-[52px] w-[52px] items-center justify-center rounded-[13px] bg-[#f3f3f3]">
            <Image source={icon} className="h-8 w-8" resizeMode="contain" />
        </View>
        <Text numberOfLines={1} className="text-center text-xs font-bold text-[#111111]">
            {label}
        </Text>
    </Pressable>
);

const MechanicHome = () => {
    const { isLoaded, isSignedIn, user } = useAuth();
    const navigation = useNavigation();
    const { height } = useWindowDimensions();
    const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
    const {
        pickupLocation,
        pickupAddress,
        isSearchingLocation,
        locationError,
        handlePickupAddressChange,
        setPickupLocationFromCoordinates,
        searchPickupLocation,
    } = useLocationSearch();
    const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
    const [technicianLocation, setTechnicianLocation] = useState<PickupLocation | null>(null);
    const [isOrderSheetExpanded, setIsOrderSheetExpanded] = useState(false);
    const [orderError, setOrderError] = useState("");
    const [trackingError, setTrackingError] = useState("");
    const [partName, setPartName] = useState("");
    const [partQuantity, setPartQuantity] = useState("1");
    const [partUnitPrice, setPartUnitPrice] = useState("");
    const [technicianRating, setTechnicianRating] = useState(5);
    const [technicianReview, setTechnicianReview] = useState("");
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const lastOpenedAvailableOrderId = useRef<string | null>(null);
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
    const requestCurrentLocation = async () => {
        try {
            const permission = await Location.requestForegroundPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Cần quyền vị trí", "Hãy cấp quyền vị trí để tìm vị trí hiện tại.");
                return;
            }

            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const { latitude, longitude } = position.coords;
            if (!isWithinHoChiMinhBounds(latitude, longitude)) {
                Alert.alert("Ngoài khu vực hỗ trợ", "Vị trí hiện tại nằm ngoài khu vực TP.HCM.");
                return;
            }

            setPickupLocationFromCoordinates(latitude, longitude);
            Alert.alert("Đã lấy vị trí", "Vị trí hiện tại đã được hiển thị trên bản đồ.");
        } catch (error) {
            Alert.alert(
                "Không lấy được vị trí",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        }
    };

    const openOrders = () => {
        router.push("/(tabs)/(MechanicTab)/haveBook");
    };

    const openSettings = () => {
        router.push("/(tabs)/(MechanicTab)/setting");
    };
    const openHistory = () => {
        router.push("/(tabs)/(MechanicTab)/history");
    };

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

    useFocusEffect(
        useCallback(() => {
            let isFocused = true;
            let isLoading = false;

            const loadActiveOrder = async () => {
                if (isLoading) return;
                isLoading = true;

                try {
                    const orders = await apiRequest<ActiveOrder[]>("/orders/mine");
                    if (isFocused) {
                        const active = orders.find((order) =>
                            ["ACCEPTED", "ARRIVED", "INSPECTING", "AWAITING_PARTS_APPROVAL", "REPAIRING"].includes(order.status) ||
                            (order.status === "COMPLETED" && !order.technicianRating?.score),
                        );
                        if (active) {
                            setActiveOrder(active);
                            setOrderError("");
                            return;
                        }

                        setActiveOrder(null);
                        setTechnicianLocation(null);

                        const availableOrders = await apiRequest<{ _id: string }[]>(
                            "/orders/available",
                        );
                        if (!isFocused) return;

                        const newOrder = availableOrders[0];
                        if (!newOrder) {
                            lastOpenedAvailableOrderId.current = null;
                            setOrderError("");
                            return;
                        }

                        if (newOrder._id !== lastOpenedAvailableOrderId.current) {
                            lastOpenedAvailableOrderId.current = newOrder._id;
                            setOrderError("");
                            router.push({
                                pathname: "/(tabs)/(MechanicTab)/haveBook",
                                params: { orderId: newOrder._id },
                            });
                        }
                    }
                } catch (error) {
                    if (isFocused) {
                        setOrderError(
                            error instanceof Error ? error.message : "Không tải được đơn đang xử lý.",
                        );
                    }
                } finally {
                    isLoading = false;
                }
            };

            void loadActiveOrder();
            const timer = setInterval(() => void loadActiveOrder(), 5000);
            return () => {
                isFocused = false;
                clearInterval(timer);
            };
        }, []),
    );

    const hasActiveOrder = activeOrder !== null;

    useEffect(() => {
        navigation.setOptions({
            tabBarStyle: { display: hasActiveOrder ? "none" : "flex" },
        });
    }, [hasActiveOrder, navigation]);

    const activeOrderId = activeOrder?._id;
    const activeOrderStatus = activeOrder?.status;
    const activeOrderAddress = activeOrder?.address;

    useEffect(() => {
        if (
            !activeOrderId ||
            !activeOrderAddress ||
            !["ACCEPTED", "ARRIVED", "INSPECTING", "AWAITING_PARTS_APPROVAL", "REPAIRING"].includes(activeOrderStatus ?? "")
        ) return;

        let isCancelled = false;
        let subscription: Location.LocationSubscription | null = null;

        const startLocationUpdates = async () => {
            try {
                const permission = await Location.requestForegroundPermissionsAsync();
                if (!permission.granted) {
                    if (!isCancelled) {
                        setTrackingError("Cần cấp quyền vị trí khi dùng ứng dụng để chia sẻ vị trí với khách.");
                    }
                    return;
                }
                if (isCancelled) return;

                const sendCurrentLocation = async (position: Location.LocationObject) => {
                    if (isCancelled) return;

                    const currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        address: activeOrderAddress,
                    };
                    setTechnicianLocation(currentLocation);

                    try {
                        await apiRequest(`/orders/${activeOrderId}/location`, {
                            method: "PUT",
                            body: {
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude,
                            },
                        });
                        if (!isCancelled) setTrackingError("");
                    } catch (error) {
                        if (!isCancelled) {
                            setTrackingError(
                                error instanceof Error
                                    ? error.message
                                    : "Không gửi được vị trí kỹ thuật viên.",
                            );
                        }
                    }
                };

                const locationServicesEnabled = await Location.hasServicesEnabledAsync();
                if (!locationServicesEnabled) {
                    if (!isCancelled) {
                        setTrackingError("Hãy bật dịch vụ định vị trên thiết bị để chia sẻ vị trí.");
                    }
                    return;
                }

                const initialPosition = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                await sendCurrentLocation(initialPosition);
                if (isCancelled) return;

                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 5000,
                        distanceInterval: 10,
                    },
                    (position) => void sendCurrentLocation(position),
                );

                if (isCancelled) subscription.remove();
            } catch (error) {
                if (!isCancelled) {
                    setTrackingError(
                        error instanceof Error
                            ? error.message
                            : "Không thể bật theo dõi vị trí kỹ thuật viên.",
                    );
                }
            }
        };

        void startLocationUpdates();
        return () => {
            isCancelled = true;
            subscription?.remove();
        };
    }, [activeOrderId, activeOrderStatus, activeOrderAddress]);

    const markInspecting = async () => {
        if (!activeOrder || isUpdatingOrder) return;

        try {
            setIsUpdatingOrder(true);
            const updated = await apiRequest<ActiveOrder>(
                `/orders/${activeOrder._id}/inspect`,
                { method: "PUT" },
            );
            setActiveOrder(updated);
        } catch (error) {
            Alert.alert(
                "Không cập nhật được trạng thái",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const proposeParts = async () => {
        if (!activeOrder || isUpdatingOrder) return;
        const quantity = Number(partQuantity);
        const unitPrice = Number(partUnitPrice);
        if (!partName.trim() || !partUnitPrice.trim() || !Number.isInteger(quantity) || quantity < 1 ||
            !Number.isFinite(unitPrice) || unitPrice < 0) {
            Alert.alert("Thông tin phụ tùng chưa hợp lệ", "Nhập tên, số lượng và đơn giá hợp lệ.");
            return;
        }

        try {
            setIsUpdatingOrder(true);
            const updated = await apiRequest<ActiveOrder>(
                `/orders/${activeOrder._id}/parts/propose`,
                { method: "PUT", body: { name: partName.trim(), quantity, unitPrice } },
            );
            setActiveOrder(updated);
        } catch (error) {
            Alert.alert(
                "Không gửi được đề xuất",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const startRepair = async () => {
        if (!activeOrder || isUpdatingOrder) return;
        try {
            setIsUpdatingOrder(true);
            const updated = await apiRequest<ActiveOrder>(
                `/orders/${activeOrder._id}/repair`,
                { method: "PUT" },
            );
            setActiveOrder(updated);
        } catch (error) {
            Alert.alert(
                "Không bắt đầu sửa chữa được",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const completeOrder = async () => {
        if (!activeOrder || isUpdatingOrder) return;

        try {
            setIsUpdatingOrder(true);
            const completed = await apiRequest<ActiveOrder>(
                `/orders/${activeOrder._id}/complete`,
                { method: "PUT" },
            );
            setActiveOrder(completed);
            setTechnicianLocation(null);
        } catch (error) {
            Alert.alert(
                "Không hoàn thành được đơn",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const submitTechnicianRating = async () => {
        if (!activeOrder || isUpdatingOrder) return;
        try {
            setIsUpdatingOrder(true);
            await apiRequest(`/orders/${activeOrder._id}/technician-rating`, {
                method: "PUT",
                body: { score: technicianRating, comment: technicianReview },
            });
            setActiveOrder(null);
            setIsOrderSheetExpanded(false);
        } catch (error) {
            Alert.alert(
                "Không gửi được đánh giá",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsUpdatingOrder(false);
        }
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

    if (activeOrder) {
        const details = activeOrder.serviceDetails;
        const mechanicStatusText = {
            ACCEPTED: "Đã xác nhận đơn",
            ARRIVED: "Đã đến vị trí khách",
            INSPECTING: "Đang kiểm tra",
            AWAITING_PARTS_APPROVAL: "Chờ khách xác nhận phụ tùng",
            REPAIRING: "Đang sửa chữa",
            COMPLETED: "Hoàn thành",
            CANCELLED: "Đã hủy",
        }[activeOrder.status];
        return (
            <View className="flex-1 bg-[#e8e5dc]">
                <View className="absolute inset-0">
                    <LeafletMap
                        location={{ ...activeOrder.location, address: activeOrder.address }}
                        technicianLocation={
                            technicianLocation ??
                            (activeOrder.technicianLocation &&
                                Number.isFinite(activeOrder.technicianLocation.latitude) &&
                                Number.isFinite(activeOrder.technicianLocation.longitude)
                                ? activeOrder.technicianLocation
                                : null)
                        }
                        pickupLabel="Vị trí khách hàng"
                    />
                </View>
                <DraggableOrderSheet
                    expanded={isOrderSheetExpanded}
                    onExpandedChange={setIsOrderSheetExpanded}
                    screenHeight={height}
                    swipeEnabled
                    compactContent={
                        <View className="px-[22px] pb-2.5">
                            <Text className="text-[15px] font-semibold text-[#858585]">Khách hàng</Text>
                            <Text className="mt-0.5 text-[22px] font-bold text-[#111111]">
                                {activeOrder.customerId?.fullName ?? "Khách hàng"}
                            </Text>
                            <Text className="mt-1 text-[15px] font-semibold text-[#555555]">
                                Biển số: {details.plate || "Chưa cung cấp"}
                            </Text>
                        </View>
                    }>
                    {orderError ? (
                        <Text accessibilityRole="alert" className="mb-3 text-sm text-[#b42318]">{orderError}</Text>
                    ) : null}
                    {trackingError ? (
                        <Text accessibilityRole="alert" className="mb-3 text-sm text-[#b42318]">{trackingError}</Text>
                    ) : null}
                    <InfoSection
                        title="Thông tin khách hàng"
                        icon={icons.person}
                        // variant="customer"
                        rows={[
                            { label: "Tên khách hàng", value: activeOrder.customerId?.fullName ?? "Khách hàng" },
                            { label: "Số điện thoại", value: activeOrder.customerId?.phone ?? "Chưa cung cấp" },
                        ]}
                    />
                    <View className="mx-[-22px] mb-3 h-[7px] bg-[#e7e7e7]" />
                    <InfoSection title="Địa điểm" icon={icons.location} rows={[{ label: "Địa chỉ", value: activeOrder.address }]} />
                    <View className="mx-[-22px] mb-3 h-[7px] bg-[#e7e7e7]" />
                    <InfoSection
                        title="Thông tin yêu cầu"
                        icon={icons.info}
                        // variant="customer"
                        rows={[
                            { label: "Loại xe", value: details.vehicleType || "Chưa cung cấp" },
                            { label: "Hãng xe", value: details.vehicleMake || "Chưa cung cấp" },
                            { label: "Biển số", value: details.plate || "Chưa cung cấp" },
                            { label: "Dịch vụ", value: details.serviceName || details.category || "Chưa cung cấp" },
                            { label: "Phụ tùng", value: details.sparePart || "Không có" },
                            { label: "Mô tả", value: details.description || "Không có" },
                            { label: "Giá ước tính", value: `${activeOrder.estimatedPrice.toLocaleString("vi-VN")}đ` },
                        ]}
                    />
                    <Text className="mb-2 text-base font-bold text-[#16835d]">{mechanicStatusText}</Text>
                    {activeOrder.status === "ACCEPTED" ? (
                        <Pressable
                            accessibilityRole="button"
                            disabled={isUpdatingOrder}
                            onPress={() => void markInspecting()}
                            className="mt-2 items-center justify-center rounded-xl bg-[#80b5f8] py-4"
                        >
                            <Text className="text-base font-bold text-[#111111]">Bắt đầu kiểm tra</Text>
                        </Pressable>
                    ) : null}
                    {activeOrder.status === "INSPECTING" ? (
                        <View className="mt-3 rounded-xl bg-[#f4f7fb] p-3.5">
                            <Text className="mb-2 text-base font-bold text-[#111111]">Đang kiểm tra</Text>
                            <TextInput
                                accessibilityLabel="Tên phụ tùng cần thay"
                                value={partName}
                                onChangeText={setPartName}
                                placeholder="Tên phụ tùng (nếu cần)"
                                className="mb-2.5 min-h-[46px] rounded-lg border border-[#d0d5dd] bg-white px-3 text-[#111111]"
                            />
                            <View className="flex-row gap-2">
                                <TextInput
                                    accessibilityLabel="Số lượng phụ tùng"
                                    value={partQuantity}
                                    onChangeText={setPartQuantity}
                                    keyboardType="number-pad"
                                    placeholder="Số lượng"
                                    className="mb-2.5 min-h-[46px] flex-1 rounded-lg border border-[#d0d5dd] bg-white px-3 text-[#111111]"
                                />
                                <TextInput
                                    accessibilityLabel="Đơn giá phụ tùng"
                                    value={partUnitPrice}
                                    onChangeText={setPartUnitPrice}
                                    keyboardType="number-pad"
                                    placeholder="Đơn giá (đ)"
                                    className="mb-2.5 min-h-[46px] flex-[2] rounded-lg border border-[#d0d5dd] bg-white px-3 text-[#111111]"
                                />
                            </View>
                            <Pressable
                                accessibilityRole="button"
                                disabled={isUpdatingOrder}
                                onPress={() => void proposeParts()}
                                className="min-h-[46px] items-center justify-center rounded-[10px] border border-[#80b5f8] bg-white px-3"
                            >
                                <Text className="text-[15px] font-bold text-[#24527a]">Gửi đề xuất phụ tùng</Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                disabled={isUpdatingOrder}
                                onPress={() => void startRepair()}
                                className="mt-2 items-center justify-center rounded-xl bg-[#80b5f8] py-4"
                            >
                                <Text className="text-base font-bold text-[#111111]">Tiến hành sửa chữa</Text>
                            </Pressable>
                        </View>
                    ) : null}
                    {activeOrder.status === "AWAITING_PARTS_APPROVAL" ? (
                        <View className="mt-3 rounded-xl bg-[#f4f7fb] p-3.5">
                            <Text className="mb-2 text-base font-bold text-[#111111]">Đang chờ khách xác nhận phụ tùng</Text>
                            {activeOrder.partsProposal ? (
                                <Text className="mb-3 text-[15px] text-[#555555]">
                                    {activeOrder.partsProposal.name} × {activeOrder.partsProposal.quantity} —{" "}
                                    {(activeOrder.partsProposal.unitPrice * activeOrder.partsProposal.quantity).toLocaleString("vi-VN")}đ
                                </Text>
                            ) : null}
                        </View>
                    ) : null}
                    {activeOrder.status === "REPAIRING" || activeOrder.status === "ARRIVED" ? (
                        <Pressable
                            accessibilityRole="button"
                            disabled={isUpdatingOrder}
                            onPress={() => void completeOrder()}
                            className="mt-2 items-center justify-center rounded-xl bg-[#80b5f8] py-4"
                        >
                            <Text className="text-base font-bold text-[#111111]">Hoàn thành đơn</Text>
                        </Pressable>
                    ) : null}
                    {activeOrder.status === "COMPLETED" ? (
                        <View className="mt-3 rounded-xl bg-[#f4f7fb] p-3.5">
                            <Text className="mb-2 text-base font-bold text-[#111111]">Đơn hoàn thành — hóa đơn</Text>
                            <InfoSection
                                title="Chi tiết giá"
                                rows={[
                                    { label: "Phí dịch vụ cơ bản", value: `${activeOrder.estimatedPrice.toLocaleString("vi-VN")}đ` },
                                    ...(activeOrder.additionalParts ?? []).map((part) => ({
                                        label: `${part.name} × ${part.quantity}`,
                                        value: `${(part.unitPrice * part.quantity).toLocaleString("vi-VN")}đ`,
                                    })),
                                ]}
                            />
                            <Text className="mb-3 text-[15px] text-[#555555]">
                                Tổng cộng: {(activeOrder.totalPrice ?? activeOrder.estimatedPrice).toLocaleString("vi-VN")}đ
                            </Text>
                            <Text className="mb-2 text-base font-bold text-[#111111]">Đánh giá khách hàng</Text>
                            <View className="my-2 flex-row justify-center gap-2">
                                {Array.from({ length: 5 }, (_, index) => {
                                    const score = index + 1;
                                    return (
                                        <Pressable
                                            key={score}
                                            accessibilityRole="button"
                                            accessibilityLabel={`${score} sao`}
                                            onPress={() => setTechnicianRating(score)}
                                        >
                                            <Text className={`text-[32px] ${score <= technicianRating ? "text-[#ffb900]" : "text-[#9a9a9a]"}`}>
                                                ★
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            <TextInput
                                accessibilityLabel="Nhận xét về khách hàng"
                                value={technicianReview}
                                onChangeText={setTechnicianReview}
                                placeholder="Nhận xét (không bắt buộc)"
                                multiline
                                className="mb-2.5 min-h-[90px] rounded-lg border border-[#d0d5dd] bg-white px-3 pb-3 pt-3 text-[#111111]"
                            />
                            <Pressable
                                accessibilityRole="button"
                                disabled={isUpdatingOrder}
                                onPress={() => void submitTechnicianRating()}
                                className="mt-2 items-center justify-center rounded-xl bg-[#80b5f8] py-4"
                            >
                                <Text className="text-base font-bold text-[#111111]">Gửi đánh giá khách hàng</Text>
                            </Pressable>
                        </View>
                    ) : null}
                </DraggableOrderSheet>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#e8e5dc]">
            <View className="absolute inset-0">
                <LeafletMap location={pickupLocation} />
            </View>

            <View className="absolute top-0 left-0 right-0 z-10 flex-row items-center gap-2 p-4 pt-12">
                {/* Ô nhập địa chỉ (TextInput) */}
                <View className="h-[52px] flex-1 flex-row items-center rounded-[14px] bg-white px-3 shadow-md">
                    <Image
                        source={icons.location}
                        resizeMode="contain"
                        className="mr-2 h-6 w-6"
                    />
                    <View>
                        <TextInput
                            accessibilityLabel="Địa chỉ điểm của kỹ thuật viên"
                            editable={!isSearchingLocation}
                            onChangeText={handlePickupAddressChange}
                            onSubmitEditing={() => void searchPickupLocation()}
                            placeholder="Nhập vị trí cần tìm"
                            placeholderTextColor="#858585"
                            returnKeyType="search"
                            value={pickupAddress}
                            className="flex-1 p-0 text-sm font-semibold text-[#333333]"
                        /></View>
                </View>

                {/* Nút Tìm */}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tìm địa chỉ trên bản đồ"
                    disabled={isSearchingLocation}
                    onPress={() => void searchPickupLocation()}
                    className="h-[52px] min-w-[52px] items-center justify-center rounded-[14px] bg-[#e8f5ef] shadow-md">
                    {isSearchingLocation ? (
                        <ActivityIndicator color="#16835d" />
                    ) : (
                        <Text className="text-sm font-bold text-[#16835d]">Tìm</Text>
                    )}
                </Pressable>
            </View>

            {locationError ? (
                <Text accessibilityRole="alert" className="mt-2 rounded-[10px] bg-white px-3 py-2 text-[13px] text-[#b42318]">
                    {locationError}
                </Text>
            ) : null}

            {/* Tabsbar của home */}
            <View className="absolute bottom-0 left-0 right-0 p-4 pb-8">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Định vị vị trí hiện tại bằng GPS"
                    onPress={() => void requestCurrentLocation()}
                    className="absolute -top-14 right-4 h-12 w-12 items-center justify-center rounded-full bg-white shadow-md z-10">
                    <Text className="text-[31px] leading-[35px] text-[#16835d]">◎</Text>
                </Pressable>

                {/* Các thông báo lỗi (nếu có) */}
                {orderError ? (
                    <Text accessibilityRole="alert" className="mb-3 text-sm text-[#b42318]">
                        {orderError}
                    </Text>
                ) : null}

                {/* Nút Bật/Tắt nhận đơn chính */}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                        isAcceptingOrders ? "Tắt nhận đơn" : "Bật nhận đơn"
                    }
                    onPress={() => void toggleAvailability()}
                    className="mb-3 min-h-[58px] flex-row items-center justify-between rounded-[14px] bg-white px-[18px] shadow-md">
                    <View className="flex-row items-center">
                        <View
                            className={`mr-3 h-[13px] w-[13px] rounded-full ${isAcceptingOrders ? "bg-[#00d94b]" : "bg-[#ff2020]"
                                }`}
                        />
                        <Text className="text-base font-bold text-[#111111]">
                            {isAcceptingOrders
                                ? "Đang bật nhận đơn"
                                : "Đang tắt nhận đơn"}
                        </Text>
                    </View>
                </Pressable>

                {/* Các nút QuickAction ở dưới */}
                <View className="min-h-[116px] flex-row items-center justify-around rounded-[18px] bg-white px-1.5 py-3 shadow-lg">
                    <QuickAction
                        icon={icons.power}
                        label={isAcceptingOrders ? "Tắt nhận đơn" : "Bật nhận đơn"}
                        onPress={() => void toggleAvailability()} />

                    <QuickAction icon={icons.book} label="Đơn đặt" onPress={openOrders} />

                    <QuickAction icon={icons.history} label="Lịch sử" onPress={openHistory} />

                    <QuickAction icon={icons.setting} label="Cài đặt" onPress={openSettings} />
                </View>
            </View>
        </View>
    );
};

export default MechanicHome;
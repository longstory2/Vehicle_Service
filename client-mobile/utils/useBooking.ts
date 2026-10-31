import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import {
    serviceCategories,
    spareParts,
    vehicleMakes,
    vehicleTypes,
} from "../constants/data";
import { apiRequest } from "./api";
import { useLocationSearch } from "./useLocationSearch";

export type OrderStatus =
    | "PENDING"
    | "ACCEPTED"
    | "ARRIVED"
    | "INSPECTING"
    | "AWAITING_PARTS_APPROVAL"
    | "REPAIRING"
    | "COMPLETED"
    | "CANCELLED";

type OrderPart = { name: string; quantity: number; unitPrice: number };

export type ActiveOrder = {
    _id: string;
    status: OrderStatus;
    address: string;
    location: { latitude: number; longitude: number };
    technicianLocation?: {
        latitude: number;
        longitude: number;
        updatedAt?: string;
    } | null;
    estimatedPrice: number;
    totalPrice?: number;
    paymentMethod: string;
    partsProposal?: OrderPart & { response: "PENDING" | "ACCEPTED" | "REJECTED" };
    additionalParts?: OrderPart[];
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
    technicianId?: {
        fullName: string;
        phone?: string;
    } | null;
};

export type BookingDetails = {
    categoryId: string;
    vehicleTypeId: string;
    vehicleMakeId: string;
    plate: string;
    serviceName: string;
    sparePartId: string;
    mileage: string;
    description: string;
    estimatedPrice: number;
    paymentMethod: "cash" | "momo" | "vnpay";
};

const activeStatuses: OrderStatus[] = [
    "PENDING",
    "ACCEPTED",
    "ARRIVED",
    "INSPECTING",
    "AWAITING_PARTS_APPROVAL",
    "REPAIRING",
];

export const useBooking = (details: BookingDetails) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
    const [isSheetExpanded, setIsSheetExpanded] = useState(false);
    const [trackingError, setTrackingError] = useState("");
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const {
        pickupAddress,
        pickupLocation,
        locationError,
        isSearchingLocation,
        handlePickupAddressChange,
        searchPickupLocation,
    } = useLocationSearch();
    const [selectedOption, setSelectedOption] = useState<BookingDetails["paymentMethod"]>(
        details.paymentMethod,
    );
    const navigatedInvoiceId = useRef<string | null>(null);

    const requestCurrentLocation = () => {
        Alert.alert("Định vị GPS", "Tích hợp lấy tọa độ thiết bị tại handler này.");
    };

    const submitBooking = async () => {
        if (!pickupLocation) {
            Alert.alert(
                "Chưa chọn điểm đón",
                "Nhập địa chỉ rồi bấm Tìm để hiển thị vị trí trên bản đồ.",
            );
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        const selectedCategory = serviceCategories.find((item) => item.id === details.categoryId);
        const selectedSparePart = spareParts.find((item) => item.id === details.sparePartId);

        try {
            const createdOrder = await apiRequest<ActiveOrder>("/orders", {
                method: "POST",
                body: {
                    serviceDetails: {
                        category: selectedCategory?.title ?? "",
                        serviceName: details.serviceName,
                        sparePart: selectedSparePart?.label ?? "",
                        vehicleType:
                            vehicleTypes.find((item) => item.id === details.vehicleTypeId)?.label ?? "",
                        vehicleMake:
                            vehicleMakes.find((item) => item.id === details.vehicleMakeId)?.label ?? "",
                        plate: details.plate,
                        mileage: details.mileage,
                        description: details.description,
                    },
                    address: pickupLocation.address,
                    location: {
                        latitude: pickupLocation.latitude,
                        longitude: pickupLocation.longitude,
                    },
                    estimatedPrice: details.estimatedPrice,
                    paymentMethod: selectedOption,
                },
            });

            setActiveOrder(createdOrder);
            setIsSheetExpanded(false);
        } catch (error) {
            Alert.alert(
                "Không gửi được đơn",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeOrderId = activeOrder?._id;
    const activeOrderStatus = activeOrder?.status;

    useEffect(() => {
        if (
            activeOrderId &&
            activeOrderStatus === "COMPLETED" &&
            navigatedInvoiceId.current !== activeOrderId
        ) {
            navigatedInvoiceId.current = activeOrderId;
            router.replace({
                pathname: "/(tabs)/(CustomerTab)/bill",
                params: { orderId: activeOrderId },
            });
        }
    }, [activeOrderId, activeOrderStatus]);

    useEffect(() => {
        if (!activeOrderId || !activeStatuses.includes(activeOrderStatus ?? "CANCELLED")) {
            return;
        }

        let isMounted = true;
        let isLoading = false;

        const refreshOrder = async () => {
            if (isLoading) return;
            isLoading = true;
            try {
                const latest = await apiRequest<ActiveOrder>(`/orders/${activeOrderId}`);
                if (isMounted) {
                    setActiveOrder(latest);
                    setTrackingError("");
                }
            } catch (error) {
                if (isMounted) {
                    setTrackingError(
                        error instanceof Error ? error.message : "Không cập nhật được đơn.",
                    );
                }
            } finally {
                isLoading = false;
            }
        };

        const timer = setInterval(() => void refreshOrder(), 5000);
        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [activeOrderId, activeOrderStatus]);

    const cancelOrder = () => {
        if (!activeOrder) return;
        Alert.alert(
            "Hủy đơn đặt?",
            "Bạn chỉ có thể hủy trước khi kỹ thuật viên bắt đầu kiểm tra.",
            [
                { text: "Không", style: "cancel" },
                {
                    text: "Hủy đơn",
                    style: "destructive",
                    onPress: () => {
                        setIsUpdatingOrder(true);
                        void apiRequest<ActiveOrder>(`/orders/${activeOrder._id}/cancel`, {
                            method: "PUT",
                        }).then(
                            setActiveOrder,
                            (error: unknown) =>
                                Alert.alert(
                                    "Không hủy được đơn",
                                    error instanceof Error ? error.message : "Vui lòng thử lại.",
                                ),
                        ).finally(() => setIsUpdatingOrder(false));
                    },
                },
            ],
        );
    };

    const respondToParts = async (accepted: boolean) => {
        if (!activeOrder || isUpdatingOrder) return;
        setIsUpdatingOrder(true);
        try {
            const updated = await apiRequest<ActiveOrder>(
                `/orders/${activeOrder._id}/parts/respond`,
                { method: "PUT", body: { accepted } },
            );
            setActiveOrder(updated);
        } catch (error) {
            Alert.alert(
                "Không cập nhật được phụ tùng",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    return {
        activeOrder,
        isSubmitting,
        isSheetExpanded,
        setIsSheetExpanded,
        trackingError,
        isUpdatingOrder,
        pickupAddress,
        pickupLocation,
        locationError,
        isSearchingLocation,
        selectedOption,
        setSelectedOption,
        handlePickupAddressChange,
        searchPickupLocation,
        requestCurrentLocation,
        submitBooking,
        cancelOrder,
        respondToParts,
    };
};

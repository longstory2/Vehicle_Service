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
    offers?: {
        technicianId: string | { _id?: string; fullName?: string };
        response: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    }[];
    candidateTechnicians?: TechnicianCandidate[];
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

export type TechnicianCandidate = {
    technicianId: string;
    fullName: string;
    distanceKm: number;
    ratingAvg: number | null;
    ratingCount: number;
    score: number;
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
    const [technicianCandidates, setTechnicianCandidates] = useState<TechnicianCandidate[]>([]);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
    const [isCandidateModalVisible, setIsCandidateModalVisible] = useState(false);
    const submissionInProgress = useRef(false);
    const handledRejectionKey = useRef<string | null>(null);
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

    const buildOrderPayload = () => {
        const selectedCategory = serviceCategories.find((item) => item.id === details.categoryId);
        const selectedSparePart = spareParts.find((item) => item.id === details.sparePartId);

        return {
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
            address: pickupLocation?.address ?? "",
            location: pickupLocation
                ? {
                    latitude: pickupLocation.latitude,
                    longitude: pickupLocation.longitude,
                }
                : undefined,
            estimatedPrice: details.estimatedPrice,
            paymentMethod: selectedOption,
        };
    };

    const submitBooking = async () => {
        if (!pickupLocation) {
            Alert.alert(
                "Chưa chọn điểm đón",
                "Nhập địa chỉ rồi bấm Tìm để hiển thị vị trí trên bản đồ.",
            );
            return;
        }
        if (submissionInProgress.current) return;

        submissionInProgress.current = true;
        setIsSubmitting(true);
        try {
            const candidates = await apiRequest<TechnicianCandidate[]>("/orders/candidates", {
                method: "POST",
                body: buildOrderPayload(),
            });

            if (candidates.length === 0) {
                Alert.alert(
                    "Chưa có kỹ thuật viên phù hợp",
                    "Hiện không có kỹ thuật viên phù hợp quanh vị trí của bạn. Vui lòng thử lại sau.",
                );
                return;
            }

            setTechnicianCandidates(candidates);
            setSelectedTechnicianId(null);
            setIsCandidateModalVisible(true);
        } catch (error) {
            Alert.alert(
                "Không tìm được kỹ thuật viên",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            submissionInProgress.current = false;
            setIsSubmitting(false);
        }
    };

    const selectTechnician = async (technicianId: string) => {
        if (submissionInProgress.current || !pickupLocation) return;

        submissionInProgress.current = true;
        setIsSubmitting(true);
        try {
            const updatedOrder = activeOrder
                ? await apiRequest<ActiveOrder>(
                    `/orders/${activeOrder._id}/select-technician`,
                    { method: "PUT", body: { technicianId } },
                )
                : await apiRequest<ActiveOrder>("/orders", {
                    method: "POST",
                    body: { ...buildOrderPayload(), technicianId },
                });

            setActiveOrder(updatedOrder);
            setSelectedTechnicianId(null);
            setIsCandidateModalVisible(false);
            setIsSheetExpanded(false);
        } catch (error) {
            Alert.alert(
                "Không gửi được đơn",
                error instanceof Error ? error.message : "Vui lòng tải lại danh sách kỹ thuật viên.",
            );
        } finally {
            submissionInProgress.current = false;
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

                    const latestOffer = latest.offers?.at(-1);
                    if (latest.status === "PENDING" && latestOffer?.response === "REJECTED") {
                        const rejectionKey = `${latest._id}:${latest.offers?.length ?? 0}`;
                        if (handledRejectionKey.current !== rejectionKey) {
                            handledRejectionKey.current = rejectionKey;
                            const offeredIds = new Set(
                                latest.offers?.map((offer) =>
                                    typeof offer.technicianId === "string"
                                        ? offer.technicianId
                                        : offer.technicianId._id ?? "",
                                ),
                            );
                            const remainingCandidates = (latest.candidateTechnicians ?? [])
                                .filter((candidate) => !offeredIds.has(candidate.technicianId));

                            if (remainingCandidates.length > 0) {
                                setTechnicianCandidates(remainingCandidates);
                                setSelectedTechnicianId(null);
                                setIsCandidateModalVisible(true);
                            } else {
                                Alert.alert(
                                    "Không còn kỹ thuật viên",
                                    "Các kỹ thuật viên phù hợp đã từ chối hoặc không còn khả dụng. Bạn có thể hủy đơn và thử đặt lại.",
                                );
                            }
                        }
                    }
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

        void refreshOrder();
        const timer = setInterval(() => void refreshOrder(), 2000);
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
        technicianCandidates,
        selectedTechnicianId,
        setSelectedTechnicianId,
        isCandidateModalVisible,
        closeCandidateModal: () => {
            if (activeOrder?.offers?.at(-1)?.response === "REJECTED") return;
            setIsCandidateModalVisible(false);
        },
        selectTechnician,
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

export type Order = {
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
    technicianId?: { fullName?: string } | null;
    customerRating?: { score: number | null; comment: string };
};

export const statusLabels: Record<string, string> = {
    PENDING: "Đang tìm kỹ thuật viên",
    ACCEPTED: "Đã xác nhận",
    ARRIVED: "Đã đến nơi",
    INSPECTING: "Đang kiểm tra",
    AWAITING_PARTS_APPROVAL: "Chờ duyệt phụ tùng",
    REPAIRING: "Đang sửa chữa",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
};

export const formatCurrency = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;
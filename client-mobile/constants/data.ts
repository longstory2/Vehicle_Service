import serviceImage1 from "../assets/images/popular-service-1.png"
import serviceImage2 from "../assets/images/popular-service-2.png"
import serviceImage3 from "../assets/images/popular-service-3.png"
import avatar from "../assets/images/avatar.png";
export const popularServices = [
    {
        id: 1,
        title: "Thay nhớt xe",
        price: "150.000 VND",
        image: serviceImage1,
    },
    {
        id: 2,
        title: "Thay vỏ xe máy",
        price: "75.000 VND",
        image: serviceImage2,
    },
    {
        id: 3,
        title: "Thay vỏ xe ô tô",
        price: "150.000 VND",
        image: serviceImage3,
    },
];

export const serviceCategories = [
    { id: "repair", title: "Sửa chữa bảo dưỡng", icon: "🧑‍🔧" },
    { id: "parts", title: "Thay phụ tùng", icon: "🛠️" },
    { id: "other", title: "Vấn đề khác", icon: "🔧" },
];

export const bookingPreview = {
    pickupAddress: "Phan Đăng Lưu, Bình Thạnh, TP. Hồ Chí Minh",
    vehicleInfo: [
        { label: "Loại xe", value: "Xe máy" },
        { label: "Hãng xe", value: "Honda" },
        { label: "Biển số xe", value: "R-123-22" },
    ],
    serviceInfo: [
        { label: "Loại dịch vụ", value: "Thay phụ tùng" },
        { label: "Phụ tùng", value: "Vỏ xe" },
        { label: "Mô tả", value: "Mô tả của khách hàng" },
    ],
    estimatedPrice: 150000,
};

export const UserCustomer = [
    {
        id: 1,
        avatar: avatar,
        Name: "Lê Văn A",
        phoneNumber: "01234567890",
        email: "nguyenphamquynhlong@gmail.com", //lấy từ clerk
    }
]

export const data = {
    popularServices,
    serviceCategories,
    bookingPreview,
};
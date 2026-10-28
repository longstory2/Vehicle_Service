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

export type CatalogOption = { id: string; label: string };

export const vehicleTypes: CatalogOption[] = [
    { id: "motorcycle", label: "Xe máy" },
    { id: "car", label: "Ô tô" },
];

export const motorcycleMakes: CatalogOption[] = [
    { id: "honda", label: "Honda" },
    { id: "yamaha", label: "Yamaha" },
    { id: "suzuki", label: "Suzuki" },
    { id: "sym", label: "SYM" },
    { id: "piaggio", label: "Piaggio" },
    { id: "kymco", label: "Kymco" },
    { id: "kawasaki", label: "Kawasaki" },
    { id: "ducati", label: "Ducati" },
    { id: "bmw-motorrad", label: "BMW Motorrad" },
    { id: "royal-enfield", label: "Royal Enfield" },
    { id: "vinfast", label: "VinFast" },
    { id: "other", label: "Khác" },
];

export const carMakes: CatalogOption[] = [
    { id: "toyota", label: "Toyota" },
    { id: "hyundai", label: "Hyundai" },
    { id: "kia", label: "Kia" },
    { id: "ford", label: "Ford" },
    { id: "mitsubishi", label: "Mitsubishi" },
    { id: "mazda", label: "Mazda" },
    { id: "honda", label: "Honda" },
    { id: "vinfast", label: "VinFast" },
    { id: "mercedes-benz", label: "Mercedes-Benz" },
    { id: "bmw", label: "BMW" },
    { id: "lexus", label: "Lexus" },
    { id: "suzuki", label: "Suzuki" },
    { id: "nissan", label: "Nissan" },
    { id: "isuzu", label: "Isuzu" },
    { id: "peugeot", label: "Peugeot" },
    { id: "subaru", label: "Subaru" },
    { id: "volkswagen", label: "Volkswagen" },
    { id: "audi", label: "Audi" },
    { id: "volvo", label: "Volvo" },
    { id: "mg", label: "MG" },
    { id: "byd", label: "BYD" },
    { id: "other", label: "Khác" },
];

// A combined list keeps existing booking screens able to resolve a selected make ID.
export const vehicleMakes: CatalogOption[] = Array.from(
    new Map([...motorcycleMakes, ...carMakes].map((make) => [make.id, make])).values(),
);

export type SparePartOption = CatalogOption & {
    vehicleTypeIds: string[];
    estimatedPrice: number;
};

export const spareParts: SparePartOption[] = [
    { id: "motorcycle-tire", label: "Lốp xe máy", vehicleTypeIds: ["motorcycle"], estimatedPrice: 75000 },
    { id: "car-tire", label: "Lốp xe ô tô", vehicleTypeIds: ["car"], estimatedPrice: 900000 },
    { id: "engine-oil", label: "Dầu nhớt", vehicleTypeIds: ["motorcycle", "car"], estimatedPrice: 150000 },
    { id: "battery", label: "Ắc quy", vehicleTypeIds: ["motorcycle", "car"], estimatedPrice: 350000 },
    { id: "brake", label: "Phanh", vehicleTypeIds: ["motorcycle", "car"], estimatedPrice: 220000 },
    { id: "other", label: "Khác", vehicleTypeIds: ["motorcycle", "car"], estimatedPrice: 0 },
];

export const serviceEstimatedPrices: Record<string, number> = {
    repair: 150000,
    other: 0,
};

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
        email: "nguyenphamquynhlong@gmail.com", //lấy từ server (useAuth)
    }
]

export const data = {
    popularServices,
    serviceCategories,
    vehicleTypes,
    vehicleMakes,
    motorcycleMakes,
    carMakes,
    spareParts,
    serviceEstimatedPrices,
    bookingPreview,
};
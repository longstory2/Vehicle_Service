import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View, } from "react-native";
import CustomButton from "../../../../components/CustomButton";
import { carMakes, motorcycleMakes, serviceCategories, spareParts, vehicleMakes, vehicleTypes, type CatalogOption, } from "../../../../constants/data";
import { images } from "../../../../constants/index";
import { router } from "expo-router";
import { FormInput } from "../../../../components/InputField";
import { apiRequest } from "../../../../utils/api";
type ServiceCategory = (typeof serviceCategories)[number];
type FormValues = Record<string, string>;
const paymentMethods: CatalogOption[] = [
    { id: "cash", label: "Tiền mặt" },
    { id: "momo", label: "MoMo" },
    { id: "vnpay", label: "VNPay" },
];

type ServiceRecord = {
    _id: string;
    name: string;
    description: string;
    vehicleType: "motorbike" | "car";
    price: number;
    estimatedMinutes: number;
};

const DEFAULT_SERVICE_NAME = "Kiểm tra, chẩn đoán tại chỗ";

const service = () => {
    const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
    const [values, setValues] = useState<FormValues>({});
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [services, setServices] = useState<ServiceRecord[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [servicesError, setServicesError] = useState("");
    const [reloadServices, setReloadServices] = useState(0);
    const compatibleServices = services.filter((item) =>
        !values.vehicleType || item.vehicleType === (values.vehicleType === "motorcycle" ? "motorbike" : values.vehicleType),
    );
    const defaultService = compatibleServices.find(
        (item) => item.name.trim().toLocaleLowerCase("vi") === DEFAULT_SERVICE_NAME.toLocaleLowerCase("vi"),
    );
    const selectedService = compatibleServices.find((item) => item._id === values.serviceId);
    const compatibleParts = spareParts.filter((item) =>
        !values.vehicleType || item.vehicleTypeIds.includes(values.vehicleType),
    );
    const selectedPart = compatibleParts.find((item) => item.id === values.sparePartId);
    const compatibleMakes = values.vehicleType === "motorcycle"
        ? motorcycleMakes
        : values.vehicleType === "car"
            ? carMakes
            : vehicleMakes;

    useEffect(() => {
        let isCurrent = true;

        const loadServices = async () => {
            setIsLoadingServices(true);
            setServicesError("");
            try {
                const data = await apiRequest<ServiceRecord[]>("/services");
                if (isCurrent) setServices(data);
            } catch (error) {
                if (isCurrent) {
                    setServicesError(error instanceof Error ? error.message : "Không thể tải danh sách dịch vụ.");
                }
            } finally {
                if (isCurrent) setIsLoadingServices(false);
            }
        };

        void loadServices();
        return () => {
            isCurrent = false;
        };
    }, [reloadServices]);

    // Select the preferred real API service after both the vehicle type and services are available.
    useEffect(() => {
        if (
            !activeCategory
            || activeCategory.id === "parts"
            || !values.vehicleType
            || isLoadingServices
            || servicesError
        ) {
            return;
        }

        setValues((current) => {
            const currentService = services.find((item) => item._id === current.serviceId);
            const vehicleType = current.vehicleType === "motorcycle" ? "motorbike" : current.vehicleType;
            if (currentService?.vehicleType === vehicleType) return current;

            const preferredService = services.find(
                (item) => item.vehicleType === vehicleType
                    && item.name.trim().toLocaleLowerCase("vi") === DEFAULT_SERVICE_NAME.toLocaleLowerCase("vi"),
            );
            return { ...current, serviceId: preferredService?._id ?? "" };
        });
    }, [activeCategory, isLoadingServices, services, servicesError, values.vehicleType]);

    const openForm = (category: ServiceCategory) => {
        setActiveCategory(category);
        setValues({ paymentMethod: "cash" });
        setOpenDropdown(null);
    };

    const closeForm = () => {
        setActiveCategory(null);
        setOpenDropdown(null);
    };

    const updateValue = (field: string, value: string) => {
        setValues((current) => {
            if (field === "vehicleType") {
                return {
                    ...current,
                    vehicleType: value,
                    vehicleMake: "",
                    serviceId: "",
                    sparePartId: "",
                };
            }

            return { ...current, [field]: value };
        });
    };

    const submitForm = () => {
        if (!activeCategory) return;

        const isPartsRequest = activeCategory.id === "parts";
        if (!isPartsRequest && isLoadingServices) {
            Alert.alert("Đang tải dịch vụ", "Vui lòng chờ tải xong danh sách dịch vụ rồi thử lại.");
            return;
        }
        if (!isPartsRequest && servicesError) {
            Alert.alert("Không thể tải dịch vụ", "Vui lòng tải lại danh sách dịch vụ trước khi tiếp tục.");
            return;
        }

        const requiredFields = ["vehicleType", "vehicleMake", "plate"];
        if (isPartsRequest) {
            requiredFields.push("sparePartId");
        } else {
            requiredFields.push("serviceId");
        }
        if (activeCategory.id === "other") requiredFields.push("description");

        if (requiredFields.some((field) => !values[field]?.trim())) {
            Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các trường bắt buộc.");
            return;
        }

        if (isPartsRequest) {
            const part = spareParts.find(
                (item) => item.id === values.sparePartId && item.vehicleTypeIds.includes(values.vehicleType),
            );
            if (!part) {
                Alert.alert("Phụ tùng không hợp lệ", "Vui lòng chọn phụ tùng phù hợp với loại xe.");
                return;
            }

            const params = {
                categoryId: activeCategory.id,
                vehicleTypeId: values.vehicleType,
                vehicleMakeId: values.vehicleMake,
                plate: values.plate.trim(),
                sparePartId: part.id,
                description: values.description?.trim() || "",
                estimatedPrice: String(part.estimatedPrice),
                paymentMethod: values.paymentMethod || "cash",
            };
            closeForm();
            router.push({ pathname: "/(tabs)/(CustomerTab)/book", params });
            return;
        }

        const service = services.find((item) => item._id === values.serviceId);
        if (!service || service.vehicleType !== (values.vehicleType === "motorcycle" ? "motorbike" : values.vehicleType)) {
            Alert.alert("Dịch vụ không hợp lệ", "Vui lòng chọn dịch vụ phù hợp với loại xe.");
            return;
        }
        const params = {
            categoryId: activeCategory.id,
            vehicleTypeId: values.vehicleType,
            vehicleMakeId: values.vehicleMake,
            plate: values.plate.trim(),
            serviceId: service._id,
            serviceName: service.name,
            description: values.description?.trim() || "",
            estimatedPrice: String(service.price),
            paymentMethod: values.paymentMethod || "cash",
        };

        closeForm();
        router.push({ pathname: "/(tabs)/(CustomerTab)/book", params });
    };

    const renderSelect = (field: string, label: string, options: CatalogOption[]) => (
        <View key={field} className="mb-3">
            <Text className="mb-1.5 text-[16px] text-black">
                {label}<Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => setOpenDropdown(openDropdown === field ? null : field)}
                className="h-14 w-full flex-row items-center justify-between rounded-xl bg-[#f4f4f4] px-4"
            >
                <Text className={`text-[16px] ${values[field] ? "text-black" : "text-[#929292]"}`}>
                    {options.find((option) => option.id === values[field])?.label || "Chọn"}
                </Text>
                <Text className="text-[20px] text-black">{openDropdown === field ? "⌃" : "⌄"}</Text>
            </TouchableOpacity>
            {openDropdown === field && (
                <View className="mt-1 rounded-xl border border-neutral-200 bg-white">
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            accessibilityRole="button"
                            onPress={() => {
                                updateValue(field, option.id);
                                setOpenDropdown(null);
                            }}
                            className="border-b border-neutral-100 px-4 py-3 last:border-b-0"
                        >
                            <Text className="text-[15px] text-black">{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <ScrollView className="flex-1 bg-[#eeeeee]" showsVerticalScrollIndicator={false}>
            <View className="flex-1 bg-white">
                <View className="relative w-full h-[250px]">
                    <Image source={images.signUpCar} className="z-0 h-[250px] w-full" />
                    <Text className="absolute bottom-5 left-5 text-2xl font-bold text-black">
                        Các dịch vụ
                    </Text>
                </View>
            </View>
            <View className="flex-row gap-3">
                {serviceCategories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        accessibilityRole="button"
                        onPress={() => openForm(category)}
                        className="min-h-[145px] flex-1 items-center justify-center rounded-xl bg-[#2795c8] px-2 py-4">
                        <Text className="text-[38px]">{category.icon}</Text>
                        <Text className="mt-3 text-center text-[14px] text-white">
                            {category.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View className="bg-white px-4 pb-5 mt-2">
                <Text className="mb-3 text-lg text-black font-bold">
                    Dịch vụ hiện có
                </Text>
                {isLoadingServices ? (
                    <View className="flex-row items-center py-3">
                        <ActivityIndicator color="#2795c8" />
                        <Text className="ml-2 text-[#666]">Đang tải dịch vụ...</Text>
                    </View>
                ) : servicesError ? (
                    <View className="rounded-xl bg-[#fff1f0] p-4">
                        <Text className="text-[#b42318]">{servicesError}</Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() => setReloadServices((current) => current + 1)}
                            className="mt-3 self-start"
                        >
                            <Text className="text-[#1677a8]">Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                ) : services.length === 0 ? (
                    <Text className="py-3 text-[#666]">Hiện chưa có dịch vụ nào.</Text>
                ) : (
                    services.map((item) => (
                        <View key={item._id} className="mb-2 rounded-xl border border-neutral-200 bg-white p-4">
                            <View className="flex-row items-start justify-between">
                                <Text className="flex-1 pr-3 text-[16px] text-black">
                                    {item.name}
                                </Text>
                                <Text className="text-[#1677a8]">
                                    {item.price.toLocaleString("vi-VN")} đ
                                </Text>
                            </View>
                            <Text className="mt-1 text-sm text-[#666]">
                                {item.vehicleType === "motorbike" ? "Xe máy" : "Ô tô"} · {item.estimatedMinutes} phút
                            </Text>
                            {item.description ? (
                                <Text className="mt-1 text-sm text-[#666]">{item.description}</Text>
                            ) : null}
                        </View>
                    ))
                )}
            </View>
            <Modal
                visible={activeCategory !== null}
                transparent
                animationType="fade"
                onRequestClose={closeForm}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    className="flex-1 justify-center bg-white/80 px-5 py-8"
                >
                    <View className="w-full max-h-[88%] rounded-[36px] bg-white px-5 pb-5 pt-4">
                        <View className="mb-3 min-h-10 flex-row items-center justify-center">
                            <Text className="flex-1 text-center text-[16px] text-black font-bold">
                                {activeCategory?.id === "repair" ? "Đơn thông tin bảo dưỡng" : activeCategory?.id === "parts" ? "Đơn thông tin thay phụ tùng" : "Đơn thông tin các vấn đề"}
                            </Text>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Đóng biểu mẫu"
                                onPress={closeForm}
                                className="absolute right-0 h-10 w-10 items-center justify-center"
                            >
                                <Text className="text-[30px] leading-9 text-black">x</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}>
                            {renderSelect("vehicleType", "Loại xe", vehicleTypes)}
                            {values.vehicleType ? (
                                <>
                                    {activeCategory?.id === "parts" ? (
                                        <>
                                            {renderSelect(
                                                "sparePartId",
                                                "Phụ tùng cần thay",
                                                compatibleParts.map(({ id, label }) => ({ id, label })),
                                            )}
                                            {compatibleParts.length === 0 ? (
                                                <Text className="mb-3 text-sm text-[#b42318]">
                                                    Không có phụ tùng nào phù hợp với loại xe này.
                                                </Text>
                                            ) : null}
                                            {renderSelect("paymentMethod", "Phương thức thanh toán", paymentMethods)}
                                            {selectedPart ? (
                                                <View className="mb-3 rounded-xl bg-[#eaf7fc] p-3">
                                                    <Text className="text-[#1677a8]">
                                                        Giá dự kiến: {selectedPart.estimatedPrice.toLocaleString("vi-VN")} đ
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </>
                                    ) : (
                                        <>
                                            {compatibleServices.length > 0
                                                ? renderSelect(
                                                    "serviceId",
                                                    "Dịch vụ cần thực hiện",
                                                    compatibleServices.map((item) => ({
                                                        id: item._id,
                                                        label: item.name,
                                                    })),
                                                )
                                                : null}
                                            {compatibleServices.length > 0 && !isLoadingServices && !servicesError && !defaultService ? (
                                                <Text className="mb-3 text-sm text-[#b42318]">
                                                    Không tìm thấy dịch vụ mặc định “{DEFAULT_SERVICE_NAME}” cho loại xe này.
                                                    {" "}Vui lòng chọn dịch vụ khác.
                                                </Text>
                                            ) : null}
                                            {compatibleServices.length === 0 && !isLoadingServices && !servicesError ? (
                                                <Text className="mb-3 text-sm text-[#b42318]">
                                                    Không có dịch vụ nào phù hợp với loại xe này.
                                                </Text>
                                            ) : null}
                                            {isLoadingServices ? (
                                                <View className="mb-3 flex-row items-center">
                                                    <ActivityIndicator size="small" color="#2795c8" />
                                                    <Text className="ml-2 text-sm text-[#666]">Đang tải lựa chọn dịch vụ...</Text>
                                                </View>
                                            ) : null}
                                            {servicesError ? (
                                                <View className="mb-3 rounded-xl bg-[#fff1f0] p-3">
                                                    <Text className="text-sm text-[#b42318]">{servicesError}</Text>
                                                    <TouchableOpacity
                                                        accessibilityRole="button"
                                                        onPress={() => setReloadServices((current) => current + 1)}
                                                        className="mt-2 self-start"
                                                    >
                                                        <Text className="text-[#1677a8]">Tải lại</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : null}
                                            {selectedService ? (
                                                <View className="mb-3 rounded-xl bg-[#eaf7fc] p-3">
                                                    <Text className="text-[#1677a8]">
                                                        Giá dự kiến: {selectedService.price.toLocaleString("vi-VN")} đ
                                                    </Text>
                                                    <Text className="mt-1 text-sm text-[#555]">
                                                        Thời gian dự kiến: {selectedService.estimatedMinutes} phút
                                                    </Text>
                                                    {selectedService.description ? (
                                                        <Text className="mt-1 text-sm text-[#555]">{selectedService.description}</Text>
                                                    ) : null}
                                                </View>
                                            ) : null}
                                            {renderSelect("paymentMethod", "Phương thức thanh toán", paymentMethods)}
                                        </>
                                    )}
                                </>
                            ) : null}
                            {renderSelect("vehicleMake", "Hãng xe", compatibleMakes)}
                            <FormInput
                                label="Biển số xe"
                                required
                                value={values.plate || ""}
                                onChangeText={(value) => updateValue("plate", value)}
                                placeholder="Nhập biển số xe"
                            />
                            <FormInput
                                label="Mô tả"
                                required={activeCategory?.id === "other"}
                                value={values.description || ""}
                                onChangeText={(value) => updateValue("description", value)}
                                placeholder="Nhập mô tả"
                                multiline
                            />
                        </ScrollView>

                        <CustomButton
                            title="Tiếp theo"
                            onPress={submitForm}
                            className="mt-2 w-4/5 self-center rounded-2xl bg-[#a9e1ff] py-4 shadow-none"
                            textVariant="primary"
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
};

export default service;
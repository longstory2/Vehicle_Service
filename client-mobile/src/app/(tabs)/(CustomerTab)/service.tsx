import { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import CustomButton from "../../../../components/CustomButton";
import {
    serviceCategories,
    spareParts,
    vehicleMakes,
    vehicleTypes,
    type CatalogOption,
} from "../../../../constants/data";
import { images } from "../../../../constants/index";
import { router } from "expo-router";

type ServiceCategory = (typeof serviceCategories)[number];
type FormValues = Record<string, string>;

const FormInput = ({
    label,
    required = false,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    keyboardType = "default",
}: {
    label: string;
    required?: boolean;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    keyboardType?: "default" | "phone-pad" | "numeric";
}) => (
    <View className="mb-3">
        <Text className="mb-1.5 text-[16px] font-Jakarta-Bold text-black">
            {label}{required && <Text className="text-red-500">*</Text>}
        </Text>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#929292"
            keyboardType={keyboardType}
            multiline={multiline}
            textAlignVertical={multiline ? "top" : "center"}
            className={`w-full rounded-xl bg-[#f4f4f4] px-4 text-[16px] text-black ${multiline ? "h-28 py-3" : "h-14"}`}
        />
    </View>
);

const service = () => {
    const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
    const [values, setValues] = useState<FormValues>({});
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const openForm = (category: ServiceCategory) => {
        setActiveCategory(category);
        setValues({});
        setOpenDropdown(null);
    };

    const closeForm = () => {
        setActiveCategory(null);
        setOpenDropdown(null);
    };

    const updateValue = (field: string, value: string) => {
        setValues((current) => {
            if (field === "vehicleType") {
                const currentPart = spareParts.find((part) => part.id === current.sparePart);
                const partIsCompatible = currentPart?.vehicleTypeIds.includes(value);
                return {
                    ...current,
                    vehicleType: value,
                    sparePart: partIsCompatible ? current.sparePart : "",
                };
            }

            return { ...current, [field]: value };
        });
    };

    const submitForm = () => {
        if (!activeCategory) return;

        const requiredFields = activeCategory.id === "parts"
            ? ["vehicleType", "vehicleMake", "plate", "sparePart"]
            : ["vehicleType", "vehicleMake", "plate", "mileage"];

        if (requiredFields.some((field) => !values[field]?.trim())) {
            Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các trường bắt buộc.");
            return;
        }

        const selectedSparePart = spareParts.find((part) => part.id === values.sparePart);
        const params = {
            categoryId: activeCategory.id,
            vehicleTypeId: values.vehicleType,
            vehicleMakeId: values.vehicleMake,
            plate: values.plate.trim(),
            sparePartId: values.sparePart || "",
            mileage: values.mileage?.trim() || "",
            description: values.description?.trim() || "",
            estimatedPrice: String(selectedSparePart?.estimatedPrice ?? ""),
        };

        closeForm();
        router.push({ pathname: "/(tabs)/(CustomerTab)/book", params });
    };

    const renderSelect = (field: string, label: string, options: CatalogOption[]) => (
        <View key={field} className="mb-3">
            <Text className="mb-1.5 text-[16px] font-Jakarta-Bold text-black">
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
                    <Text className="absolute bottom-5 left-5 text-2xl text-black font-Jakarta-ExtraBold">
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
                        className="min-h-[145px] flex-1 items-center justify-center rounded-xl bg-[#2795c8] px-2 py-4"
                    >
                        <Text className="text-[38px]">{category.icon}</Text>
                        <Text className="mt-3 text-center text-[14px] text-white">
                            {category.title}
                        </Text>
                    </TouchableOpacity>
                ))}
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
                            <Text className="flex-1 text-center text-[21px] font-Jakarta-Bold text-black">
                                {activeCategory?.id === "repair"
                                    ? "Đơn thông tin bảo dưỡng"
                                    : activeCategory?.id === "parts"
                                        ? "Đơn thông tin thay phụ tùng"
                                        : "Đơn thông tin các vấn đề"}
                            </Text>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Đóng biểu mẫu"
                                onPress={closeForm}
                                className="absolute right-0 h-10 w-10 items-center justify-center"
                            >
                                <Text className="text-[30px] leading-9 text-black">×</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}
                        >
                            {renderSelect("vehicleType", "Loại xe", vehicleTypes)}
                            {renderSelect("vehicleMake", "Hãng xe", vehicleMakes)}
                            <FormInput
                                label="Biển số xe"
                                required
                                value={values.plate || ""}
                                onChangeText={(value) => updateValue("plate", value)}
                                placeholder="Nhập biển số xe"
                            />
                            {activeCategory?.id === "parts" ? (
                                renderSelect(
                                    "sparePart",
                                    "Phụ tùng",
                                    spareParts.filter((part) =>
                                        !values.vehicleType || part.vehicleTypeIds.includes(values.vehicleType),
                                    ),
                                )
                            ) : (
                                <FormInput
                                    label="Số Km hiện tại"
                                    required
                                    value={values.mileage || ""}
                                    onChangeText={(value) => updateValue("mileage", value)}
                                    placeholder="Nhập số Km hiện tại"
                                    keyboardType="numeric"
                                />
                            )}
                            <FormInput
                                label="Mô tả"
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
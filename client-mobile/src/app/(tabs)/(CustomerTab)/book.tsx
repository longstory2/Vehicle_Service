import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View, Image, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { serviceCategories, serviceEstimatedPrices, spareParts, vehicleMakes, vehicleTypes, } from "../../../../constants/data";
import LeafletMap from "../../../../components/LeafletMap";
import { icons } from "../../../../constants/icon";
import DraggableOrderSheet from "../../../../components/DraggableOrderSheet";
import BackButton from "../../../../components/BackButton";
import { useBooking } from "../../../../utils/useBooking";
import technicianAvatar from "../../../../assets/images/avatar.png";

type BookingParams = {
    categoryId?: string | string[];
    vehicleTypeId?: string | string[];
    vehicleMakeId?: string | string[];
    plate?: string | string[];
    serviceName?: string | string[];
    sparePartId?: string | string[];
    mileage?: string | string[];
    description?: string | string[];
    estimatedPrice?: string | string[];
    paymentMethod?: string | string[];
};

const readParam = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] ?? "" : value ?? "";

const BookScreen = () => {
    const params = useLocalSearchParams<BookingParams>();
    const categoryId = readParam(params.categoryId);
    const vehicleTypeId = readParam(params.vehicleTypeId);
    const vehicleMakeId = readParam(params.vehicleMakeId);
    const plate = readParam(params.plate);
    const serviceName = readParam(params.serviceName);
    const sparePartId = readParam(params.sparePartId);
    const mileage = readParam(params.mileage);
    const description = readParam(params.description);
    const routePrice = readParam(params.estimatedPrice);
    const routePaymentMethod = readParam(params.paymentMethod);
    const paymentMethod = routePaymentMethod === "momo" || routePaymentMethod === "vnpay"
        ? routePaymentMethod
        : "cash";
    const selectedCategory = serviceCategories.find((item) => item.id === categoryId);
    const selectedSparePart = spareParts.find((item) => item.id === sparePartId);
    const selectedPrice = Number(routePrice);
    const estimatedPrice = routePrice !== "" && Number.isFinite(selectedPrice)
        ? selectedPrice
        : selectedSparePart?.estimatedPrice
        ?? serviceEstimatedPrices[categoryId]
        ?? 0;

    const {
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
        handlePickupAddressChange,
        searchPickupLocation,
        requestCurrentLocation,
        submitBooking,
        cancelOrder,
        respondToParts,
    } = useBooking({
        categoryId,
        vehicleTypeId,
        vehicleMakeId,
        plate,
        serviceName,
        sparePartId,
        mileage,
        description,
        estimatedPrice,
        paymentMethod,
    });

    const serviceRows = [
        { label: "Loại dịch vụ", value: selectedCategory?.title ?? "Chưa có loại dịch vụ" },
        ...(serviceName ? [{ label: "Dịch vụ cần thực hiện", value: serviceName }] : []),
        ...(selectedSparePart ? [{ label: "Phụ tùng", value: selectedSparePart.label }] : []),
        ...(mileage ? [{ label: "Số Km hiện tại", value: `${mileage} km` }] : []),
        { label: "Mô tả", value: description || "Chưa có mô tả" },
    ];

    const { height } = useWindowDimensions();
    const mapHeight = height * 0.56;

    const vehicleRows = [
        {
            label: "Loại xe",
            value: vehicleTypes.find((item) => item.id === vehicleTypeId)?.label ?? "Chưa có loại xe",
        },
        {
            label: "Hãng xe",
            value: vehicleMakes.find((item) => item.id === vehicleMakeId)?.label ?? "Chưa có hãng xe",
        },
        {
            label: "Biển số xe",
            value: plate || "Chưa có biển số",
        },
    ];

    if (activeOrder) {
        const orderStatusText = {
            PENDING: "Đang tìm kỹ thuật viên",
            ACCEPTED: "Kỹ thuật viên đã xác nhận đơn",
            ARRIVED: "Kỹ thuật viên đã đến vị trí của bạn",
            INSPECTING: "Đang kiểm tra",
            AWAITING_PARTS_APPROVAL: "Chờ bạn xác nhận phụ tùng",
            REPAIRING: "Đang sửa chữa",
            COMPLETED: "Đơn đã hoàn thành",
            CANCELLED: "Đơn đã hủy",
        }[activeOrder.status];

        const orderVehicleRows = [
            { label: "Loại xe", value: activeOrder.serviceDetails.vehicleType || "Chưa có" },
            { label: "Hãng xe", value: activeOrder.serviceDetails.vehicleMake || "Chưa có" },
            { label: "Biển số xe", value: activeOrder.serviceDetails.plate || "Chưa có" },
        ];

        const orderServiceRows = [
            { label: "Loại dịch vụ", value: activeOrder.serviceDetails.category || "Chưa có" },
            ...(activeOrder.serviceDetails.serviceName
                ? [{ label: "Dịch vụ", value: activeOrder.serviceDetails.serviceName }]
                : []),
            ...(activeOrder.serviceDetails.sparePart
                ? [{ label: "Phụ tùng", value: activeOrder.serviceDetails.sparePart }]
                : []),
            { label: "Mô tả", value: activeOrder.serviceDetails.description || "Không có" },
        ];

        return (
            <View className="flex-1 bg-[#eeeeee]">
                <View className="absolute inset-0">
                    <LeafletMap
                        location={{ ...activeOrder.location, address: activeOrder.address }}
                        technicianLocation={
                            activeOrder.technicianLocation &&
                                Number.isFinite(activeOrder.technicianLocation.latitude) &&
                                Number.isFinite(activeOrder.technicianLocation.longitude)
                                ? activeOrder.technicianLocation
                                : null
                        }
                        pickupLabel="Điểm sửa xe"
                    />
                </View>

                <View pointerEvents="box-none" className="absolute top-0 left-0 right-0 z-10 flex-row items-center gap-2 p-4 pt-12">
                    <BackButton />
                    <Text className="rounded-[18px] bg-white px-3.5 py-2.5 text-base font-bold text-[#111111] shadow-md">
                        Đơn của bạn
                    </Text>
                </View>

                <DraggableOrderSheet
                    expanded={isSheetExpanded}
                    onExpandedChange={setIsSheetExpanded}
                    screenHeight={height}
                    swipeEnabled
                    compactContent={
                        <View className="px-[22px] pb-3">
                            <View className="flex-row items-start justify-between">
                                <View className="flex-1 pr-3">
                                    <Text className="text-[21px] font-bold text-[#111111]">{orderStatusText}</Text>
                                    {/* <Text numberOfLines={1} className="mt-1 text-sm text-[#555555]">
                                        {activeOrder.technicianLocation
                                            ? "Vị trí hiện tại của kỹ thuật viên trên bản đồ"
                                            : "Đang chờ vị trí của kỹ thuật viên"}
                                    </Text> */}
                                </View>
                                {/* <Text className="pt-1 text-base text-[#18aef5]">2 phút</Text> */}
                            </View>
                            <Text numberOfLines={1} className="mt-3 text-sm text-[#555555]">
                                {activeOrder.address}
                            </Text>
                            {activeOrder.technicianId ? (
                                <View className="mt-3 flex-row items-center">
                                    <Image source={icons.techAvatar} className="h-12 w-12 rounded-full" />
                                    <Text className="ml-3 text-[17px] font-bold text-[#111111]">
                                        {activeOrder.technicianId.fullName}
                                    </Text>
                                </View>
                            ) : (
                                <Text className="mt-1.5 text-[13px] text-[#777777]">
                                    Đơn sẽ được cập nhật khi có kỹ thuật viên nhận.
                                </Text>
                            )}
                        </View>
                    }>
                    {activeOrder.technicianId ? (
                        <View className="mb-3">

                            <View className="mx-[-22px] mb-3 h-[7px] bg-[#e7e7e7]" />

                            <View className="mt-3 flex-row justify-center gap-12">
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Gọi kỹ thuật viên"
                                    onPress={() => {
                                        if (activeOrder.technicianId?.phone) {
                                            void Linking.openURL(`tel:${activeOrder.technicianId.phone}`);
                                        }
                                    }}
                                    disabled={!activeOrder.technicianId.phone}
                                    className="items-center"
                                >
                                    <View className="h-12 w-12 items-center justify-center rounded-full bg-[#eeeeee]">
                                        <Image source={icons.call} className="h-7 w-7" resizeMode="contain" />
                                    </View>
                                    <Text className="mt-1 text-[16px] font-bold text-[#111111]">Gọi kỹ sư</Text>
                                </Pressable>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Nhắn tin cho kỹ thuật viên"
                                    onPress={() => {
                                        if (activeOrder.technicianId?.phone) {
                                            void Linking.openURL(`sms:${activeOrder.technicianId.phone}`);
                                        }
                                    }}
                                    disabled={!activeOrder.technicianId.phone}
                                    className="items-center">
                                    <View className="h-12 w-12 items-center justify-center rounded-full bg-[#eeeeee]">
                                        <Image source={icons.message} className="h-7 w-7" resizeMode="contain" />
                                    </View>
                                    <Text className="mt-1 text-[16px] font-bold text-[#111111]">Nhắn tin</Text>
                                </Pressable>
                            </View>
                            <View className="mx-[-22px] mt-3 h-[7px] bg-[#e7e7e7]" />
                        </View>
                    ) : null}

                    {trackingError ? (
                        <Text accessibilityRole="alert" className="mb-3 text-sm text-[#b42318]">
                            {trackingError}
                        </Text>
                    ) : null}
                    {/* <InfoSection
                        title="Thông tin kỹ thuật viên"
                        rows={[
                            {
                                label: "Họ tên",
                                value: activeOrder.technicianId?.fullName ?? "Đang tìm kỹ thuật viên",
                            },
                            {
                                label: "Số điện thoại",
                                value: activeOrder.technicianId?.phone ?? "Chưa có",
                            },
                        ]} /> */}
                    {/* <View className="h-2 mb-2.5 bg-[#e7e7e7]" /> */}
                    <InfoSection title="Địa điểm" rows={[{ label: "Địa chỉ", value: activeOrder.address }]} />
                    <View className="mx-[-22px] mb-3 h-[7px] bg-[#e7e7e7]" />
                    <InfoSection title="Thông tin xe" rows={orderVehicleRows} />
                    <View className="mx-[-22px] mb-3 h-[7px] bg-[#e7e7e7]" />
                    <InfoSection title="Thông tin dịch vụ" rows={orderServiceRows} />
                    <View className="mx-[-22px] mb-3 h-[7px] bg-[#e7e7e7]" />
                    <InfoSection
                        title="Thanh toán"
                        rows={[
                            {
                                label: "Phương thức",
                                value: activeOrder.paymentMethod === "cash"
                                    ? "Tiền mặt"
                                    : activeOrder.paymentMethod === "momo"
                                        ? "MoMo"
                                        : activeOrder.paymentMethod === "vnpay"
                                            ? "VNPay"
                                            : activeOrder.paymentMethod,
                            },
                            {
                                label: "Ước tính",
                                value: `${(activeOrder.totalPrice ?? activeOrder.estimatedPrice).toLocaleString("vi-VN")}đ`,
                            },
                        ]}
                    />

                    {activeOrder.status === "AWAITING_PARTS_APPROVAL" && activeOrder.partsProposal ? (
                        <View className="mt-3 p-3.5 rounded-xl bg-[#f4f7fb]">
                            <Text className="text-base font-bold text-[#111111]">Kỹ thuật viên đề xuất phụ tùng</Text>
                            <Text className="mt-1.5 mb-3 text-[15px] text-[#555555]">
                                {activeOrder.partsProposal.name} × {activeOrder.partsProposal.quantity} —{" "}
                                {(activeOrder.partsProposal.unitPrice * activeOrder.partsProposal.quantity).toLocaleString("vi-VN")}đ
                            </Text>
                            <View className="flex-row gap-2.5">
                                <Pressable
                                    accessibilityRole="button"
                                    disabled={isUpdatingOrder}
                                    onPress={() => void respondToParts(false)}
                                    className="min-h-[48px] flex-1 items-center justify-center mt-3 rounded-[10px] px-3 border border-[#b42318] bg-white"
                                >
                                    <Text className="text-[15px] font-bold text-[#b42318]">Từ chối</Text>
                                </Pressable>
                                <Pressable
                                    accessibilityRole="button"
                                    disabled={isUpdatingOrder}
                                    onPress={() => void respondToParts(true)}
                                    className="min-h-[48px] flex-1 items-center justify-center mt-3 rounded-[10px] px-3 bg-[#80b5f8]"
                                >
                                    <Text className="text-[15px] font-bold text-[#111111]">Đồng ý</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : null}

                    {activeOrder.status === "COMPLETED" ? (
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => router.push({
                                pathname: "/(tabs)/(CustomerTab)/bill",
                                params: { orderId: activeOrder._id },
                            })}
                            className="min-h-[48px] items-center justify-center mt-3 rounded-[10px] px-3 bg-[#80b5f8]"
                        >
                            <Text className="text-[15px] font-bold text-[#111111]">Xem hóa đơn và đánh giá</Text>
                        </Pressable>
                    ) : null}

                    {activeOrder.status === "PENDING" || activeOrder.status === "ACCEPTED" ? (
                        <Pressable
                            accessibilityRole="button"
                            disabled={isUpdatingOrder}
                            onPress={cancelOrder}
                            className="min-h-[48px] items-center justify-center mt-3 rounded-[10px] px-3 border border-[#b42318] bg-white"
                        >
                            <Text className="text-[15px] font-bold text-[#b42318]">
                                {isUpdatingOrder ? "Đang xử lý..." : "Hủy đơn"}
                            </Text>
                        </Pressable>
                    ) : null}

                    {activeOrder.technicianLocation?.updatedAt ? (
                        <Text className="mt-3 text-right text-xs text-[#777777]">
                            Vị trí cập nhật lúc{" "}
                            {new Date(activeOrder.technicianLocation.updatedAt).toLocaleTimeString("vi-VN")}
                        </Text>
                    ) : null}
                </DraggableOrderSheet>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#eeeeee]">
            <View className="relative bg-[#e8e5dc]" style={{ height: mapHeight }}>
                <LeafletMap location={pickupLocation} />
                <View
                    pointerEvents="box-none"
                    className="absolute top-0 left-0 right-0 px-4 pb-2">
                    <View className="absolute top-0 left-0 right-0 z-10 flex-row items-center gap-2 p-4 pt-12">
                        <BackButton />
                        <View className="h-[52px] flex-1 flex-row items-center rounded-[14px] bg-white px-3 shadow-md">
                            <Image
                                source={icons.location}
                                resizeMode="contain"
                                className="mr-2 h-6 w-6"
                            />
                            <TextInput
                                accessibilityLabel="Địa chỉ điểm đón"
                                editable={!isSearchingLocation}
                                onChangeText={handlePickupAddressChange}
                                onSubmitEditing={() => void searchPickupLocation()}
                                returnKeyType="search"
                                placeholder="Nhập vị trí của bạn"
                                placeholderTextColor="#858585"
                                value={pickupAddress}
                                className="flex-1 p-0 text-sm font-semibold text-[#333333]"
                            />
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Tìm địa chỉ trên bản đồ"
                            disabled={isSearchingLocation}
                            onPress={() => void searchPickupLocation()}
                            className="min-w-[52px] h-12 items-center justify-center rounded-[14px] bg-[#e8f5ef]"
                        >
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
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Định vị vị trí hiện tại bằng GPS"
                    onPress={requestCurrentLocation}
                    className="absolute right-[18px] bottom-[38px] w-12 h-12 items-center justify-center rounded-full bg-white shadow-md"
                >
                    <Text className="text-[31px] leading-[35px] text-[#16835d]">◎</Text>
                </Pressable>
            </View>

            <View className="flex-1 -mt-[22px] overflow-hidden rounded-t-[28px] bg-[#f4f4f4]">
                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 10, paddingBottom: 14 }}
                    className="flex-1">
                    <View className="self-center w-[72px] h-[5] mb-6 rounded-[3px] bg-[#ffffff]" />
                    <InfoSection title="Thông tin xe" rows={vehicleRows} />
                    <View className="mx-[-22px] mb-3 h-[7px] bg-[#e7e7e7]" />
                    <InfoSection title="Mô tả dịch vụ" rows={serviceRows} />
                </ScrollView>

                <View className="border-t border-[#e9e9e9] bg-[#f7f7f7] px-[22px] pt-2.5 pb-2">
                    <View
                        accessibilityLabel="Phương thức thanh toán đã chọn"
                        className="min-h-[58px] flex-row items-center justify-between mb-2 rounded-xl bg-white px-3 py-2">
                        <View className="flex-row items-center gap-2.5">
                            <Image source={icons.payment}
                                resizeMode="contain"
                                className="mr-2 h-10 w-10" />
                            <View>
                                <Text className="text-xs text-[#777777]">Phương thức thanh toán</Text>
                                <Text className="mt-0.5 text-base font-bold text-[#222222]">
                                    {paymentMethod === "cash"
                                        ? "Tiền mặt"
                                        : paymentMethod === "momo"
                                            ? "MoMo"
                                            : "VNPay"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="min-h-[78px] flex-row items-center justify-between gap-3">
                        <View className="flex-1">
                            <Text className="text-[17px] font-bold text-[#111111]">Chi phí</Text>
                            <Text className="mt-0.5 text-[17px] font-bold text-[#38c98d]">
                                Ước tính: {estimatedPrice.toLocaleString("vi-VN")} VND
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            disabled={isSubmitting}
                            onPress={() => void submitBooking()}
                            className="min-w-[145px] min-h-[58px] items-center justify-center rounded-[13px] bg-[#a9dfff] px-[18px]"
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-[17px] font-bold text-[#111111]">Đặt đơn</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
};

type InfoRow = { label: string; value: string };

const InfoSection = ({ title, rows }: { title: string; rows: InfoRow[] }) => (
    <View className="px-[22px] pb-3.5">
        <Text className="mb-2 text-lg font-bold text-[#111111]">{title}</Text>
        {rows.map((row) => (
            <View key={row.label} className="min-h-[30px] flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-base font-semibold text-[#858585]">{row.label}</Text>
                <Text className="flex-1 text-base font-bold text-[#111111] text-right">{row.value}</Text>
            </View>
        ))}
    </View>
);

export default BookScreen;
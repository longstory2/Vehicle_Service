import { useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View, type ImageSourcePropType, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { icons } from "../../../../constants/icon";
const TabIcon = ({ source }: { source: ImageSourcePropType }) => (
  <View>
    <View>
      <Image source={source} />
    </View>
  </View>
)
const service = {
  code: "0jfskfbfhs12311311313",
  name: "Bảo dưỡng",
  additionalService: "Thay vỏ xe",
  additionalQuantity: 1,
  additionalFee: 75_000,
  baseFee: 150_000,
  customer: "Nguyễn Văn Đậu",
  vehiclePlate: "29H-906.81",
  vehicleName: "Honda Air Black",
};

const formatCurrency = (amount: number) =>
  `${amount.toLocaleString("vi-VN")}đ`;

const qrFinders: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0, 14],
  [14, 0],
];

const isQrModuleDark = (row: number, column: number) => {
  for (const [top, left] of qrFinders) {
    if (row >= top && row < top + 7 && column >= left && column < left + 7) {
      const innerRow = row - top;
      const innerColumn = column - left;
      return (
        innerRow === 0 ||
        innerRow === 6 ||
        innerColumn === 0 ||
        innerColumn === 6 ||
        (innerRow >= 2 &&
          innerRow <= 4 &&
          innerColumn >= 2 &&
          innerColumn <= 4)
      );
    }
  }

  return (row * 7 + column * 11 + row * column) % 5 < 2;
};

const QrCodeSample = () => (
  <View
    className="flex-row flex-wrap"
    accessibilityLabel="Mã QR thanh toán mẫu"
    accessible
  >
    {Array.from({ length: 21 * 21 }, (_, index) => {
      const row = Math.floor(index / 21);
      const column = index % 21;
      return (
        <View
          key={`${row}-${column}`}
          className={`h-2 w-2 ${isQrModuleDark(row, column) ? "bg-black" : "bg-white"}`}
        />
      );
    })}
  </View>
);

const BillIcon = ({
  source,
}: {
  source: ImageSourcePropType;
}) => <Image source={source} className="h-6 w-6" resizeMode="contain" />;

const BillRow = ({
  source,
  title,
  value,
  valueClassName = "text-black",
}: {
  source: ImageSourcePropType;
  title: string;
  value?: string;
  valueClassName?: string;
}) => (
  <View className="mb-3 flex-row items-center">
    <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#e5edf2]">
      <BillIcon source={source} />
    </View>
    <View className={`flex-1 ${value ? "" : "justify-center"}`}>
      <Text className="font-Jakarta-Bold text-base text-[#858585]">{title}</Text>
      {value ? (
        <Text
          className={`mt-0.5 font-Jakarta-Bold text-base ${valueClassName}`}
        >
          {value}
        </Text>
      ) : null}
    </View>
  </View>
);

const Bill = () => {
  const [isPaid, setIsPaid] = useState(false);
  const [rating, setRating] = useState(3);
  const [review, setReview] = useState("");
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const total = service.baseFee + service.additionalFee;

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-[#f5f5f5]"
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
    >
      <View className="flex-row items-center justify-center bg-[#9dccf5] px-5 py-4">
        <Pressable
          className="absolute left-3 h-10 w-10 items-center justify-center rounded-full bg-white"
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={8}
          onPress={() => router.back()}
        >
          <BillIcon source={icons.backarrow} />
        </Pressable>
        <Text
          className={`px-12 text-center font-Jakarta-Bold text-black ${isPaid ? "text-base" : "text-xl"}`}
        >
          {isPaid ? "Hóa đơn và đánh giá dịch vụ" : "Hóa đơn"}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-2 flex-row items-center bg-white px-5 py-4">
          <Text className="mr-3 font-Jakarta-Bold text-lg text-black">
            Mã dịch vụ:
          </Text>
          <Text className="flex-1 text-right font-Jakarta text-base text-[#858585]">
            {service.code}
          </Text>
        </View>

        <View className="mt-2 bg-white px-[18px] pb-2 pt-3">
          <View className="mb-2 flex-row items-center">
            <Text className="font-Jakarta-Bold text-lg text-black">
              Dịch vụ
            </Text>
            <Text className="ml-2 font-Jakarta text-lg text-[#858585]">
              ({service.name})
            </Text>
          </View>

          <Text className="mb-2 font-Jakarta-Bold text-lg text-black">
            Phí dịch vụ bổ sung
          </Text>
          <View className="mb-3 flex-row items-center justify-between rounded-3xl bg-[#f1f1f1] px-4 py-3">
            <View>
              <Text className="font-Jakarta-Bold text-base text-black">
                {service.additionalService}
              </Text>
              <Text className="mt-1 font-Jakarta-Bold text-sm text-[#858585]">
                Số lượng: {service.additionalQuantity}
              </Text>
            </View>
            <Text className="font-Jakarta-Bold text-base text-[#39749c]">
              {formatCurrency(service.additionalFee)}
            </Text>
          </View>

          <BillRow
            source={icons.dolar}
            title="Phí cơ bản"
            value={formatCurrency(service.baseFee)}
          />
          <BillRow
            source={icons.total}
            title="Tổng cộng"
            value={formatCurrency(total)}
            valueClassName={isPaid ? "text-green-500" : "text-red-500"}
          />
          <BillRow
            source={icons.payment}
            title="Tiền mặt/VNPay/Momo"
            value=""
          />
          <View className="mb-1 flex-row items-center">
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#e5edf2]">
              <Text
                className={`text-2xl font-Jakarta-Bold ${isPaid ? "text-green-500" : "text-red-500"}`}
              >
                {isPaid ? <TabIcon source={icons.donePay} /> : <TabIcon source={icons.pending} />}
              </Text>
            </View>
            <View>
              <Text className="font-Jakarta-Bold text-base text-[#858585]">
                {isPaid ? "Hoàn thành" : "Đang thanh toán"}
              </Text>
              {isPaid && (
                <Text className="mt-0.5 font-Jakarta-Bold text-sm text-black">
                  22/10/2026, 14:30
                </Text>
              )}
            </View>
          </View>
        </View>

        {!isPaid ? (
          <View className="mt-2 items-center px-6 py-6">
            <View className="items-center bg-white px-6 py-5">
              <QrCodeSample />
              <Text className="mt-3 font-Jakarta-Bold text-base text-black">
                {service.customer}
              </Text>
              <Text className="mt-1 font-Jakarta text-xs text-[#858585]">
                QR thanh toán mẫu
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              className="mt-5 w-full items-center rounded-xl bg-[#a8ddf8] px-4 py-4"
              onPress={() => setIsPaid(true)}
            >
              <Text className="font-Jakarta-Bold text-lg text-black">
                Xác nhận thanh toán
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="mt-2 flex-row items-center bg-white px-5 py-4">
              <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-[#d9ecff]">
                <Text className="font-Jakarta-Bold text-2xl text-[#39749c]">
                  N
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-Jakarta-Bold text-lg text-black">
                  {service.customer}
                </Text>
                <View className="mt-1 flex-row flex-wrap items-center">
                  <Text className="mr-2 rounded-xl bg-black px-2 py-1 font-Jakarta-Bold text-base text-white">
                    {service.vehiclePlate}
                  </Text>
                  <Text className="font-Jakarta-Bold text-base text-[#626262]">
                    {service.vehicleName}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-2 items-center px-5 pb-5 pt-3">
              <View className="mb-3 flex-row">
                {Array.from({ length: 5 }, (_, index) => {
                  const star = index + 1;
                  return (
                    <Pressable
                      key={star}
                      accessibilityRole="button"
                      accessibilityLabel={`${star} sao`}
                      accessibilityState={{ selected: star === rating }}
                      className="mx-1 px-1"
                      onPress={() => {
                        setRating(star);
                        setIsReviewSubmitted(false);
                      }}
                    >
                      <Text
                        className={`text-4xl ${star <= rating ? "text-[#ffb900]" : "text-[#777777]"}`}
                      >
                        ★
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                accessibilityLabel="Nhận xét về dịch vụ"
                className="h-44 w-full rounded-3xl bg-white px-4 py-4 font-Jakarta text-base text-black"
                multiline
                placeholder="Hãy chia sẻ cảm nhận về dịch vụ và thợ nhé!"
                placeholderTextColor="#b5b5b5"
                textAlignVertical="top"
                value={review}
                onChangeText={(text) => {
                  setReview(text);
                  setIsReviewSubmitted(false);
                }}
              />
              <Pressable
                accessibilityRole="button"
                className="mt-5 w-[92%] items-center rounded-xl bg-[#a8ddf8] px-4 py-4"
                onPress={() => setIsReviewSubmitted(true)}
              >
                <Text className="font-Jakarta-Bold text-lg text-black">
                  {isReviewSubmitted ? "Đã gửi đánh giá" : "Gửi bản đánh giá"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Bill;

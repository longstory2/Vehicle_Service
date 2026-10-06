import { router } from "expo-router";
import { useRef,useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { onboarding } from "../../../constants";

const Home = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<Swiper>(null);

  return (
    <SafeAreaView className="items-center bg-white" style={{ flex: 1, width: "100%" }}>
      <TouchableOpacity
        onPress={() => {
          router.replace("/(auth)/sign-up");
        }}
        className="w-full flex justify-end items-end p-5"
      >
        <Text className="text-black text-md font-JakartaBold">Skip</Text>
      </TouchableOpacity>
 <Swiper
        ref={swiperRef}
        loop={false}
        dot={
          <View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0] rounded-full" />
        }
        activeDot={
          <View className="w-[32px] h-[4px] mx-1 bg-[#0286FF] rounded-full" />
        }
        onIndexChanged={(index) => setActiveIndex(index)}
      >
        {onboarding.map((item) => (
          <View key={item.id} className="flex items-center justify-center p-5">
            <Image
              source={item.image}
              className="w-full h-[300px]"
              resizeMode="contain"
            />
            <View className="flex flex-row items-center justify-center w-full mt-10">
              <Text className="text-black text-3xl font-bold mx-10 text-center">
                {item.title}
              </Text>
            </View>
            <Text className="text-md font-JakartaSemiBold text-center text-[#858585] mx-10 mt-3">
              {item.description}
            </Text>
          </View>
        ))}
      </Swiper>
      {/* <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{ flexGrow: 1 }}
        onMomentumScrollEnd={(event) => {
          setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
      >
        {onboarding.map((item) => (
          <View
            key={item.id}
            style={{
              width,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
          >
            <Image
              source={item.image}
              resizeMode="contain"
              style={{ width: 250, height: 250, marginBottom: 32 }}
            />
            <Text
              style={{ color: "#000", fontSize: 24, fontWeight: "700", textAlign: "center" }}
            >
              {item.title}
            </Text>
            <Text
              style={{ color: "#666", fontSize: 16, textAlign: "center", marginTop: 12 }}
            >
              {item.description}
            </Text>
          </View>
        ))}
      </ScrollView> */}

      {/* <View style={{ flexDirection: "row", marginBottom: 24 }}>
        {onboarding.map((item, index) => (
          <View
            key={item.id}
            style={{
              width: 32,
              height: 4,
              marginHorizontal: 4,
              borderRadius: 999,
              backgroundColor: index === activeIndex ? "#0286FF" : "#E2E8F0",
            }}
          />
        ))}
      </View> */}
    </SafeAreaView>
  );
};

export default Home;
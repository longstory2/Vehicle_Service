import { Text,Image, ScrollView, View } from "react-native";
import { icons, images } from "../../../constants/index";
import InputField from "../../../components/InputField";
import { useState } from "react";
import CustomButton from "../../../components/CustomButton";
import { Link } from "expo-router";
import OAuth from "../../../components/OAuth";

const SignUp = () => {
  const [form, setForm] = useState ({
    phoneNumber: "",
    password: "",
  });

  const onSignUpPress = async () => {};

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 h-[250px] w-full" />
          <Text className="absolute bottom-5 left-5 text-2xl text-black font-JakartaSemiBold">
            Tạo tài khoản
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            maxLength={10}
            icon={icons.person}
            value={form.phoneNumber}
            keyboardType="phone-pad"
            onChangeText={(value) => setForm({ ...form, phoneNumber: value })}
          />
          
          <InputField
            label="mật khẩu"
            placeholder="Nhập mật khẩu"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />

          <CustomButton title="Đăng ký" onPress={onSignUpPress} className="mt-6"/>

          {/* OAtuth các loại đăng ký khác */}

          <OAuth />
          <CustomButton title="Kỹ thuật viên" onPress={onSignUpPress} className="mt-6"/>
          <Link href={"/(auth)/sign-in"}
          className="text-lg text-center text-general-200 mt-10">Đã có tài khoản?
            <Text className="text-primary-500">Đăng nhập</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;
import { Text, Image, ScrollView, View, TextInput, Alert } from "react-native";
import { icons } from "../../../constants/icon";
import { images } from "../../../constants/index";
import InputField from "../../../components/InputField";
import { useState } from "react";
import CustomButton from "../../../components/CustomButton";
import { Link, router } from "expo-router";
import OAuth from "../../../components/OAuth";
import { useSignUp, useAuth } from "@clerk/expo";

const SignUp = () => {
  const mechanicSignInPress = async () => {
    router.replace("/(auth)/sign-in");
  };

  const { isLoaded, isSignedIn } = useAuth();
  const { signUp } = useSignUp();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSignUp = async () => {
    const { error } = await signUp.password({
      emailAddress,
      password,
      unsafeMetadata: { role: "customer" },
    });

    if (error) {
      // Handle the error in your app.
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      return;
    }

    const { error: sendError } =
      await signUp.verifications.sendEmailCode();

    if (sendError) {
      // Handle the error in your app.
      return;
    }

    setIsVerifying(true);
  };

  const handleVerify = async () => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });

    if (error) {
      // Handle the error in your app.
      return;
    }

    const { error: finalizeError } = await signUp.finalize();

    if (finalizeError) {
      // Handle the error in your app.
    }
  };

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return (
      <View>
        <Text>You're signed in</Text>
      </View>
    );
  }

  if (isVerifying) {
    return (
      <View>
        <TextInput
          value={code}
          placeholder="Enter your verification code"
          onChangeText={setCode}
          keyboardType="numeric"
        />
        <CustomButton
          title="Verify"
          onPress={handleVerify}
          className="mt-6"
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 h-[250px] w-full" />
          <Text className="absolute bottom-5 left-5 text-2xl text-black font-Jakarta-ExtraBold">
            Tạo tài khoản
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Nhập email"
            icon={icons.person}
            value={emailAddress}
            onChangeText={setEmailAddress}
            keyboardType="email-address"
          />
          <InputField
            label="mật khẩu"
            placeholder="Nhập mật khẩu"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={password}
            onChangeText={setPassword}
          />

          <CustomButton
            title="Đăng ký"
            onPress={handleSignUp}
            className="mt-6"
          />

          <OAuth />
          <CustomButton
            title="Đăng nhập với kỹ thuật viên"
            onPress={mechanicSignInPress}
            className="mt-6"
          />
          <Link
            href="/(auth)/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            <Text>Đã có tài khoản? </Text>
            <Text className="text-blue-500">Đăng nhập</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;
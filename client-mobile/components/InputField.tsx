import {
  Image,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  type ImageSourcePropType,
  type TextInputProps,
} from "react-native";

type InputFieldProps = TextInputProps & {
  label?: string;
  icon?: ImageSourcePropType;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
};

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  ...props
}: InputFieldProps) => (
  <KeyboardAvoidingView>
    <TouchableWithoutFeedback>
      <View className="my-2 w-full">
        <Text className={`text-lg mb-3 ${labelStyle}`}>
          {label}
        </Text>
        <View className={`flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500  ${containerStyle}`}>
          {icon && (
            <Image source={icon} className={`w-6 h-6 ml-4 ${iconStyle}`} />
          )}
          <TextInput
            className={`rounded-full p-4 text-[15px] flex-1 ${inputStyle} text-left`}
            secureTextEntry={secureTextEntry}
            {...props} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
);

export const FormInput = ({
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
    <Text className="mb-1.5 text-[16px] text-black">
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

// hiển thị tài khoản bên acoout.tsx (CustomerTab)
type AccountFieldProps = {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address";
  accessibilityLabel: string;
};

export const AccountField = ({
  label,
  value,
  onChangeText,
  editable = false,
  keyboardType = "default",
  accessibilityLabel,
}: AccountFieldProps) => (
  <View className="mb-2">
    <Text className="mb-1 text-lg text-black">{label}</Text>
    <TextInput
      accessibilityLabel={accessibilityLabel}
      className="h-12 rounded-xl bg-neutral-100 px-3 text-base text-black"
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType}
      autoCapitalize="none"
      maxLength={16}
    />
  </View>
);




export default InputField;

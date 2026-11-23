import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { apiRequest } from "../utils/api";
import { showAlert } from "../utils/notify";

const ChangePasswordModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const closeModal = () => {
        if (isSubmitting) return;
        setIsVisible(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert("Thiếu thông tin", "Vui lòng nhập đầy đủ cả ba mật khẩu.");
            return;
        }
        if (newPassword.length < 6) {
            showAlert("Mật khẩu chưa hợp lệ", "Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            showAlert("Mật khẩu không khớp", "Vui lòng xác nhận lại mật khẩu mới.");
            return;
        }
        if (newPassword === currentPassword) {
            showAlert("Mật khẩu chưa hợp lệ", "Mật khẩu mới phải khác mật khẩu hiện tại.");
            return;
        }

        setIsSubmitting(true);
        try {
            await apiRequest<void>("/auth/change-password", {
                method: "PUT",
                body: { currentPassword, newPassword },
            });
            setIsVisible(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            showAlert("Thành công", "Mật khẩu đã được thay đổi.");
        } catch (error) {
            showAlert(
                "Không thể đổi mật khẩu",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Pressable
                accessibilityRole="button"
                onPress={() => setIsVisible(true)}
                className="self-end py-1"
            >
                <Text className="text-m font-semibold text-[#1677a8]">Đổi mật khẩu</Text>
            </Pressable>

            <Modal
                visible={isVisible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    className="flex-1 justify-center bg-black/40 px-5 py-8"
                >
                    <View className="w-full rounded-2xl bg-white p-5">
                        <Text className="mb-4 text-center text-xl font-bold text-black">
                            Đổi mật khẩu
                        </Text>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <TextInput
                                accessibilityLabel="Mật khẩu hiện tại"
                                placeholder="Mật khẩu hiện tại"
                                placeholderTextColor="#777777"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                className="mb-3 h-12 rounded-xl border border-neutral-200 px-4 text-base text-black"
                            />
                            <TextInput
                                accessibilityLabel="Mật khẩu mới"
                                placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                                placeholderTextColor="#777777"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                className="mb-3 h-12 rounded-xl border border-neutral-200 px-4 text-base text-black"
                            />
                            <TextInput
                                accessibilityLabel="Xác nhận mật khẩu mới"
                                placeholder="Xác nhận mật khẩu mới"
                                placeholderTextColor="#777777"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                className="h-12 rounded-xl border border-neutral-200 px-4 text-base text-black"
                            />
                        </ScrollView>

                        <View className="mt-5 flex-row justify-end gap-3">
                            <Pressable
                                accessibilityRole="button"
                                disabled={isSubmitting}
                                onPress={closeModal}
                                className="items-center justify-center rounded-lg bg-neutral-100 px-4 py-3"
                            >
                                <Text className="text-black">Hủy</Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                disabled={isSubmitting}
                                onPress={handleChangePassword}
                                className={`items-center justify-center rounded-lg bg-[#a9e1ff] px-4 py-3 ${isSubmitting ? "opacity-50" : ""
                                    }`}
                            >
                                <Text className="font-semibold text-black">
                                    {isSubmitting ? "Đang lưu..." : "Xác nhận"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

export default ChangePasswordModal;

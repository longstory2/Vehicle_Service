# Client mobile cleanup

Ngày rà soát: 2026-10-29

Các mục dưới đây đã được loại bỏ sau khi kiểm tra toàn bộ tham chiếu trong
`client-mobile` (không tính `node_modules` và `.expo`):

## Mã nguồn

- `app.js`: entry cũ không được dùng; entry hiện tại là `expo-router/entry`
  trong `package.json`, các route nằm dưới `src/app`.
- `hooks/useBooking.ts`: file rỗng, không có export hoặc import nào.
- Thư mục `hooks/`: đã xóa sau khi file rỗng duy nhất được loại bỏ.
- Thư mục `assets/sounds/`: đã xóa vì không còn file âm thanh nào được dùng.

## Hình ảnh và âm thanh

- `assets/images/check.png`
- `assets/images/get-started.png`
- `assets/images/no-result.png`
- `assets/images/partial-react-logo.png`
- `assets/images/react-logo.png`
- `assets/images/react-logo@2x.png`
- `assets/images/react-logo@3x.png`
- `assets/images/QR Thanh Toan.png`
- `assets/icons/arrow-down.png`
- `assets/icons/arrow-up.png`
- `assets/icons/call.png`
- `assets/icons/check.png`
- `assets/icons/dollar.png`
- `assets/icons/donePay.png`
- `assets/icons/eyecross.png`
- `assets/icons/google.png`
- `assets/icons/main-screen-check.png`
- `assets/icons/messing.png`
- `assets/icons/pedding.png`
- `assets/icons/selected-marker.png`
- `assets/icons/techAvar.png`
- `assets/icons/total.png`
- `assets/sounds/new-order.mp3`

Các icon không còn dùng cũng đã được gỡ khỏi `constants/icon.ts`; trường
`QR` không còn dùng cũng đã được gỡ khỏi `constants/index.ts`.

## Font

Các font italic không được load trong `src/app/_layout.tsx` và không được
dùng trong source đã được loại bỏ khỏi `app.json` và thư mục `assets/fonts`:

- `PlusJakartaSans-BoldItalic.ttf`
- `PlusJakartaSans-ExtraBoldItalic.ttf`
- `PlusJakartaSans-ExtraLightItalic.ttf`
- `PlusJakartaSans-Italic.ttf`
- `PlusJakartaSans-LightItalic.ttf`
- `PlusJakartaSans-MediumItalic.ttf`
- `PlusJakartaSans-SemiBoldItalic.ttf`

## Dependency và cấu hình

Đã gỡ các dependency Expo không có import hoặc cấu hình sử dụng trực tiếp:

- `@expo/ui`
- `expo-audio`
- `expo-constants`
- `expo-device`
- `expo-glass-effect`
- `expo-image`
- `expo-linking`
- `expo-symbols`
- `expo-system-ui`
- `expo-web-browser`

Đồng thời đã xóa các plugin `expo-audio`, `expo-image` và
`expo-web-browser` khỏi `app.json`. `package-lock.json` được cập nhật bởi
`npm uninstall`.

Không xóa route, component, `node_modules` hoặc `.expo` chỉ dựa trên việc
không có import trực tiếp; các route được Expo Router nạp theo file-based
routing và các thư mục sinh ra cần được giữ nguyên.

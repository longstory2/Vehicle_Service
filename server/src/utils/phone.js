// Chuẩn hóa số điện thoại di động Việt Nam về dạng 10 số bắt đầu bằng 0 (ví dụ 0901234567)
// Nhận được cả "0901234567", "+84901234567", "84 901 234 567"
// Trả về null nếu không phải số di động Việt Nam hợp lệ
export const normalizePhone = (value) => {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, ""); // bỏ hết ký tự không phải số

  if (/^0[35789]\d{8}$/.test(digits)) return digits;
  if (/^84[35789]\d{8}$/.test(digits)) return `0${digits.slice(2)}`;
  return null;
};

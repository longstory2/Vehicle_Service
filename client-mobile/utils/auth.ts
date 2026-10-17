export const normalizeVietnamPhoneNumber = (value: string) => {
    const digits = value.trim().replace(/\D/g, "");

    if (/^0[35789]\d{8}$/.test(digits)) return `+84${digits.slice(1)}`;
    if (/^84[35789]\d{8}$/.test(digits)) return `+${digits}`;
    return null;
};

export const toLocalVietnamPhoneNumber = (value: string) =>
    value.startsWith("+84") ? `0${value.slice(3)}` : value;
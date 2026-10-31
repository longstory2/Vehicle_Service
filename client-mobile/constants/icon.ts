import home from '@/assets/icons/home.png';
import bell from "../assets/icons/bell.png";
import person from "../assets/icons/person.png";
import lock from "../assets/icons/lock.png";
import service from "../assets/icons/service.png"
import book from "../assets/icons/book.png";
import profile from "../assets/icons/profile.png";
import setting from "../assets/icons/setting.png";
import power from "../assets/icons/power.png";
import history from "../assets/icons/history.png";
import backarrow from "../assets/icons/back-arrow.png";
import payment from "../assets/icons/payment.png";
import sale from "../assets/icons/sale.png";
import location from "../assets/icons/pin.png"
import call from "../assets/icons/call.png"
import message from "../assets/icons/message.png"
import info from "../assets/icons/Info.png"
import techAvatar from "../assets/icons/TechAvartar.png"
import carInfo from "../assets/icons/icon.png"
export const icons = {
    home,
    bell,
    profile,
    person,
    lock,
    service,
    book,
    setting,
    power,
    history,
    backarrow,
    payment,
    sale,
    location,
    call,
    message,
    info,
    techAvatar,
    carInfo,
} as const;

export type IconKey = keyof typeof icons;
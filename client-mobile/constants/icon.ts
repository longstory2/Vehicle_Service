import home from '@/assets/icons/home.png';
import bell from "../assets/icons/bell.png";
import person from "../assets/icons/person.png";
import lock from "../assets/icons/lock.png";
import google from "../assets/icons/google.png";
import service from "../assets/icons/service.png"
import book from "../assets/icons/book.png";
import profile from "../assets/icons/profile.png";
import setting from "../assets/icons/setting.png";
import power from "../assets/icons/power.png";
import history from "../assets/icons/history.png"

export const icons = {
    home,
    bell,
    profile,
    person,
    lock,
    google,
    service,
    book,
    setting,
    power,
    history,
} as const;

export type IconKey = keyof typeof icons;
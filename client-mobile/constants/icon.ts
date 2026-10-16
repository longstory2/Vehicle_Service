import home from '@/assets/icons/home.png';
import bell from "../assets/icons/bell.png";
import person from "../assets/icons/person.png";
import lock from "../assets/icons/lock.png";
import google from "../assets/icons/google.png";
import service from "../assets/icons/service.png"
import book from "../assets/icons/book.png";
import profile from "../assets/icons/profile.png";

export const icons = {
    home,
    bell,
    profile,
    person,
    lock,
    google,
    service,
    book,
} as const;

export type IconKey = keyof typeof icons;
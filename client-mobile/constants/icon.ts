import home from '@/assets/icons/home.png';

export const icons = {
    home
} as const;

export type IconKey = keyof typeof icons;
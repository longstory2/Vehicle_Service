export const HO_CHI_MINH_BOUNDS = {
    south: 10.35,
    west: 106.35,
    north: 11.16,
    east: 107.05,
} as const;

export const isWithinHoChiMinhBounds = (latitude: number, longitude: number) =>
    latitude >= HO_CHI_MINH_BOUNDS.south &&
    latitude <= HO_CHI_MINH_BOUNDS.north &&
    longitude >= HO_CHI_MINH_BOUNDS.west &&
    longitude <= HO_CHI_MINH_BOUNDS.east;

export const NOMINATIM_HO_CHI_MINH_VIEWBOX = [
    HO_CHI_MINH_BOUNDS.west,
    HO_CHI_MINH_BOUNDS.north,
    HO_CHI_MINH_BOUNDS.east,
    HO_CHI_MINH_BOUNDS.south,
].join(",");

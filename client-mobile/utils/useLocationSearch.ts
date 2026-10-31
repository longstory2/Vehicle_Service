import { useRef, useState } from "react";
import {
    isWithinHoChiMinhBounds,
    NOMINATIM_HO_CHI_MINH_VIEWBOX,
} from "../constants/serviceArea";

export type PickupLocation = {
    latitude: number;
    longitude: number;
    address: string;
};

type NominatimResult = {
    lat: string;
    lon: string;
    display_name: string;
};

export const useLocationSearch = () => {
    const [pickupAddress, setPickupAddress] = useState("");
    const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
    const [locationError, setLocationError] = useState("");
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const lastSearchAt = useRef(0);

    const handlePickupAddressChange = (value: string) => {
        setPickupAddress(value);
        setPickupLocation(null);
        setLocationError("");
    };

    const setPickupLocationFromCoordinates = (latitude: number, longitude: number) => {
        if (!isWithinHoChiMinhBounds(latitude, longitude)) {
            setPickupLocation(null);
            setLocationError("Chỉ hỗ trợ vị trí trong khu vực TP.HCM.");
            return false;
        }

        const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setPickupAddress(address);
        setPickupLocation({ latitude, longitude, address });
        setLocationError("");
        return true;
    };

    const searchPickupLocation = async () => {
        const query = pickupAddress.trim();
        if (!query) {
            setLocationError("Nhập địa chỉ hoặc tên địa điểm trước khi tìm.");
            return;
        }
        if (Date.now() - lastSearchAt.current < 1000) {
            setLocationError("Vui lòng chờ một giây rồi thử tìm lại.");
            return;
        }

        lastSearchAt.current = Date.now();
        setIsSearchingLocation(true);
        setLocationError("");

        try {
            const url =
                `https://nominatim.openstreetmap.org/search?format=jsonv2` +
                `&limit=1&countrycodes=vn&bounded=1` +
                `&viewbox=${NOMINATIM_HO_CHI_MINH_VIEWBOX}` +
                `&accept-language=vi&q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "Accept-Language": "vi",
                    "User-Agent": "VehicleServiceMobile/1.0",
                },
            });

            if (!response.ok) {
                throw new Error(`Geocoding request failed: ${response.status}`);
            }

            const results: NominatimResult[] = await response.json();
            const result = results[0];
            if (!result) {
                setPickupLocation(null);
                setLocationError("Không tìm thấy địa chỉ. Hãy thử nhập tên đường hoặc quận.");
                return;
            }

            const latitude = Number(result.lat);
            const longitude = Number(result.lon);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                throw new Error("Geocoding returned invalid coordinates");
            }
            if (!isWithinHoChiMinhBounds(latitude, longitude)) {
                setPickupLocation(null);
                setLocationError("Chỉ hỗ trợ tìm vị trí trong khu vực TP.HCM.");
                return;
            }

            setPickupAddress(result.display_name);
            setPickupLocation({ latitude, longitude, address: result.display_name });
        } catch {
            setPickupLocation(null);
            setLocationError("Không thể tìm địa chỉ lúc này. Kiểm tra mạng rồi thử lại.");
        } finally {
            setIsSearchingLocation(false);
        }
    };

    return {
        pickupAddress,
        pickupLocation,
        locationError,
        isSearchingLocation,
        handlePickupAddressChange,
        setPickupLocationFromCoordinates,
        searchPickupLocation,
    };
};

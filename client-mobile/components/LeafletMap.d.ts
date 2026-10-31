import type { ComponentType } from "react";

type MapLocation = {
    latitude: number;
    longitude: number;
    address: string;
};

declare const LeafletMap: ComponentType<{
    location: MapLocation | null;
    technicianLocation?: Pick<MapLocation, "latitude" | "longitude"> | null;
    pickupLabel?: string;
}>;

export default LeafletMap;

"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AddressMapProps {
    location: { lat: number; lng: number };
}

function Recenter({ lat, lng }: { lat: number, lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 16);
    }, [lat, lng, map]);
    return null;
}

export default function AddressMap({ location }: AddressMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Fix Leaflet's default icon path issues
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    const customIcon = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Premium location pin icon
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            shadowSize: [41, 41],
            shadowAnchor: [12, 41]
        });
    }, []);

    if (!isMounted) return null;

    if (!location) return null;

    return (
        <div className="h-64 w-full rounded-xl overflow-hidden border border-blue-100 shadow-inner relative z-0 mt-4">
            <MapContainer center={[location.lat, location.lng]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.lat, location.lng]} icon={customIcon || undefined}>
                    <Popup>
                        <div className="text-center p-1">
                            <p className="font-bold text-gray-900 text-sm">Delivery Location</p>
                            <p className="text-[10px] text-gray-500">Your selected address</p>
                        </div>
                    </Popup>
                </Marker>
                <Recenter lat={location.lat} lng={location.lng} />
            </MapContainer>

            <div className="absolute bottom-2 right-2 z-[400] bg-white/90 backdrop-blur px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-[10px] font-bold text-gray-600">OpenStreetMap</p>
            </div>
        </div>
    );
}

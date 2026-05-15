"use client";
import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store, Home, Truck, Navigation, MapPin } from 'lucide-react';

interface MapProps {
    sellerLocation?: { lat: number; lng: number };
    customerLocation?: { lat: number; lng: number };
    deliveryLocation?: { lat: number; lng: number };
    orderStatus: string;
}

function BoundsHandler({ sellerLoc, customerLoc, deliveryLoc }: { sellerLoc?: any, customerLoc?: any, deliveryLoc?: any }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        const points: [number, number][] = [];

        // Ensure coordinates are valid numbers
        if (sellerLoc?.lat && typeof sellerLoc.lat === 'number' && typeof sellerLoc.lng === 'number') {
            points.push([sellerLoc.lat, sellerLoc.lng]);
        }
        if (customerLoc?.lat && typeof customerLoc.lat === 'number' && typeof customerLoc.lng === 'number') {
            points.push([customerLoc.lat, customerLoc.lng]);
        }
        if (deliveryLoc?.lat && typeof deliveryLoc.lat === 'number' && typeof deliveryLoc.lng === 'number') {
            points.push([deliveryLoc.lat, deliveryLoc.lng]);
        }

        try {
            if (points.length >= 2) {
                const bounds = L.latLngBounds(points);
                map.fitBounds(bounds, { padding: [50, 50] });
            } else if (points.length === 1) {
                map.setView(points[0], 13);
            }
        } catch (e) {
            console.error("Map Bounds Error:", e);
        }
    }, [map, sellerLoc, customerLoc, deliveryLoc]);

    return null;
}

export default function OrderMap({ sellerLocation, customerLocation, deliveryLocation, orderStatus }: MapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    const icons = useMemo(() => {
        if (typeof window === 'undefined') return null;
        try {
            return {
                sellerIcon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                }),
                customerIcon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/845/845022.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                }),
                deliveryIcon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/709/709790.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                })
            };
        } catch (e) {
            console.error("Error creating icons:", e);
            return null;
        }
    }, []);

    if (!isMounted) return null;

    // Default center (India) if no location is available
    const center: [number, number] =
        deliveryLocation?.lat && typeof deliveryLocation.lat === 'number' ? [deliveryLocation.lat, deliveryLocation.lng] :
            customerLocation?.lat && typeof customerLocation.lat === 'number' ? [customerLocation.lat, customerLocation.lng] :
                [23.0225, 72.5714];

    // Safe access to icons
    const sellerIcon = icons?.sellerIcon;
    const customerIcon = icons?.customerIcon;
    const deliveryIcon = icons?.deliveryIcon;

    return (
        <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative z-0">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {sellerLocation?.lat && typeof sellerLocation.lat === 'number' && sellerIcon && (
                    <Marker position={[sellerLocation.lat, sellerLocation.lng]} icon={sellerIcon as any}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-gray-800">Facility Location</p>
                                <p className="text-xs text-gray-500">Pickup Point</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {customerLocation?.lat && typeof customerLocation.lat === 'number' && customerIcon && (
                    <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon as any}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-gray-800">Your Location</p>
                                <p className="text-xs text-gray-500">Delivery Point</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {deliveryLocation?.lat && typeof deliveryLocation.lat === 'number' && deliveryIcon && (
                    <>
                        <Circle center={[deliveryLocation.lat, deliveryLocation.lng]} radius={300} pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.1 }} />
                        <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon as any}>
                            <Popup>
                                <div className="text-center">
                                    <p className="font-bold text-blue-600">Delivery Partner</p>
                                    <p className="text-xs text-gray-500">On the move</p>
                                </div>
                            </Popup>
                        </Marker>
                    </>
                )}

                {sellerLocation?.lat && customerLocation?.lat && (
                    <Polyline positions={[[sellerLocation.lat, sellerLocation.lng], [customerLocation.lat, customerLocation.lng]]} pathOptions={{ color: '#f97316', dashArray: '10, 10', opacity: 0.6, weight: 3 }} />
                )}

                <BoundsHandler sellerLoc={sellerLocation} customerLoc={customerLocation} deliveryLoc={deliveryLocation} />
            </MapContainer>

            <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Live Tracking</span>
            </div>
        </div>
    );
}
